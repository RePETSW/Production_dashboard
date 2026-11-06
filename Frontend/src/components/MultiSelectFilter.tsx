import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

interface MultiSelectFilterProps {
  label: string;
  options: { value: string; label: string }[];
  value: string[];
  onChange: (value: string[]) => void;
  className?: string;
  panelClassName?: string;
}

export function MultiSelectFilter({
  label,
  options,
  value,
  onChange,
  className = '',
  panelClassName = '',
}: MultiSelectFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const toggleOption = (option: string) => {
    onChange(value.includes(option)
      ? value.filter(item => item !== option)
      : [...value, option]);
  };

  return (
    <div className="relative min-w-0" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(open => !open)}
        aria-label={`${label}: ${value.length ? `${value.length} selected` : 'all'}`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={`w-full inline-flex items-center justify-between gap-2 text-left ${className}`}
      >
        <span className="truncate">
          {value.length ? `${label} (${value.length})` : `All ${label}`}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label={`Select ${label}`}
          aria-multiselectable="true"
          className={`absolute left-0 top-full z-50 mt-1.5 w-full min-w-48 max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl ${panelClassName}`}
        >
          {options.map(option => {
            const isSelected = value.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => toggleOption(option.value)}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-gray-700 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
              >
                <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                  isSelected ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-gray-300 bg-white'
                }`}>
                  {isSelected && <Check className="h-3 w-3" />}
                </span>
                <span className="min-w-0 truncate">{option.label}</span>
              </button>
            );
          })}
          {value.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="mt-1 w-full border-t border-gray-100 px-2.5 py-2 text-left text-xs font-semibold text-emerald-800 hover:bg-emerald-50"
            >
              Clear selection
            </button>
          )}
        </div>
      )}
    </div>
  );
}
