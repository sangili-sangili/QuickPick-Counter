import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Edit2, Package, Tag, AlertTriangle } from 'lucide-react';
import { Product } from '../../types';
import { formatRupees } from '../../utils/format';

interface AdminProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (product: Product) => void;
}

export const AdminProductDetailModal: React.FC<AdminProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  onEdit,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!isOpen || !product) return null;

  // Build full list of gallery images (primary + galleryImages)
  const allImages = [
    product.image,
    ...(product.galleryImages || []),
  ].filter(Boolean);

  const activeIndex = Math.min(currentImageIndex, allImages.length - 1);

  const regularPrice = product.regularPricePaise ? product.regularPricePaise : product.pricePaise;
  const offerPrice = product.offerPricePaise ? product.offerPricePaise : product.pricePaise;
  const hasDiscount = regularPrice > offerPrice;
  const discountPercent = hasDiscount
    ? Math.round(((regularPrice - offerPrice) / regularPrice) * 100)
    : 0;

  const handlePrev = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-[#E3E6D3] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#E3E6D3] bg-[#FCFDF9] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-0.5 rounded-lg bg-[#F0F2E5] text-[#3D4127] font-black text-xs uppercase tracking-wider border border-[#BAC095]/40">
              {product.category}
            </span>
            <h2 className="text-base font-black text-[#3D4127] truncate max-w-sm">
              {product.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#3D4127]/50 hover:text-[#3D4127] hover:bg-stone-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Top Gallery Slider */}
          <div className="relative rounded-2xl bg-[#F8F9F3] border border-[#E3E6D3] p-4 flex flex-col items-center">
            {/* Main Image View */}
            <div className="relative w-full h-56 sm:h-64 flex items-center justify-center overflow-hidden rounded-xl">
              <img
                src={allImages[activeIndex] || product.image}
                alt={product.name}
                className="max-h-full max-w-full object-contain drop-shadow-md transition-all duration-300"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/lays.jpg';
                }}
              />

              {/* Slider Arrows */}
              {allImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 hover:bg-white text-[#3D4127] shadow-md border border-[#BAC095]/40 cursor-pointer transition-all active:scale-95"
                    title="Previous photo"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 hover:bg-white text-[#3D4127] shadow-md border border-[#BAC095]/40 cursor-pointer transition-all active:scale-95"
                    title="Next photo"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}

              {/* Status Badge */}
              <div className="absolute top-2 left-2">
                {product.isActive !== false ? (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Active Catalog
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-stone-100 text-stone-600 border border-stone-200 flex items-center gap-1 shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                    Inactive
                  </span>
                )}
              </div>

              {/* Image Counter */}
              {allImages.length > 1 && (
                <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-stone-900/60 text-white text-[10px] font-bold">
                  {activeIndex + 1} / {allImages.length}
                </div>
              )}
            </div>

            {/* Thumbnails row */}
            {allImages.length > 1 && (
              <div className="flex items-center gap-2 mt-3 overflow-x-auto max-w-full pb-1">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all p-0.5 cursor-pointer shrink-0 ${
                      activeIndex === idx
                        ? 'border-[#636B2F] ring-2 ring-[#636B2F]/20'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Thumb ${idx}`}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/lays.jpg';
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Pricing & Stock Details Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Price Presentation */}
            <div className="p-4 rounded-2xl bg-[#FCFDF9] border border-[#E3E6D3] space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#3D4127]/60">
                <Tag className="w-3.5 h-3.5 text-[#636B2F]" />
                <span>Price Details</span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-black text-[#3D4127]">
                  {formatRupees(offerPrice)}
                </span>
                {hasDiscount && (
                  <span className="text-sm font-semibold text-stone-400 line-through">
                    {formatRupees(regularPrice)}
                  </span>
                )}
                {hasDiscount && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                    Save {discountPercent}%
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#3D4127]/60">
                Customer kiosk charges {formatRupees(offerPrice)} at dispenser checkout.
              </p>
            </div>

            {/* Stock Details */}
            <div className="p-4 rounded-2xl bg-[#FCFDF9] border border-[#E3E6D3] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#3D4127]/60">
                  <Package className="w-3.5 h-3.5 text-[#636B2F]" />
                  <span>Inventory Level</span>
                </div>
                {product.stock <= 5 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase flex items-center gap-1 border border-amber-200">
                    <AlertTriangle className="w-3 h-3" />
                    Low Stock
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-[#3D4127]">{product.stock}</span>
                <span className="text-xs font-bold text-[#3D4127]/60">units available</span>
              </div>
              <p className="text-[11px] text-[#3D4127]/60">
                {product.stock > 0
                  ? 'Ready for instant dispensing in lockers.'
                  : 'Sold out! Replenishment required.'}
              </p>
            </div>
          </div>

          {/* Description & Subtitle */}
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#3D4127]/70">
              Product Overview & Details
            </h4>
            <div className="p-4 rounded-2xl bg-[#F8F9F3] border border-[#E3E6D3] text-xs sm:text-sm text-[#3D4127] leading-relaxed">
              {product.description ||
                'Crispy, fresh, and delicious snack packaged specifically for quick vending pickup.'}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[#E3E6D3] bg-[#FCFDF9] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#BAC095]/60 text-xs font-bold text-[#3D4127] hover:bg-stone-50 cursor-pointer"
          >
            Close
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onEdit(product);
            }}
            className="px-5 py-2 rounded-xl bg-[#636B2F] hover:bg-[#525926] text-white text-xs font-bold shadow-md shadow-[#636B2F]/20 cursor-pointer active:scale-95 transition-all flex items-center gap-1.5"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Product</span>
          </button>
        </div>
      </div>
    </div>
  );
};
