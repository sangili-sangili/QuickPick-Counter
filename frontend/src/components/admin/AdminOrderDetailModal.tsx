import React from 'react';
import { X, Box, Key } from 'lucide-react';
import { Order } from '../../types';
import { formatRupees } from '../../utils/format';

interface AdminOrderDetailModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus?: (orderId: string, newStatus: Order['status']) => void;
  onUnlockLocker?: (lockerName?: string) => void;
}

export const AdminOrderDetailModal: React.FC<AdminOrderDetailModalProps> = ({
  order,
  isOpen,
  onClose,
  onUpdateStatus,
  onUnlockLocker,
}) => {
  if (!isOpen || !order) return null;

  let statusBadge = (
    <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
      Paid
    </span>
  );

  if (order.status === 'unpaid') {
    statusBadge = (
      <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
        Pending Payment (120s Hold)
      </span>
    );
  } else if (order.status === 'expired') {
    statusBadge = (
      <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-red-50 text-red-800 border border-red-200">
        Hold Expired
      </span>
    );
  } else if (order.status === 'needs_review') {
    statusBadge = (
      <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-purple-50 text-purple-800 border border-purple-200">
        Needs Review
      </span>
    );
  } else if (order.status === 'claimed') {
    statusBadge = (
      <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-blue-50 text-blue-800 border border-blue-200">
        Claimed / Picked Up
      </span>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs select-none">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-[#E3E6D3] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-[#E3E6D3] flex items-center justify-between shrink-0 bg-[#FCFDF9]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F0F2E5] border border-[#BAC095]/40 flex items-center justify-center text-[#636B2F] font-black text-sm">
              #
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-[#3D4127] tracking-tight">
                  {order.orderNumber}
                </h3>
                {statusBadge}
              </div>
              <p className="text-xs text-[#3D4127]/60 font-medium mt-0.5">
                Created: {order.createdAt}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl border border-[#BAC095]/60 text-[#3D4127]/50 hover:text-[#3D4127] hover:bg-stone-50 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Locker & Hardware Assignment Box */}
          <div className="p-4 rounded-2xl bg-[#F8F9F3] border border-[#E3E6D3] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white border border-[#BAC095]/40 flex items-center justify-center text-[#636B2F] shadow-xs">
                <Box className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-[#3D4127]/60 uppercase tracking-wider block">
                  Smart Locker Assigned
                </span>
                <span className="text-base font-black text-[#3D4127]">
                  {order.lockerNumber ? `Compartment ${order.lockerNumber}` : 'Unassigned (No hold)'}
                </span>
              </div>
            </div>

            {order.lockerNumber && (
              <button
                type="button"
                onClick={() => onUnlockLocker?.(order.lockerNumber)}
                className="px-3.5 py-2 rounded-xl bg-[#636B2F] hover:bg-[#525926] active:scale-95 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Key className="w-3.5 h-3.5 text-[#D4DE95]" />
                <span>Manual Unlock</span>
              </button>
            )}
          </div>

          {/* Itemized Order Breakdown */}
          <div>
            <h4 className="text-xs font-bold text-[#3D4127]/60 uppercase tracking-wider mb-2.5">
              Ordered Snacks ({order.items.reduce((s, i) => s + i.quantity, 0)} items)
            </h4>
            <div className="divide-y divide-[#E3E6D3] border border-[#E3E6D3] rounded-2xl overflow-hidden bg-white">
              {order.items.map((item, idx) => (
                <div key={idx} className="p-3 sm:p-3.5 flex items-center justify-between hover:bg-[#FAFBF5] transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-[#F0F2E5] border border-[#BAC095]/30 p-1 flex items-center justify-center shrink-0">
                      <img src={item.product.image} alt={item.product.name} className="w-full h-full object-contain" />
                    </div>
                    <div className="truncate">
                      <span className="text-xs sm:text-sm font-bold text-[#3D4127] block truncate">
                        {item.product.name}
                      </span>
                      <span className="text-[11px] text-[#3D4127]/60 font-medium">
                        Qty: {item.quantity} × {formatRupees(item.product.pricePaise)}
                      </span>
                    </div>
                  </div>

                  <span className="text-xs sm:text-sm font-black text-[#3D4127] shrink-0 ml-3">
                    {formatRupees(item.product.pricePaise * item.quantity, true)}
                  </span>
                </div>
              ))}

              {/* Total Calculation Row */}
              <div className="p-3.5 bg-[#F8F9F3] flex items-center justify-between">
                <span className="text-xs font-bold text-[#3D4127]/80">Total Charged</span>
                <span className="text-base sm:text-lg font-black text-[#636B2F]">
                  {formatRupees(order.totalPaise, true)}
                </span>
              </div>
            </div>
          </div>

          {/* Timeline / Audit trail */}
          {order.timeline && order.timeline.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-[#3D4127]/60 uppercase tracking-wider mb-2">
                Order Lifecycle Telemetry
              </h4>
              <div className="space-y-2 p-3.5 rounded-2xl bg-[#FCFDF9] border border-[#E3E6D3]">
                {order.timeline.map((event, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-xs">
                    <span className="w-2 h-2 rounded-full bg-[#636B2F]" />
                    <span className="font-bold text-[#3D4127]">{event.title}</span>
                    <span className="text-[11px] text-[#3D4127]/50 ml-auto">{event.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Admin Override Actions */}
          <div className="p-4 rounded-2xl bg-[#F8F9F3] border border-[#E3E6D3] space-y-2.5">
            <span className="text-xs font-bold text-[#3D4127] block">
              Admin Status Override
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onUpdateStatus?.(order.id, 'paid')}
                disabled={order.status === 'paid'}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Mark Paid & Dispense
              </button>
              <button
                type="button"
                onClick={() => onUpdateStatus?.(order.id, 'claimed')}
                disabled={order.status === 'claimed'}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Mark Claimed
              </button>
              <button
                type="button"
                onClick={() => onUpdateStatus?.(order.id, 'expired')}
                disabled={order.status === 'expired'}
                className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Expire & Release
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E3E6D3] bg-[#FCFDF9] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-[#BAC095]/60 hover:bg-[#F8F9F3] text-xs font-bold text-[#3D4127] cursor-pointer"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
