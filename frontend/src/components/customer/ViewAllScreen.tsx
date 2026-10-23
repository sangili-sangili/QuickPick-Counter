import React, { useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { Product, CartItem, CategoryItem } from '../../types';
import { ProductCard } from './ProductCard';
import { Category } from './CategoryTabs';

interface ViewAllScreenProps {
  products: Product[];
  categories?: CategoryItem[];
  cart: CartItem[];
  wishlistIds: string[];
  onBackToHome: () => void;
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onToggleWishlist: (productId: string) => void;
  onSelectProduct?: (product: Product) => void;
}

const ITEMS_PER_PAGE = 8;

export const ViewAllScreen: React.FC<ViewAllScreenProps> = ({
  products,
  categories = [],
  cart,
  wishlistIds,
  onBackToHome,
  onAddToCart,
  onUpdateQuantity,
  onToggleWishlist,
  onSelectProduct,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'popular' | 'price-asc' | 'price-desc' | 'rating'>('popular');
  const [currentPage, setCurrentPage] = useState(1);

  // Dynamic Categories from DB (with fallback to unique product categories)
  const categoryList: Category[] = [
    'All',
    ...(categories.length > 0
      ? categories.map((c) => c.name)
      : Array.from(new Set(products.map((p) => p.category)))),
  ];

  // Filtering
  let filtered = products.filter((p) => {
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.subtitle && p.subtitle.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  // Sorting
  filtered = [...filtered].sort((a, b) => {
    if (sortBy === 'price-asc') return a.pricePaise - b.pricePaise;
    if (sortBy === 'price-desc') return b.pricePaise - a.pricePaise;
    if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
    return (b.ratingCount || 0) - (a.ratingCount || 0);
  });

  // Pagination logic
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const displayedProducts = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header Row with Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#EFE8DE]">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToHome}
            className="w-10 h-10 rounded-2xl bg-white border border-[#EFE8DE] flex items-center justify-center text-stone-700 hover:text-primary hover:border-primary/40 transition-all shadow-xs active:scale-95 shrink-0"
            aria-label="Back to home"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
              All Snacks & Combos
            </h2>
            <p className="text-xs text-stone-400 font-medium">
              Showing {filtered.length} products with live stock availability
            </p>
          </div>
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-stone-500 whitespace-nowrap">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as any);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs font-bold text-stone-700 bg-white border border-[#EFE8DE] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer shadow-xs"
          >
            <option value="popular">Most Popular</option>
            <option value="rating">Top Rated</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Filter and Search Bar (Fixed Overlapping Search Bar per Requirement 3) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categoryList.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-white border border-[#EFE8DE] text-stone-600 hover:text-stone-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Bar - Fixed Flex Centered Input with Zero Overlap */}
        <div className="flex items-center w-full sm:w-72 bg-white border border-[#EFE8DE] rounded-2xl px-3.5 py-2.5 shadow-xs focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
          <Search className="w-4 h-4 text-stone-400 shrink-0 mr-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search all snacks..."
            className="w-full bg-transparent text-xs sm:text-sm focus:outline-none text-stone-800 placeholder:text-stone-400 leading-normal"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className="p-1 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors shrink-0 ml-1.5"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Products Grid (Max 8 products per page with pagination) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4 lg:gap-5">
        {displayedProducts.map((product) => {
          const cartItem = cart.find((item) => item.product.id === product.id);
          const isWishlisted = wishlistIds.includes(product.id);
          return (
            <ProductCard
              key={product.id}
              product={product}
              quantityInCart={cartItem ? cartItem.quantity : 0}
              isWishlisted={isWishlisted}
              onAddToCart={onAddToCart}
              onUpdateQuantity={onUpdateQuantity}
              onToggleWishlist={onToggleWishlist}
              onSelectProduct={onSelectProduct}
            />
          );
        })}
      </div>

      {displayedProducts.length === 0 && (
        <div className="bg-white rounded-3xl p-10 text-center border border-[#EFE8DE] shadow-sm">
          <p className="text-stone-500 font-medium">No snacks found matching your criteria</p>
          <button
            onClick={() => {
              setSelectedCategory('All');
              setSearchQuery('');
              setCurrentPage(1);
            }}
            className="mt-3 px-4 py-2 text-xs font-bold text-primary bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="pt-4 flex items-center justify-between border-t border-[#EFE8DE]">
          <span className="text-xs font-semibold text-stone-400">
            Showing {startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, filtered.length)} of{' '}
            {filtered.length} products
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`p-2 rounded-xl border border-[#EFE8DE] bg-white text-stone-700 transition-all ${
                currentPage === 1
                  ? 'opacity-40 cursor-not-allowed'
                  : 'hover:text-primary hover:border-primary/40 active:scale-95'
              }`}
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                  currentPage === page
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-white border border-[#EFE8DE] text-stone-700 hover:bg-stone-50'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-xl border border-[#EFE8DE] bg-white text-stone-700 transition-all ${
                currentPage === totalPages
                  ? 'opacity-40 cursor-not-allowed'
                  : 'hover:text-primary hover:border-primary/40 active:scale-95'
              }`}
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
