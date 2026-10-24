import React from 'react';
import { Heart, X, Plus } from 'lucide-react';
import { Product } from '../../types';
import { formatRupees } from '../../utils/format';

interface WishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  wishlistedProducts: Product[];
  onAddToCart: (product: Product) => void;
  onRemoveFromWishlist: (productId: string) => void;
}

export const WishlistModal: React.FC<WishlistModalProps> = ({
  isOpen,
  onClose,
  wishlistedProducts,
  onAddToCart,
  onRemoveFromWishlist,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-stone-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-4 sm:p-6 shadow-2xl border border-[#EFE8DE] transform transition-all animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-3.5 border-b border-[#EFE8DE]">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-red-50 text-primary flex items-center justify-center">
              <Heart className="w-4 h-4 sm:w-5 sm:h-5 fill-primary" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-900 leading-tight">Your Wishlist</h2>
              <p className="text-[11px] sm:text-xs text-stone-400 font-medium">
                {wishlistedProducts.length} {wishlistedProducts.length === 1 ? 'item' : 'items'} saved
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 sm:p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Wishlist Items List */}
        <div className="flex-1 overflow-y-auto py-2.5 sm:py-3 space-y-2 sm:space-y-2.5 min-h-[140px] pr-1">
          {wishlistedProducts.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center text-stone-400 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-[#FAF5EF] flex items-center justify-center text-stone-300">
                <Heart className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-stone-700">Wishlist is empty</p>
              <p className="text-xs text-stone-400">
                Tap the heart on any snack card to save your favorites!
              </p>
            </div>
          ) : (
            wishlistedProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-2xl bg-[#FAF5EF]/70 border border-[#EFE8DE]"
              >
                <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-xl bg-white border border-[#EFE8DE] p-1 flex items-center justify-center shrink-0 overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-stone-900 truncate">
                    {product.name}
                  </h4>
                  <p className="text-xs font-bold text-stone-800">
                    {formatRupees(product.pricePaise)}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  <button
                    onClick={() => onAddToCart(product)}
                    className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-[11px] sm:text-xs font-bold flex items-center gap-1 shadow-xs active:scale-95 transition-all"
                  >
                    <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span>Add</span>
                  </button>
                  <button
                    onClick={() => onRemoveFromWishlist(product.id)}
                    className="p-1 sm:p-1.5 text-stone-300 hover:text-primary transition-colors"
                    title="Remove from wishlist"
                  >
                    <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pt-3 border-t border-[#EFE8DE]">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors"
          >
            Close Wishlist
          </button>
        </div>
      </div>
    </div>
  );
};
