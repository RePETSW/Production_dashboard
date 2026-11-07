/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import Papa from 'papaparse';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';
import { parseData } from './utils/data-processing';
import { Dashboard } from './components/Dashboard';
import { AuthGate } from './components/AuthGate';

type DashboardData = ReturnType<typeof parseData>;

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [justSynced, setJustSynced] = useState(false);
  const syncIndicatorTimeout = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      setIsCheckingSession(false);
      if (nextSession) setAuthError(null);
    });

    void supabase.auth.getSession().then(({ data: { session: currentSession }, error }) => {
      if (!active) return;
      if (error) setAuthError(error.message);
      else setSession(currentSession);
      setIsCheckingSession(false);
    }).catch((error: unknown) => {
      if (!active) return;
      setAuthError(error instanceof Error ? error.message : 'Could not check the sign-in session.');
      setIsCheckingSession(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Could not start Google sign-in.');
    } finally {
      setIsSigningIn(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  const refreshData = useCallback(async (signal?: AbortSignal) => {
    setIsSyncing(true);
    setLoadError(null);
    setJustSynced(false);

    try {
      const selectAll = (table: string) => {
        const query = supabase.from(table).select('*');
        return signal ? query.abortSignal(signal) : query;
      };
      const [reports, bladeChanges, rewashBags, waterUsage] = await Promise.all([
        selectAll('shift_reports'),
        selectAll('blade_changes'),
        selectAll('rewash_bags'),
        selectAll('purple_pipe_wastewater_readings'),
      ]);

      const tableErrors = [
        { table: 'shift_reports', error: reports.error },
        { table: 'blade_changes', error: bladeChanges.error },
        { table: 'rewash_bags', error: rewashBags.error },
        { table: 'purple_pipe_wastewater_readings', error: waterUsage.error },
      ];
      const failures = tableErrors
        .filter(({ error }) => error)
        .map(({ table, error }) => `${table}: ${error.message}`);

      if (failures.length > 0) throw new Error(failures.join('; '));
      if (signal?.aborted) return;

      setData(parseData(
        Papa.unparse(reports.data ?? []),
        Papa.unparse(bladeChanges.data ?? []),
        Papa.unparse(rewashBags.data ?? []),
        Papa.unparse(waterUsage.data ?? [])
      ));

      if (syncIndicatorTimeout.current !== null) {
        window.clearTimeout(syncIndicatorTimeout.current);
      }
      setJustSynced(true);
      syncIndicatorTimeout.current = window.setTimeout(() => setJustSynced(false), 2000);
    } catch (error) {
      if (!signal?.aborted) {
        setLoadError(error instanceof Error ? error.message : 'An unexpected error occurred while loading Supabase data.');
      }
    } finally {
      if (!signal?.aborted) setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    if (!session) {
      setData(null);
      setLoadError(null);
      setIsSyncing(false);
      return;
    }

    const controller = new AbortController();
    void refreshData(controller.signal);
    return () => {
      controller.abort();
      if (syncIndicatorTimeout.current !== null) {
        window.clearTimeout(syncIndicatorTimeout.current);
      }
    };
  }, [refreshData, session]);

  if (isCheckingSession) {
    return (
      <div className="dark-mode-page min-h-screen flex items-center justify-center bg-[#fafafa]">
        <div role="status" aria-label="Checking sign-in session" className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4f7c5e]" />
      </div>
    );
  }

  if (!session) {
    return <AuthGate error={authError} isSigningIn={isSigningIn} onSignIn={signInWithGoogle} />;
  }

  if (!data) {
    return (
      <div className="dark-mode-page min-h-screen flex items-center justify-center bg-[#fafafa]">
        {loadError ? (
          <div role="alert" className="max-w-xl rounded-xl border border-red-200 bg-white p-6 text-center shadow-sm">
            <p className="font-semibold text-red-800">Could not load dashboard data from Supabase.</p>
            <p className="mt-2 text-sm text-red-700">{loadError}</p>
            <button
              type="button"
              onClick={() => void refreshData()}
              disabled={isSyncing}
              className="mt-4 rounded-lg bg-[#00562e] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              Retry
            </button>
          </div>
        ) : (
          <div role="status" aria-label="Loading dashboard data" className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4f7c5e]" />
        )}
      </div>
    );
  }

  const tableCounts = [
    { table: 'shift_reports', rowCount: data.reports.length },
    { table: 'blade_changes', rowCount: data.bladeChanges.length },
    { table: 'rewash_bags', rowCount: data.rewashBags.length },
    { table: 'purple_pipe_wastewater_readings', rowCount: data.waterUsage.length },
  ];
  const emptyTables = tableCounts.filter(({ rowCount }) => rowCount === 0).map(({ table }) => table);

  return (
    <Dashboard
      reports={data.reports}
      bladeChanges={data.bladeChanges}
      rewashBags={data.rewashBags}
      waterUsage={data.waterUsage}
      onRefreshData={refreshData}
      isSyncing={isSyncing}
      justSynced={justSynced}
      loadError={loadError}
      emptyTables={emptyTables}
      userEmail={session.user.email ?? ''}
      onSignOut={signOut}
    />
  );
}
