import { useState, useRef, useEffect } from 'react';
import { Building2, Printer, Activity, Mail, LogOut } from 'lucide-react';

interface UserAvatarProps {
  onPrint?: () => void;
  onResetFilters?: () => void;
  userEmail?: string;
  onSignOut?: () => Promise<void>;
}

export function UserAvatar({ onPrint, userEmail, onSignOut }: UserAvatarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  async function handleSignOut() {
    if (!onSignOut) return;
    setIsSigningOut(true);
    setSignOutError(null);
    try {
      await onSignOut();
    } catch (error) {
      setSignOutError(error instanceof Error ? error.message : 'Could not sign out.');
    } finally {
      setIsSigningOut(false);
    }
  }

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="relative w-10 h-10 rounded-full bg-[#00562e] hover:bg-[#004521] text-white font-extrabold text-sm flex items-center justify-center tracking-wide shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7ac143] focus-visible:ring-offset-2 border border-white/80 select-none"
        title="Production Dashboard"
      >
        <span>PD</span>
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white shadow-2xs" />
      </button>

      {/* Crisp User Information Popover Dialog */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 sm:w-72 bg-white rounded-xl border border-gray-200 shadow-xl p-3.5 z-50 text-slate-900 animate-in fade-in zoom-in-95 duration-200">
          
          {/* Top Card Header */}
          <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
            {/* Avatar Square Pill */}
            <div className="w-10 h-10 rounded-full bg-[#00562e] font-extrabold text-sm text-white flex items-center justify-center shadow-sm shrink-0 border border-emerald-800">
              PD
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base text-gray-900 truncate tracking-tight">Production Dashboard</span>
              </div>
              <p className="text-xs font-mono text-gray-500 truncate flex items-center gap-1 mt-0.5">
                <Mail className="w-3 h-3 text-gray-400 shrink-0" />
                <span className="truncate">{userEmail || 'Supabase live data'}</span>
              </p>
            </div>
          </div>

          {/* Active Facility & Clearance Info */}
          <div className="py-2.5 space-y-2 text-xs border-b border-gray-100">
            <div className="flex items-center justify-between text-gray-600">
              <span className="flex items-center gap-1.5 text-gray-500 font-medium">
                <Building2 className="w-3.5 h-3.5 text-emerald-600" /> Account
              </span>
              <span className="font-bold text-gray-900">RePET Inc.</span>
            </div>

            <div className="flex items-center justify-between text-gray-600">
              <span className="flex items-center gap-1.5 text-gray-500 font-medium">
                <Activity className="w-3.5 h-3.5 text-amber-600" /> Access
              </span>
              <span className="font-semibold text-gray-800">Read-only</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="pt-3 space-y-1.5">
            {signOutError && (
              <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                {signOutError}
              </p>
            )}
            {onPrint && (
              <button
                type="button"
                onClick={() => {
                  onPrint();
                  setIsOpen(false);
                }}
                className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-gray-800 bg-gray-50 hover:bg-gray-100 border border-gray-200/80 rounded-xl transition-all cursor-pointer flex items-center justify-between shadow-2xs hover:border-gray-300"
              >
                <span className="flex items-center gap-2">
                  <Printer className="w-3.5 h-3.5 text-blue-600" />
                  <span>Print Executive Summary</span>
                </span>
                <span className="text-[10px] font-extrabold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-200/60 font-mono">PDF</span>
              </button>
            )}
            {onSignOut && (
              <button
                type="button"
                onClick={() => void handleSignOut()}
                disabled={isSigningOut}
                className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-gray-800 hover:bg-gray-100 border border-transparent rounded-xl transition-all cursor-pointer flex items-center gap-2 disabled:cursor-wait disabled:opacity-60"
              >
                <LogOut className="w-3.5 h-3.5 text-gray-500" />
                {isSigningOut ? 'Signing out…' : 'Sign out'}
              </button>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
