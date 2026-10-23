import React, { useState, useEffect } from 'react';
import { X, Heart, Star, Plus, Minus, ShoppingBag, ShieldCheck, Zap, Box, Clock } from 'lucide-react';
import { Product } from '../../types';
import { formatRupees } from '../../utils/format';

interface ProductDetailsModalProps {
  product: Product | null;
  isOpen: boolean;
  quantityInCart: number;
  isWishlisted: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onToggleWishlist: (productId: string) => void;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  product,
  isOpen,
  quantityInCart,
  isWishlisted,
  onClose,
  onAddToCart,
  onToggleWishlist,
}) => {
  const [selectedQty, setSelectedQty] = useState<number>(1);

  // Sync initial quantity with cart or default to 1
  useEffect(() => {
    if (product) {
      setSelectedQty(quantityInCart > 0 ? quantityInCart : 1);
    }
  }, [product, quantityInCart]);

  if (!isOpen || !product) return null;

  const isOutOfStock = product.stock <= 0;
  const totalPricePaise = product.pricePaise * selectedQty;

  const handleIncrease = () => {
    if (selectedQty < product.stock) {
      setSelectedQty((prev) => prev + 1);
    }
  };

  const handleDecrease = () => {
    if (selectedQty > 1) {
      setSelectedQty((prev) => prev - 1);
    }
  };

  const handleConfirmAdd = () => {
    onAddToCart(product, selectedQty);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Outer Card: overflow-hidden ensures border-radius is never clipped by a scrollbar */}
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-[#EFE8DE] transform transition-all animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Top Header Actions (Fixed) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EFE8DE] bg-white shrink-0">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FAF5EF] text-stone-700 border border-[#EFE8DE]">
            {product.category}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleWishlist(product.id)}
              className={`p-2 rounded-xl border border-[#EFE8DE] transition-colors ${
                isWishlisted
                  ? 'text-primary bg-red-50'
                  : 'text-stone-400 hover:text-stone-700 bg-white'
              }`}
              title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart
                className={`w-4 h-4 ${
                  isWishlisted ? 'fill-primary stroke-primary' : 'stroke-current'
                }`}
              />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl border border-[#EFE8DE] text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Middle Body (Scrollbar strictly inside, never overlaps rounded corners) */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3.5 scrollbar-thin">
          {/* Product Image Area */}
          <div className="relative w-full h-44 sm:h-52 bg-[#FAF5EF] rounded-2xl flex items-center justify-center p-3 overflow-hidden border border-[#EFE8DE]">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-contain filter drop-shadow-md hover:scale-105 transition-transform duration-300"
            />

            {product.badge && (
              <span className="absolute top-3 left-3 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-primary text-white shadow-xs">
                {product.badge}
              </span>
            )}

            {isOutOfStock && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex items-center justify-center">
                <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-stone-100 text-stone-500 border border-stone-200">
                  Out of Stock
                </span>
              </div>
            )}
          </div>

          {/* Product Title, Rating & Pricing */}
          <div className="space-y-1.5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight leading-tight">
                  {product.name}
                </h3>
                <p className="text-xs sm:text-sm text-stone-500 font-medium">
                  {product.subtitle || 'Crispy & Delicious Snack'}
                </p>
              </div>

              <div className="text-right shrink-0">
                <span className="text-2xl sm:text-3xl font-black text-primary tracking-tight">
                  {formatRupees(product.pricePaise, true)}
                </span>
              </div>
            </div>

            {/* Rating & Stock Badges */}
            <div className="flex items-center gap-3 pt-0.5 text-xs">
              <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200/60">
                <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" />
                <span className="font-bold text-stone-800">
                  {product.rating || 4.8}
                </span>
                <span className="text-stone-400">
                  ({product.ratingCount || 120} reviews)
                </span>
              </div>

              <span className="text-stone-500 font-semibold">
                Stock:{' '}
                <span className={product.stock <= 5 ? 'text-amber-600 font-bold' : 'text-stone-800'}>
                  {product.stock} units available
                </span>
              </span>
            </div>

            {/* Detailed Description */}
            <div className="pt-1.5">
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                {product.description ||
                  'Prepared fresh with premium ingredients. Perfectly portioned and ready for instantaneous pickup from your reserved smart locker compartment.'}
              </p>
            </div>

            {/* Kiosk Pickup Highlights */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="p-2.5 rounded-2xl bg-[#FAF5EF] border border-[#EFE8DE] flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary shrink-0" />
                <span className="text-xs font-semibold text-stone-700">120s Stock Hold</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-[#FAF5EF] border border-[#EFE8DE] flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="text-xs font-semibold text-stone-700">Instant UPI QR</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-[#FAF5EF] border border-[#EFE8DE] flex items-center gap-2">
                <Box className="w-4 h-4 text-primary shrink-0" />
                <span className="text-xs font-semibold text-stone-700">Smart Locker Dispense</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-[#FAF5EF] border border-[#EFE8DE] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-green-600 shrink-0" />
                <span className="text-xs font-semibold text-stone-700">100% Sealed & Fresh</span>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Footer Actions: Quantity Stepper & Add to Cart (Always visible at bottom!) */}
        <div className="shrink-0 px-6 py-3.5 sm:py-4 border-t border-[#EFE8DE] bg-white flex items-center gap-3.5">
          {/* Stepper */}
          <div className="flex items-center gap-2 bg-[#FAF5EF] rounded-2xl p-1.5 border border-[#EFE8DE] shrink-0">
            <button
              onClick={handleDecrease}
              disabled={selectedQty <= 1}
              className={`w-8 h-8 rounded-xl bg-white flex items-center justify-center transition-all ${
                selectedQty <= 1
                  ? 'text-stone-300 cursor-not-allowed'
                  : 'text-stone-700 hover:text-primary active:scale-90 shadow-xs'
              }`}
              aria-label="Decrease"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-6 text-center font-black text-sm text-stone-900">
              {selectedQty}
            </span>
            <button
              onClick={handleIncrease}
              disabled={selectedQty >= product.stock}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                selectedQty >= product.stock
                  ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  : 'bg-primary text-white hover:bg-primary-hover active:scale-90 shadow-xs'
              }`}
              aria-label="Increase"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleConfirmAdd}
            disabled={isOutOfStock}
            className={`flex-1 py-3 px-4 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 ${
              isOutOfStock
                ? 'bg-stone-200 text-stone-400 cursor-not-allowed shadow-none'
                : 'bg-primary hover:bg-primary-hover shadow-red-200'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>
              {quantityInCart > 0 ? 'Update in Cart' : 'Add to Cart'} • {formatRupees(totalPricePaise, true)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
