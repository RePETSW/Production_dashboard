import { LoaderCircle, LockKeyhole } from 'lucide-react';
import { Logo } from './Logo';

interface AuthGateProps {
  error: string | null;
  isSigningIn: boolean;
  onSignIn: () => void;
}

export function AuthGate({ error, isSigningIn, onSignIn }: AuthGateProps) {
  return (
    <main className="dark-mode-page min-h-screen flex items-center justify-center bg-[#f8fafc] px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-lg">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-[#00562e]">
          <LockKeyhole className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Sign in to Production Dashboard</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Sign in with an authorized account to view production data.
        </p>
        {error && (
          <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-left text-sm text-red-800">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={onSignIn}
          disabled={isSigningIn}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#00562e] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#004521] disabled:cursor-wait disabled:opacity-70"
        >
          {isSigningIn ? (
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <GoogleMark />
          )}
          {isSigningIn ? 'Connecting to Google…' : 'Continue with Google'}
        </button>
        <p className="mt-4 text-xs text-slate-500">
          Access is controlled by your Supabase authentication and row-level security policies.
        </p>
      </section>
    </main>
  );
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 rounded-full bg-white p-0.5">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.15v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.15a11 11 0 0 0 0 9.9l3.69-2.84Z" />
      <path fill="#EA4335" d="M12 5.36c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.85 6.05l3.69 2.84C6.71 7.29 9.14 5.36 12 5.36Z" />
    </svg>
  );
}