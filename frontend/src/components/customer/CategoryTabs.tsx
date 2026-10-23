import React, { useRef, useState, useEffect } from 'react';
import { Search, X, TrendingUp, Sparkles, Loader2 } from 'lucide-react';
import { Product, CategoryItem } from '../../types';
import { formatRupees } from '../../utils/format';
import { useDebounce } from '../../hooks/useDebounce';
import { searchProductsAPI } from '../../services/api';

export type Category = string;

interface CategoryTabsProps {
  categories?: CategoryItem[];
  selectedCategory: Category;
  onSelectCategory: (category: Category) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  products?: Product[];
  onAddToCart?: (product: Product) => void;
  onSelectProduct?: (product: Product) => void;
}

export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  categories = [],
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  products = [],
  onAddToCart,
  onSelectProduct,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);

  // Debounced search state
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [liveSearchResults, setLiveSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Debounced API Search
  useEffect(() => {
    let isCancelled = false;

    if (!debouncedSearch.trim()) {
      setLiveSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchProductsAPI(debouncedSearch).then((results) => {
      if (!isCancelled) {
        setLiveSearchResults(results);
        setIsSearching(false);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [debouncedSearch]);

  // Close search suggestions modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsSearchFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Mouse drag-to-scroll handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeftState(scrollContainerRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollContainerRef.current.scrollLeft = scrollLeftState - walk;
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  // Horizontal wheel track scroll
  const handleWheel = (e: React.WheelEvent) => {
    if (!scrollContainerRef.current) return;
    if (e.deltaY !== 0) {
      scrollContainerRef.current.scrollLeft += e.deltaY;
    }
  };

  // Dynamic Popular Tags from top products
  const popularTags = products.slice(0, 6).map((p) => p.name);
  const trendingProducts = products.slice(0, 4);

  // Build category display items: "All Items" + Active categories from DB
  const displayCategories = [
    {
      id: 'all',
      name: 'All',
      label: 'All Items',
      image: '/images/hero-snacks.jpg',
    },
    ...categories.map((c) => ({
      id: c.id,
      name: c.name,
      label: c.name,
      image: c.image || '/images/hero-snacks.jpg',
    })),
  ];

  return (
    <div className="space-y-4">
      {/* Full-width Search Bar with Centered Icon & Debouncing */}
      <div ref={searchContainerRef} className="relative w-full z-30">
        <div className="flex items-center w-full bg-white border border-[#EFE8DE] rounded-2xl shadow-xs focus-within:ring-2 focus-within:ring-primary/25 focus-within:border-primary transition-all px-4 py-3 sm:py-3.5">
          <div className="flex items-center justify-center shrink-0 mr-3 text-stone-400">
            {isSearching ? (
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            ) : (
              <Search className="w-5 h-5" />
            )}
          </div>

          <input
            type="text"
            value={searchQuery}
            onFocus={() => setIsSearchFocused(true)}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search for your favorite snacks, drinks & combos..."
            className="w-full bg-transparent text-sm focus:outline-none text-stone-800 placeholder:text-stone-400 leading-normal"
          />

          {searchQuery && (
            <button
              onClick={() => {
                onSearchChange('');
                setLiveSearchResults([]);
                setIsSearchFocused(true);
              }}
              className="p-1.5 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors shrink-0 ml-2 cursor-pointer"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search Suggestions Modal */}
        {isSearchFocused && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-3xl border border-[#EFE8DE] shadow-2xl p-4 sm:p-5 z-40 max-h-[380px] overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="overflow-y-auto pr-3 mr-[-4px] space-y-4">
              {searchQuery.trim().length === 0 ? (
                /* State 1: Popular & Trending Searches */
                <div className="space-y-4">
                  {popularTags.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-400 mb-2.5">
                        <TrendingUp className="w-3.5 h-3.5 text-primary" />
                        <span>Popular In Counter</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {popularTags.map((tag) => (
                          <button
                            key={tag}
                            onClick={() => {
                              onSearchChange(tag);
                              setIsSearchFocused(false);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-[#FAF5EF] hover:bg-red-50 hover:text-primary text-stone-700 text-xs font-semibold border border-[#EFE8DE] transition-colors cursor-pointer"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Trending Picks */}
                  {trendingProducts.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-400 mb-2.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Trending Snacks</span>
                      </div>
                      <div className="space-y-2">
                        {trendingProducts.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => {
                              if (onSelectProduct) {
                                onSelectProduct(p);
                              } else {
                                onSearchChange(p.name);
                              }
                              setIsSearchFocused(false);
                            }}
                            className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-[#FAF5EF] cursor-pointer transition-colors group"
                          >
                            <div className="flex items-center gap-3 min-w-0 pr-2">
                              <div className="w-10 h-10 rounded-xl bg-white border border-[#EFE8DE] p-1 flex items-center justify-center shrink-0">
                                <img src={p.image} alt={p.name} className="w-full h-full object-contain" />
                              </div>
                              <div className="truncate">
                                <p className="text-xs font-bold text-stone-900 group-hover:text-primary transition-colors truncate">
                                  {p.name}
                                </p>
                                <span className="text-[11px] text-stone-400 font-medium">
                                  {p.category} • {formatRupees(p.pricePaise)}
                                </span>
                              </div>
                            </div>

                            {onAddToCart && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAddToCart(p);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-primary text-white text-[11px] font-bold hover:bg-primary-hover shadow-xs active:scale-95 transition-all shrink-0 ml-3 cursor-pointer"
                              >
                                + Add
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : isSearching ? (
                <div className="py-8 flex flex-col items-center justify-center gap-2 text-stone-400">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span className="text-xs font-bold">Searching dispenser catalog...</span>
                </div>
              ) : liveSearchResults.length > 0 ? (
                /* State 2: Live Search Matches from Database */
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-stone-400 pb-1 border-b border-stone-100">
                    <span>
                      Found {liveSearchResults.length} {liveSearchResults.length === 1 ? 'snack' : 'snacks'}
                    </span>
                    <span className="text-primary font-bold text-[11px]">Database Search</span>
                  </div>

                  <div className="space-y-2 pt-1">
                    {liveSearchResults.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          if (onSelectProduct) {
                            onSelectProduct(p);
                          } else {
                            onSearchChange(p.name);
                          }
                          setIsSearchFocused(false);
                        }}
                        className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-[#FAF5EF] border border-transparent hover:border-[#EFE8DE] cursor-pointer transition-all group"
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <div className="w-11 h-11 rounded-xl bg-white border border-[#EFE8DE] p-1 flex items-center justify-center shrink-0">
                            <img src={p.image} alt={p.name} className="w-full h-full object-contain" />
                          </div>
                          <div className="truncate">
                            <p className="text-sm font-bold text-stone-900 group-hover:text-primary transition-colors truncate">
                              {p.name}
                            </p>
                            <p className="text-xs text-stone-400 font-medium truncate">
                              {p.subtitle || p.category}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 ml-3">
                          <div className="text-right">
                            <span className="text-xs font-black text-stone-900 block">
                              {formatRupees(p.pricePaise)}
                            </span>
                            {p.regularPricePaise && p.regularPricePaise > p.pricePaise && (
                              <span className="text-[10px] text-stone-400 line-through font-semibold block">
                                {formatRupees(p.regularPricePaise)}
                              </span>
                            )}
                          </div>
                          {onAddToCart && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onAddToCart(p);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover shadow-xs active:scale-95 transition-all cursor-pointer"
                            >
                              + Add
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* State 3: No Matches */
                <div className="py-8 text-center space-y-2 text-stone-400">
                  <p className="text-sm font-bold text-stone-700">No snacks found for "{searchQuery}"</p>
                  <p className="text-xs text-stone-400">Try searching for chips, coke, cookies, or combos.</p>
                  <button
                    onClick={() => {
                      onSearchChange('');
                      setLiveSearchResults([]);
                    }}
                    className="mt-2 px-3 py-1 text-xs font-bold text-primary bg-red-50 rounded-xl hover:bg-red-100 transition-colors cursor-pointer"
                  >
                    Clear Search
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Circular Image Category Slider (Active Categories Loaded from DB) */}
      <div className="relative py-1">
        <div
          ref={scrollContainerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          onWheel={handleWheel}
          className={`flex items-center gap-4 sm:gap-6 overflow-x-auto py-3 px-3 scrollbar-none select-none ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
        >
          {displayCategories.map((item) => {
            const isSelected = selectedCategory === item.name;
            return (
              <button
                key={item.id}
                onClick={() => onSelectCategory(item.name)}
                className="flex flex-col items-center gap-2 group/cat cursor-pointer focus:outline-none shrink-0"
              >
                <div
                  className={`relative w-16 h-16 sm:w-18 sm:h-18 rounded-full p-1 transition-all duration-200 flex items-center justify-center ${
                    isSelected
                      ? 'ring-3 ring-primary ring-offset-2 ring-offset-[#FAF5EF] bg-red-50 shadow-md'
                      : 'bg-white border border-[#EFE8DE] group-hover/cat:border-orange-200 shadow-xs'
                  }`}
                >
                  <div className="w-full h-full rounded-full overflow-hidden bg-[#FAF5EF] flex items-center justify-center p-1">
                    <img
                      src={item.image}
                      alt={item.label}
                      className="w-full h-full object-contain filter drop-shadow-xs transition-transform group-hover/cat:scale-110 pointer-events-none"
                    />
                  </div>
                </div>

                <span
                  className={`text-xs font-semibold tracking-tight whitespace-nowrap transition-colors ${
                    isSelected
                      ? 'text-primary font-black'
                      : 'text-stone-600 group-hover/cat:text-stone-900'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
