import React from 'react';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, X } from 'lucide-react';
import { CartItem } from '../../types';
import { formatRupees } from '../../utils/format';

interface CartPanelProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onPlaceOrder: () => void;
  isLoading?: boolean;
}

export const CartModal: React.FC<CartPanelProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onPlaceOrder,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotalPaise = items.reduce(
    (sum, item) => sum + item.product.pricePaise * item.quantity,
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#EFE8DE] transform transition-all animate-in zoom-in-95 duration-200 flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#EFE8DE]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-red-50 text-primary flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-900">Your Cart</h2>
              <p className="text-xs text-stone-400 font-medium">
                {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'} selected
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                onClick={onClearCart}
                className="text-xs font-semibold text-stone-400 hover:text-primary transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
              >
                Clear
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cart Items List: Shows ~3 products cleanly with vertical scroll for balance */}
        <div className="my-3 max-h-[250px] overflow-y-auto space-y-2.5 pr-1">
          {items.length === 0 ? (
            <div className="py-10 flex flex-col items-center justify-center text-center text-stone-400 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-[#FAF5EF] flex items-center justify-center text-stone-300">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-stone-700">Your cart is empty</p>
              <p className="text-xs text-stone-400">
                Add some tasty snacks to start your order!
              </p>
            </div>
          ) : (
            items.map(({ product, quantity }) => (
              <div
                key={product.id}
                className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#FAF5EF]/70 border border-[#EFE8DE] hover:border-red-100 transition-colors"
              >
                {/* Fixed thumbnail container to prevent image expansion */}
                <div className="w-14 h-14 rounded-xl bg-white border border-[#EFE8DE] p-1 flex items-center justify-center shrink-0 overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Name & Unit Price */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-stone-900 truncate">
                    {product.name}
                  </h4>
                  <p className="text-[11px] text-stone-500 font-semibold">
                    {formatRupees(product.pricePaise)} each
                  </p>
                </div>

                {/* Stepper Controls */}
                <div className="flex items-center gap-1 bg-white rounded-full p-1 border border-[#EFE8DE] shrink-0">
                  <button
                    onClick={() => onUpdateQuantity(product.id, quantity - 1)}
                    className="w-5 h-5 rounded-full bg-stone-100 text-stone-700 flex items-center justify-center hover:bg-red-50 hover:text-primary active:scale-90 transition-all text-xs"
                    aria-label="Decrease"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-xs font-bold text-stone-900 w-4 text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => onUpdateQuantity(product.id, quantity + 1)}
                    disabled={quantity >= product.stock}
                    className={`w-5 h-5 rounded-full flex items-center justify-center transition-all text-xs ${
                      quantity >= product.stock
                        ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                        : 'bg-primary text-white hover:bg-primary-hover active:scale-90'
                    }`}
                    aria-label="Increase"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Item Total Price */}
                <div className="text-right shrink-0 min-w-[50px]">
                  <span className="text-xs sm:text-sm font-bold text-stone-900 block">
                    {formatRupees(product.pricePaise * quantity, true)}
                  </span>
                </div>

                {/* Delete button */}
                <button
                  onClick={() => onRemoveItem(product.id)}
                  className="text-stone-300 hover:text-primary p-1 rounded-lg transition-colors shrink-0"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer Summary & Checkout */}
        <div className="pt-3 border-t border-[#EFE8DE] space-y-2.5">
          <div className="flex items-center justify-between text-xs sm:text-sm text-stone-500">
            <span>Subtotal</span>
            <span className="font-semibold text-stone-800">
              {formatRupees(subtotalPaise, true)}
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <span className="text-sm font-bold text-stone-900">
              Total <span className="text-xs font-normal text-stone-400">({totalItemsCount} items)</span>
            </span>
            <span className="text-xl font-black text-primary tracking-tight">
              {formatRupees(subtotalPaise, true)}
            </span>
          </div>

          <button
            onClick={() => {
              onClose();
              onPlaceOrder();
            }}
            disabled={items.length === 0 || isLoading}
            className={`w-full py-3.5 px-4 rounded-2xl font-extrabold text-sm text-white flex items-center justify-center gap-2 transition-all duration-200 shadow-md ${
              items.length === 0 || isLoading
                ? 'bg-stone-200 text-stone-400 cursor-not-allowed shadow-none'
                : 'bg-primary hover:bg-primary-hover shadow-red-200 active:scale-98'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Holding Stock...</span>
              </div>
            ) : (
              <>
                <span>Place Order</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
