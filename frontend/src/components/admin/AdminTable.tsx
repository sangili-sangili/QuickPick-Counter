import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Inbox,
  RefreshCw,
  Check,
} from 'lucide-react';

export interface TableColumn<T> {
  key: string;
  header: string;
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
  render?: (item: T, index: number) => React.ReactNode;
  accessor?: (item: T) => string | number | boolean | null | undefined;
}

export interface FilterOption {
  label: string;
  value: string;
}

export interface AdminTableProps<T> {
  title?: string;
  subtitle?: string;
  data: T[];
  columns: TableColumn<T>[];
  keyExtractor: (item: T, index: number) => string;
  searchPlaceholder?: string;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  filterOptions?: FilterOption[];
  selectedFilter?: string;
  onFilterChange?: (val: string) => void;
  filterLabel?: string;
  actionButton?: React.ReactNode;
  exportFileName?: string;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  initialPageSize?: number;
  pageSizeOptions?: number[];
  showSerial?: boolean;
  onRowClick?: (item: T) => void;
  onExportSuccess?: (filename: string) => void;
}

export function AdminTable<T>({
  title,
  subtitle,
  data,
  columns,
  keyExtractor,
  searchPlaceholder = 'Search records...',
  searchQuery: controlledSearch,
  onSearchChange,
  filterOptions,
  selectedFilter: controlledFilter,
  onFilterChange,
  filterLabel = 'Filter by',
  actionButton,
  exportFileName = 'export_data',
  isLoading = false,
  error = null,
  onRetry,
  emptyTitle = 'No records found',
  emptyDescription = 'Try adjusting your search criteria or filter to find what you are looking for.',
  initialPageSize = 10,
  pageSizeOptions = [5, 10, 20, 50],
  showSerial = true,
  onRowClick,
  onExportSuccess,
}: AdminTableProps<T>) {
  // Internal search state if not controlled
  const [internalSearch, setInternalSearch] = useState('');
  const searchValue = controlledSearch !== undefined ? controlledSearch : internalSearch;
  const handleSearchChange = (val: string) => {
    if (onSearchChange) onSearchChange(val);
    else setInternalSearch(val);
  };

  // Internal filter state if not controlled
  const [internalFilter, setInternalFilter] = useState('all');
  const filterValue = controlledFilter !== undefined ? controlledFilter : internalFilter;
  const handleFilterChange = (val: string) => {
    if (onFilterChange) onFilterChange(val);
    else setInternalFilter(val);
  };

  // Sorting state
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Excel export feedback state
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  const handleSort = (col: TableColumn<T>) => {
    if (!col.sortable) return;
    if (sortKey === col.key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortKey(null);
        setSortDirection('asc');
      }
    } else {
      setSortKey(col.key);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  // Filtered & sorted data
  const processedData = useMemo(() => {
    let result = [...data];

    // If controlled search is not handling filtering externally, apply basic search if accessor exists
    if (controlledSearch === undefined && searchValue.trim()) {
      const q = searchValue.toLowerCase();
      result = result.filter((item) => {
        return columns.some((col) => {
          if (col.accessor) {
            const val = col.accessor(item);
            return val !== null && val !== undefined && String(val).toLowerCase().includes(q);
          }
          return false;
        });
      });
    }

    // Apply sorting
    if (sortKey) {
      const col = columns.find((c) => c.key === sortKey);
      if (col && col.accessor) {
        result.sort((a, b) => {
          const valA = col.accessor!(a);
          const valB = col.accessor!(b);
          if (valA === valB) return 0;
          if (valA === null || valA === undefined) return 1;
          if (valB === null || valB === undefined) return -1;

          if (typeof valA === 'number' && typeof valB === 'number') {
            return sortDirection === 'asc' ? valA - valB : valB - valA;
          }
          const strA = String(valA).toLowerCase();
          const strB = String(valB).toLowerCase();
          if (strA < strB) return sortDirection === 'asc' ? -1 : 1;
          if (strA > strB) return sortDirection === 'asc' ? 1 : -1;
          return 0;
        });
      }
    }

    return result;
  }, [data, columns, controlledSearch, searchValue, sortKey, sortDirection]);

  // Pagination calculation
  const totalItems = processedData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedData = processedData.slice(startIndex, startIndex + pageSize);

  // Excel Export Handler (Visual UI export simulation with clean CSV download for local experience)
  const handleExportExcel = () => {
    setIsExporting(true);
    setTimeout(() => {
      try {
        // Build simple CSV representation
        const headers = [
          showSerial ? '#' : null,
          ...columns.map((c) => `"${c.header.replace(/"/g, '""')}"`),
        ]
          .filter(Boolean)
          .join(',');

        const rows = processedData.map((item, idx) => {
          const rowVals: string[] = [];
          if (showSerial) rowVals.push(String(idx + 1));
          columns.forEach((col) => {
            let val = '';
            if (col.accessor) {
              const raw = col.accessor(item);
              val = raw !== null && raw !== undefined ? String(raw) : '';
            }
            rowVals.push(`"${val.replace(/"/g, '""')}"`);
          });
          return rowVals.join(',');
        });

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `${exportFileName}_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setIsExporting(false);
        setExportComplete(true);
        if (onExportSuccess) {
          onExportSuccess(`${exportFileName}.csv`);
        }
        setTimeout(() => setExportComplete(false), 3000);
      } catch {
        setIsExporting(false);
      }
    }, 400);
  };

  return (
    <div className="bg-white rounded-3xl border border-[#E3E6D3] shadow-xs overflow-hidden flex flex-col">
      {/* Table Header Section: Title, Search, Filter & Actions */}
      <div className="p-4 sm:p-6 border-b border-[#E3E6D3] bg-[#FCFDF9] flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            {title && (
              <h2 className="text-lg sm:text-xl font-black text-[#3D4127] tracking-tight">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-xs sm:text-sm text-[#3D4127]/70 font-medium mt-0.5">
                {subtitle}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Excel Export Button */}
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={isExporting || processedData.length === 0}
              className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 ${
                exportComplete
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-white hover:bg-[#F8F9F3] border-[#BAC095]/60 text-[#3D4127] disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
              title="Export visible data to Excel / CSV format"
            >
              {exportComplete ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="hidden sm:inline">Exported!</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className={`w-4 h-4 text-[#636B2F] ${isExporting ? 'animate-bounce' : ''}`} />
                  <span className="hidden sm:inline">Export to Excel</span>
                </>
              )}
            </button>

            {/* Custom Action Button (e.g. Add Category, Add Product) */}
            {actionButton && <div>{actionButton}</div>}
          </div>
        </div>

        {/* Search Bar & Filter Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#3D4127]/50 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => {
                handleSearchChange(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={searchPlaceholder}
              className="w-full pl-10 pr-9 py-2 rounded-xl bg-white border border-[#BAC095]/60 text-xs sm:text-sm text-[#3D4127] placeholder:text-[#3D4127]/40 focus:outline-none focus:ring-2 focus:ring-[#636B2F]/30 focus:border-[#636B2F] transition-all shadow-xs"
            />
            {searchValue && (
              <button
                type="button"
                onClick={() => {
                  handleSearchChange('');
                  setCurrentPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-stone-200/50 text-[#3D4127]/50"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Dropdown */}
          {filterOptions && filterOptions.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#3D4127]/70 hidden md:inline whitespace-nowrap">
                {filterLabel}:
              </span>
              <select
                value={filterValue}
                onChange={(e) => {
                  handleFilterChange(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 rounded-xl bg-white border border-[#BAC095]/60 text-xs font-bold text-[#3D4127] focus:outline-none focus:ring-2 focus:ring-[#636B2F]/30 focus:border-[#636B2F] cursor-pointer shadow-xs"
              >
                {filterOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Page Size Selector */}
          <div className="flex items-center gap-1.5 self-end sm:self-center">
            <span className="text-[11px] font-bold text-[#3D4127]/60">Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1.5 rounded-xl bg-white border border-[#BAC095]/60 text-xs font-bold text-[#3D4127] focus:outline-none focus:ring-2 focus:ring-[#636B2F]/30 cursor-pointer shadow-xs"
            >
              {pageSizeOptions.map((sz) => (
                <option key={sz} value={sz}>
                  {sz}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Area */}
      <div className="overflow-x-auto min-h-[280px] flex-1">
        {/* Error State */}
        {error ? (
          <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 mb-3 shadow-xs">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-[#3D4127]">Unable to Load Data</h3>
            <p className="text-xs text-[#3D4127]/70 max-w-sm mt-1 mb-4">{error}</p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="px-4 py-2 rounded-xl bg-[#636B2F] hover:bg-[#525926] text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            )}
          </div>
        ) : isLoading ? (
          /* Loading Skeletons */
          <div className="p-4 space-y-3">
            {[...Array(pageSize > 6 ? 6 : pageSize)].map((_, i) => (
              <div
                key={i}
                className="h-12 bg-stone-100/80 rounded-xl animate-pulse flex items-center px-4 gap-4"
              >
                <div className="w-6 h-4 bg-stone-200 rounded-md" />
                <div className="w-1/4 h-4 bg-stone-200 rounded-md" />
                <div className="w-1/3 h-4 bg-stone-200 rounded-md" />
                <div className="w-1/6 h-4 bg-stone-200 rounded-md ml-auto" />
              </div>
            ))}
          </div>
        ) : paginatedData.length === 0 ? (
          /* Empty State */
          <div className="p-10 sm:p-14 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-3xl bg-[#F0F2E5] border border-[#BAC095]/40 flex items-center justify-center text-[#636B2F] mb-3 shadow-xs">
              <Inbox className="w-7 h-7" />
            </div>
            <h3 className="text-base font-black text-[#3D4127]">{emptyTitle}</h3>
            <p className="text-xs text-[#3D4127]/70 max-w-sm mt-1 mb-4">{emptyDescription}</p>
            {(searchValue || filterValue !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  handleSearchChange('');
                  handleFilterChange('all');
                  setCurrentPage(1);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-white border border-[#BAC095] text-xs font-bold text-[#636B2F] hover:bg-[#F8F9F3] cursor-pointer shadow-xs"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          /* Table Content */
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E3E6D3] bg-[#F7F8F0] text-[11px] font-black uppercase tracking-wider text-[#3D4127]/80">
                {showSerial && <th className="py-3 px-4 w-12 text-center">#</th>}
                {columns.map((col) => {
                  const isSorted = sortKey === col.key;
                  return (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col)}
                      className={`py-3 px-4 ${
                        col.sortable ? 'cursor-pointer hover:bg-[#EBEED6] select-none' : ''
                      } ${col.headerClassName || ''}`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{col.header}</span>
                        {col.sortable && (
                          <span className="text-[#3D4127]/50">
                            {isSorted ? (
                              sortDirection === 'asc' ? (
                                <ArrowUp className="w-3.5 h-3.5 text-[#636B2F]" />
                              ) : (
                                <ArrowDown className="w-3.5 h-3.5 text-[#636B2F]" />
                              )
                            ) : (
                              <ArrowUpDown className="w-3.5 h-3.5 hover:text-[#636B2F]" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3E6D3]/60 text-xs sm:text-sm">
              {paginatedData.map((item, index) => {
                const serialNumber = startIndex + index + 1;
                return (
                  <tr
                    key={keyExtractor(item, index)}
                    onClick={() => onRowClick && onRowClick(item)}
                    className={`transition-colors hover:bg-[#FAFBF5] ${
                      onRowClick ? 'cursor-pointer' : ''
                    }`}
                  >
                    {showSerial && (
                      <td className="py-3 px-4 text-center font-bold text-[#3D4127]/60 text-xs">
                        {serialNumber}
                      </td>
                    )}
                    {columns.map((col) => {
                      return (
                        <td key={col.key} className={`py-3 px-4 ${col.className || ''}`}>
                          {col.render
                            ? col.render(item, serialNumber - 1)
                            : col.accessor
                            ? String(col.accessor(item) ?? '')
                            : null}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Table Footer: Pagination & Info */}
      {!isLoading && !error && processedData.length > 0 && (
        <div className="p-4 border-t border-[#E3E6D3] bg-[#FCFDF9] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-[#3D4127]/70 font-medium">
            Showing <span className="font-bold text-[#3D4127]">{startIndex + 1}</span> to{' '}
            <span className="font-bold text-[#3D4127]">
              {Math.min(startIndex + pageSize, totalItems)}
            </span>{' '}
            of <span className="font-bold text-[#3D4127]">{totalItems}</span> entries
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safeCurrentPage === 1}
              className="p-1.5 rounded-xl border border-[#BAC095]/60 bg-white hover:bg-[#F8F9F3] text-[#3D4127] disabled:opacity-40 disabled:cursor-not-allowed shadow-xs cursor-pointer active:scale-95"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 rounded-xl bg-white border border-[#BAC095]/60 font-black text-xs text-[#3D4127]">
              Page {safeCurrentPage} of {totalPages}
            </span>

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage === totalPages}
              className="p-1.5 rounded-xl border border-[#BAC095]/60 bg-white hover:bg-[#F8F9F3] text-[#3D4127] disabled:opacity-40 disabled:cursor-not-allowed shadow-xs cursor-pointer active:scale-95"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
