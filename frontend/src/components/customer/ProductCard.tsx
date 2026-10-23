import React from 'react';
import { Plus, Minus, Heart, Star } from 'lucide-react';
import { Product } from '../../types';
import { formatRupees } from '../../utils/format';

interface ProductCardProps {
  product: Product;
  quantityInCart: number;
  isWishlisted?: boolean;
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onToggleWishlist?: (productId: string) => void;
  onSelectProduct?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  quantityInCart,
  isWishlisted = false,
  onAddToCart,
  onUpdateQuantity,
  onToggleWishlist,
  onSelectProduct,
}) => {
  const isOutOfStock = product.stock <= 0;
  const isMaxStockReached = quantityInCart >= product.stock;
  const hasDiscount = Boolean(
    product.regularPricePaise && product.regularPricePaise > product.pricePaise
  );
  const discountPct = hasDiscount
    ? Math.round(
        ((product.regularPricePaise! - product.pricePaise) /
          product.regularPricePaise!) *
          100
      )
    : 0;

  let badgeColor = 'bg-primary text-white';
  if (product.badgeType === 'amber') {
    badgeColor = 'bg-amber-500 text-white';
  } else if (product.badgeType === 'green') {
    badgeColor = 'bg-green-600 text-white';
  }

  return (
    <div
      onClick={() => onSelectProduct?.(product)}
      className="group bg-white rounded-3xl p-3.5 sm:p-4 border border-[#EFE8DE] shadow-sm hover:shadow-card hover:border-orange-200 transition-all duration-300 flex flex-col justify-between cursor-pointer"
    >
      <div>
        {/* Top Row: Badge & Wishlist Button */}
        <div className="flex items-center justify-between mb-1.5">
          {product.badge ? (
            <span
              className={`px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider ${badgeColor} shadow-xs`}
            >
              {product.badge}
            </span>
          ) : hasDiscount ? (
            <span className="px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
              {discountPct}% OFF
            </span>
          ) : product.stock <= 5 && product.stock > 0 ? (
            <span className="px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-200">
              Low Stock
            </span>
          ) : (
            <span className="text-[10px] font-semibold text-stone-400">
              Stock: {product.stock}
            </span>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleWishlist?.(product.id);
            }}
            className={`p-1.5 rounded-full transition-colors ${
              isWishlisted
                ? 'text-primary'
                : 'text-stone-300 hover:text-stone-500 hover:bg-stone-50'
            }`}
            aria-label="Add to wishlist"
          >
            <Heart
              className={`w-4 h-4 transition-transform active:scale-125 ${
                isWishlisted ? 'fill-primary stroke-primary' : 'stroke-current'
              }`}
            />
          </button>
        </div>

        {/* Compact Product Image Container */}
        <div className="relative w-full h-28 sm:h-32 bg-[#FAF5EF]/70 rounded-2xl flex items-center justify-center p-2 mb-2.5 overflow-hidden group-hover:bg-red-50/20 transition-colors">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-contain filter group-hover:scale-105 transition-transform duration-300 drop-shadow-sm"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/images/lays.jpg';
            }}
          />

          {isOutOfStock && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex items-center justify-center">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-stone-100 text-stone-500 border border-stone-200">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-0.5">
          <h3 className="font-bold text-xs sm:text-sm text-stone-900 group-hover:text-primary transition-colors line-clamp-1">
            {product.name}
          </h3>

          <p className="text-[11px] text-stone-400 font-medium truncate">
            {product.subtitle || product.description || 'Crispy delicious snack'}
          </p>

          {/* Dynamic Star Rating & Reviews */}
          <div className="flex items-center gap-1 pt-0.5 text-xs">
            <div className="flex items-center text-amber-400">
              <Star className="w-3 h-3 fill-amber-400 stroke-amber-400" />
            </div>
            {product.ratingCount && product.ratingCount > 0 ? (
              <>
                <span className="font-bold text-stone-800 text-[10px] sm:text-[11px]">
                  {Number(product.rating || 5).toFixed(1)}
                </span>
                <span className="text-[10px] text-stone-400">
                  ({product.ratingCount})
                </span>
              </>
            ) : (
              <>
                <span className="font-bold text-stone-600 text-[10px] sm:text-[11px]">
                  5.0
                </span>
                <span className="text-[10px] text-stone-400">
                  (0)
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Footer: Price & Primary Red Circular '+' Button / Stepper */}
      <div className="mt-3 pt-1.5 flex items-center justify-between gap-2">
        <div className="flex flex-col min-w-0">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-sm sm:text-base font-black text-stone-900 tracking-tight">
              {formatRupees(product.pricePaise, true)}
            </span>
            {hasDiscount && (
              <span className="text-[10px] sm:text-[11px] text-stone-400 line-through font-semibold">
                {formatRupees(product.regularPricePaise!, true)}
              </span>
            )}
          </div>
          {hasDiscount && (
            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-tight">
              {discountPct}% OFF
            </span>
          )}
        </div>

        {quantityInCart > 0 ? (
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 bg-red-50 rounded-full p-1 border border-red-200"
          >
            <button
              onClick={() => onUpdateQuantity(product.id, quantityInCart - 1)}
              className="w-5 h-5 rounded-full bg-white text-primary flex items-center justify-center hover:bg-red-100 active:scale-90 transition-all shadow-xs"
              aria-label="Decrease quantity"
            >
              <Minus className="w-2.5 h-2.5" />
            </button>
            <span className="font-bold text-xs text-primary px-1">
              {quantityInCart}
            </span>
            <button
              onClick={() => {
                if (!isMaxStockReached) {
                  onUpdateQuantity(product.id, quantityInCart + 1);
                } else {
                  onAddToCart(product);
                }
              }}
              className={`w-5 h-5 rounded-full flex items-center justify-center transition-all shadow-xs ${
                isMaxStockReached
                  ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  : 'bg-primary text-white hover:bg-primary-hover active:scale-90'
              }`}
              aria-label="Increase quantity"
            >
              <Plus className="w-2.5 h-2.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
            disabled={isOutOfStock}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm active:scale-90 ${
              isOutOfStock
                ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                : 'bg-primary hover:bg-primary-hover text-white shadow-red-200 hover:shadow-md'
            }`}
            aria-label="Add to cart"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
          </button>
        )}
      </div>
    </div>
  );
};
