import { Recycle } from 'lucide-react';
export function Logo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img 
        src="/assets/aistudio/RePET_Logo_bd53e4f5.png" 
        alt="RePET Inc. Logo" 
        className="h-8 sm:h-9 w-auto object-contain shrink-0 drop-shadow-2xs"
        onError={(e) => {
          // Fallback if image fails to load
          e.currentTarget.style.display = 'none';
        }}
      />
    </div>
  );
}
