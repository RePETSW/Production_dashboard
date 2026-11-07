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

type DashboardData = ReturnType<typeof parseData>;
type DashboardHandoff = { user_id: string; access_token: string; refresh_token: string };
const PRODUCTION_SYSTEM_HUB_URL = 'https://production-system-hub.vercel.app';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [justSynced, setJustSynced] = useState(false);
  const syncIndicatorTimeout = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    const handoffCode = new URLSearchParams(window.location.hash.slice(1)).get('handoff');
    if (handoffCode) {
      window.history.replaceState({}, document.title, `${window.location.pathname}${window.location.search}`);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      if (nextSession) setAuthError(null);
    });

    const initializeSession = async () => {
      try {
        if (handoffCode) {
          const { data, error } = await supabase.functions.invoke<DashboardHandoff>(
            'redeem-dashboard-handoff',
            { body: { code: handoffCode } },
          );
          if (error) throw error;
          if (!data?.user_id || !data.access_token || !data.refresh_token) {
            throw new Error('The Production System Hub returned an invalid session handoff.');
          }

          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: data.access_token,
            refresh_token: data.refresh_token,
          });
          if (sessionError) throw sessionError;
          if (sessionData.session?.user.id !== data.user_id) {
            await supabase.auth.signOut();
            throw new Error('The Production System Hub session did not match the handoff.');
          }
          if (active) setSession(sessionData.session);
        } else {
          const { data, error } = await supabase.auth.getSession();
          if (error) throw error;
          if (active) setSession(data.session);
        }
      } catch (error) {
        if (active) {
          setAuthError(error instanceof Error ? error.message : 'Could not verify the Production System Hub session.');
        }
      } finally {
        if (active) setIsCheckingSession(false);
      }
    };
    void initializeSession();

    return () => {
      active = false;
      subscription.unsubscribe();
    };
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

  useEffect(() => {
    if (!isCheckingSession && !session && !authError) {
      window.location.replace(`${PRODUCTION_SYSTEM_HUB_URL}/?destination=dashboard`);
    }
  }, [authError, isCheckingSession, session]);

  if (isCheckingSession) {
    return (
      <div className="dark-mode-page min-h-screen flex items-center justify-center bg-[#fafafa]">
        <div role="status" aria-label="Verifying Production System Hub session" className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4f7c5e]" />
      </div>
    );
  }

  if (authError && !session) {
    return (
      <main className="dark-mode-page min-h-screen flex items-center justify-center bg-[#f8fafc] px-4 py-10">
        <section role="alert" className="w-full max-w-xl rounded-xl border border-red-200 bg-white p-6 text-center shadow-sm">
          <h1 className="font-semibold text-red-800">Could not verify your Production System Hub session.</h1>
          <p className="mt-2 text-sm text-red-700">{authError}</p>
          <a
            href={`${PRODUCTION_SYSTEM_HUB_URL}/?destination=dashboard`}
            className="mt-4 inline-flex rounded-lg bg-[#00562e] px-4 py-2 text-sm font-semibold text-white"
          >
            Return to Production System Hub
          </a>
        </section>
      </main>
    );
  }

  if (!session) {
    return (
      <div className="dark-mode-page min-h-screen flex items-center justify-center bg-[#fafafa]">
        <div role="status" aria-label="Returning to Production System Hub" className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4f7c5e]" />
      </div>
    );
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
    />
  );
}
