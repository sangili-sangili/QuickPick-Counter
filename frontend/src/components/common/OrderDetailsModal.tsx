import React, { useState } from 'react';
import { X, ShieldCheck, Box, Star } from 'lucide-react';
import { Order } from '../../types';
import { formatRupees } from '../../utils/format';

interface OrderDetailsModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  isOpen,
  onClose,
}) => {
  const [modalRating, setModalRating] = useState<number>(5);

  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#EFE8DE] transform transition-all animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-[#EFE8DE]">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Receipt & Info</span>
            <h3 className="text-lg font-black text-stone-900">Order #{order.orderNumber}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 p-1.5 rounded-xl hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Locker Badge */}
        <div className="mt-4 p-4 rounded-2xl bg-red-50/70 border border-red-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-stone-500 font-medium">Assigned Locker</p>
              <p className="text-lg font-black text-primary">{order.lockerNumber || 'L-07'}</p>
            </div>
          </div>
          <span className="px-3 py-1 text-xs font-bold rounded-full bg-green-100 text-green-700">
            Ready for Pickup
          </span>
        </div>

        {/* Items Summary */}
        <div className="mt-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Items Purchased</h4>
          <div className="space-y-2.5 max-h-40 overflow-y-auto pr-1">
            {order.items.map((item) => (
              <div key={item.product.id} className="flex items-center justify-between py-1.5 border-b border-stone-50 text-sm">
                <div className="flex items-center gap-2.5">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-9 h-9 object-contain rounded-lg bg-[#FAF5EF] p-0.5"
                  />
                  <div>
                    <span className="font-bold text-stone-800">{item.product.name}</span>
                    <span className="text-xs text-stone-400 block font-medium">x{item.quantity}</span>
                  </div>
                </div>
                <span className="font-black text-stone-800">
                  {formatRupees(item.product.pricePaise * item.quantity, true)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Total calculation */}
        <div className="mt-4 pt-3 border-t border-[#EFE8DE] space-y-1.5 text-sm">
          <div className="flex justify-between text-stone-500">
            <span>Subtotal</span>
            <span>{formatRupees(order.totalPaise, true)}</span>
          </div>
          <div className="flex justify-between text-stone-500">
            <span>Taxes & Counter Fee</span>
            <span>₹0.00</span>
          </div>
          <div className="flex justify-between font-black text-stone-900 text-base pt-2 border-t border-[#EFE8DE]">
            <span>Total Paid</span>
            <span className="text-primary">{formatRupees(order.totalPaise, true)}</span>
          </div>
        </div>

        {/* Rate this order widget */}
        <div className="mt-3.5 p-3 rounded-2xl bg-[#FAF5EF] border border-[#EFE8DE] flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-stone-900">Rate this order</p>
            <p className="text-[10px] text-stone-400">Tap stars to submit score</p>
          </div>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                onClick={() => setModalRating(s)}
                className="p-0.5 hover:scale-110 transition-transform focus:outline-none"
                aria-label={`Rate ${s} star`}
              >
                <Star
                  className={`w-4 h-4 ${
                    s <= modalRating
                      ? 'fill-amber-400 text-amber-400 stroke-amber-400'
                      : 'stroke-stone-300'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Security badge */}
        <div className="mt-3 flex items-center gap-2 text-xs text-stone-400 bg-stone-50 p-2.5 rounded-xl">
          <ShieldCheck className="w-4 h-4 text-green-600 shrink-0" />
          <span>Payment verified via UPI. Collect directly at locker screen.</span>
        </div>

        <div className="mt-4">
          <button
            onClick={onClose}
            className="w-full py-3 text-sm font-bold text-white bg-primary hover:bg-primary-hover rounded-2xl transition-all shadow-md shadow-red-200 active:scale-98"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
