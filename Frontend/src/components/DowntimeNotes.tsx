import { CleanShiftReport } from '../types';
import { FileText, Search, Clock, Copy, Check, AlertCircle } from 'lucide-react';
import { useState, useMemo } from 'react';
export function DowntimeNotes({ reports }: { reports: CleanShiftReport[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const rowsPerPage = 8;
  const notes = useMemo(() => {
    return reports
      .filter(r => r.downtime_items && r.downtime_items.trim().length > 0)
      .sort((a, b) => new Date(b.report_date).getTime() - new Date(a.report_date).getTime());
  }, [reports]);
  // Filtered by keyword search
  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes;
    const q = searchQuery.toLowerCase();
    return notes.filter(r => 
      (r.downtime_items && r.downtime_items.toLowerCase().includes(q)) ||
      (r.supervisor && r.supervisor.toLowerCase().includes(q)) ||
      (r.report_date && r.report_date.includes(q)) ||
      (r.line && r.line.includes(q))
    );
  }, [notes, searchQuery]);
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };
  if (notes.length === 0) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center min-h-[300px] text-center">
        <div className="p-3 bg-gray-50 rounded-full mb-3 text-gray-400">
          <FileText className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-gray-700">No Downtime Notes Recorded</h3>
        <p className="text-xs text-gray-400 mt-1">No production incidents or notes reported for this selection.</p>
      </div>
    );
  }
  const totalPages = Math.ceil(filteredNotes.length / rowsPerPage) || 1;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const currentNotes = filteredNotes.slice(startIndex, startIndex + rowsPerPage);
  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col min-h-[580px] justify-between">
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Downtime & Incident Log</h2>
              <p className="text-xs text-gray-500">Shift notes, stoppages, maintenance observations</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg self-start sm:self-auto">
            {filteredNotes.length} {filteredNotes.length === 1 ? 'Note' : 'Notes'}
          </span>
        </div>
        {/* Search input */}
        <div className="relative mb-4">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search notes by keyword, supervisor, line..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-gray-50/70 hover:bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4f7c5e]/40 focus:border-[#4f7c5e] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 font-bold"
            >
              ×
            </button>
          )}
        </div>
        {/* Notes list */}
        <div className="space-y-3.5">
          {currentNotes.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-xs italic">
              No downtime notes match "{searchQuery}"
            </div>
          ) : (
            currentNotes.map((r, i) => {
              const downtimeMins = r.total_downtime_computed_minutes || 0;
              const noteId = r.id || String(i);
              return (
                <div 
                  key={noteId} 
                  className="bg-white border border-gray-200/80 rounded-xl overflow-hidden shadow-2xs hover:shadow-xs transition-shadow"
                >
                  {/* Top card bar */}
                  <div className="bg-gray-50/90 px-3.5 py-2 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="font-bold text-gray-800">{r.report_date}</span>
                      <span className="bg-white border border-gray-200 px-1.5 py-0.5 rounded text-[10px] font-bold text-blue-700 uppercase">
                        Line {r.line}
                      </span>
                      <span className="bg-white border border-gray-200 px-1.5 py-0.5 rounded text-[10px] font-bold text-indigo-700 uppercase">
                        Shift {r.shift}
                      </span>
                      {downtimeMins > 0 && (
                        <span className="bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3" />
                          {downtimeMins} mins
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {r.supervisor && (
                        <span className="text-[11px] text-gray-500 font-medium">
                          Sup: <strong className="text-gray-700">{r.supervisor}</strong>
                        </span>
                      )}
                      <button
                        onClick={() => handleCopy(noteId, r.downtime_items)}
                        className="liquid-glass-btn p-1.5 rounded-full text-gray-500 hover:text-gray-900 cursor-pointer transition-all shadow-2xs"
                        title="Copy note text"
                      >
                        {copiedId === noteId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  {/* Body text */}
                  <div className="p-3.5">
                    <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-wrap leading-relaxed font-sans">
                      {r.downtime_items}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      {/* Pagination */}
      <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100 text-xs">
        <p className="text-gray-500">
          Showing <span className="font-semibold text-gray-800">{filteredNotes.length > 0 ? startIndex + 1 : 0}</span> to <span className="font-semibold text-gray-800">{Math.min(startIndex + rowsPerPage, filteredNotes.length)}</span> of <span className="font-semibold text-gray-800">{filteredNotes.length}</span> notes
        </p>
        <div className="flex items-center gap-1.5">
          <button 
            type="button"
            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="liquid-glass-btn px-3.5 py-1.5 rounded-full font-semibold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all shadow-2xs"
          >
            Prev
          </button>
          <span className="px-2 text-gray-500 font-mono font-bold">{currentPage}/{totalPages}</span>
          <button 
            type="button"
            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="liquid-glass-btn px-3.5 py-1.5 rounded-full font-semibold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all shadow-2xs"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
