import { useState } from 'react';
import { Search, LayoutGrid, SlidersHorizontal, BarChart3, Wrench, FileSpreadsheet, Moon, Sun, HelpCircle } from 'lucide-react';
interface FloatingDockProps {
  onNavigate: (sectionId: string) => void;
  activeSection?: string;
}
export function FloatingDock({ onNavigate, activeSection = 'analytics' }: FloatingDockProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const toggleMode = () => {
    setIsDarkMode(prev => !prev);
    // Smooth visual feedback
    document.documentElement.classList.toggle('dark');
  };
  const navItems = [
    { id: 'search', label: 'Quick Search', icon: Search, action: () => setShowSearchModal(true) },
    { id: 'analytics', label: 'Analytics & KPIs', icon: BarChart3, action: () => onNavigate('analytics-section') },
    { id: 'dashboard', label: 'Performance Targets', icon: LayoutGrid, action: () => onNavigate('targets-section') },
    { id: 'filters', label: 'Filter Shift Reports', icon: SlidersHorizontal, action: () => onNavigate('filters-section') },
    { id: 'blade-changes', label: 'Blade Change Log', icon: Wrench, action: () => onNavigate('blade-change-section') },
    { id: 'production-log', label: 'Shift Master Log', icon: FileSpreadsheet, action: () => onNavigate('production-log-section') },
  ];
  return (
    <>
      {/* Vertical Floating Capsule Dock on the far left (matches the picture) */}
      <nav 
        aria-label="Quick Actions Dock"
        className="fixed left-4 top-1/2 -translate-y-1/2 z-40 hidden xl:flex flex-col items-center bg-[#18191f] text-gray-400 p-2 rounded-full shadow-2xl border border-white/10 gap-2.5 backdrop-blur-md transition-all duration-300 hover:scale-[1.02]"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={item.action}
              title={item.label}
              aria-label={item.label}
              className={`relative p-2.5 rounded-full transition-all duration-300 cursor-pointer group flex items-center justify-center ${
                isActive 
                  ? 'bg-white/15 text-white shadow-inner' 
                  : 'hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
              {/* Sleek Tooltip on hover */}
              <span className="pointer-events-none absolute left-full ml-3.5 px-2.5 py-1 bg-[#18191f] text-white text-[11px] font-semibold rounded-lg shadow-xl border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                {item.label}
              </span>
            </button>
          );
        })}
        {/* Separator hairline */}
        <div className="w-4 h-px bg-white/15 my-1" />
        {/* Dark/Light mode toggle */}
        <button
          type="button"
          onClick={toggleMode}
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to High-Contrast / Night Mode'}
          aria-label="Toggle theme mode"
          className="relative p-2.5 rounded-full text-gray-400 hover:text-amber-300 hover:bg-white/10 transition-colors cursor-pointer group flex items-center justify-center"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4" />}
          <span className="pointer-events-none absolute left-full ml-3.5 px-2.5 py-1 bg-[#18191f] text-white text-[11px] font-semibold rounded-lg shadow-xl border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
            {isDarkMode ? 'Light Mode' : 'Night Mode'}
          </span>
        </button>
      </nav>
      {/* Quick Search Modal when search icon is clicked */}
      {showSearchModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setShowSearchModal(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-5 max-w-lg w-full space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
              <Search className="w-5 h-5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Jump to date, shift, supervisor, grinder, or note..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none"
              />
              <button 
                type="button"
                onClick={() => setShowSearchModal(false)}
                className="liquid-glass-btn text-xs font-bold text-slate-800 px-3 py-1 rounded-full cursor-pointer transition-all"
              >
                ESC
              </button>
            </div>
            <div className="text-xs text-gray-500 space-y-2">
              <p className="font-semibold text-gray-400 uppercase text-[10px] tracking-wider">Quick Jump Links</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { onNavigate('analytics-section'); setShowSearchModal(false); }}
                  className="liquid-glass-btn p-2.5 text-left rounded-2xl transition-all cursor-pointer"
                >
                  <p className="font-bold text-slate-900">Analytics & KPIs</p>
                  <p className="text-[11px] text-gray-500">Yield, output MT & bales</p>
                </button>
                <button
                  type="button"
                  onClick={() => { onNavigate('filters-section'); setShowSearchModal(false); }}
                  className="liquid-glass-btn p-2.5 text-left rounded-2xl transition-all cursor-pointer"
                >
                  <p className="font-bold text-slate-900">Shift Filters</p>
                  <p className="text-[11px] text-gray-500">Date, supervisor, shift, line</p>
                </button>
                <button
                  type="button"
                  onClick={() => { onNavigate('blade-change-section'); setShowSearchModal(false); }}
                  className="liquid-glass-btn p-2.5 text-left rounded-2xl transition-all cursor-pointer"
                >
                  <p className="font-bold text-slate-900">Blade Changes</p>
                  <p className="text-[11px] text-gray-500">Grinders 1, 2, 3 maint logs</p>
                </button>
                <button
                  type="button"
                  onClick={() => { onNavigate('production-log-section'); setShowSearchModal(false); }}
                  className="liquid-glass-btn p-2.5 text-left rounded-2xl transition-all cursor-pointer"
                >
                  <p className="font-bold text-slate-900">Shift Production Log</p>
                  <p className="text-[11px] text-gray-500">Full master CSV dataset</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
