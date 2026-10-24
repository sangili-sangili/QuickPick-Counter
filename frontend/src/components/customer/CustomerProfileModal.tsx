import React, { useEffect, useState } from 'react';
import {
  X,
  Crown,
  Sparkles,
  ShieldCheck,
  ShoppingBag,
  Mail,
  Gift,
} from 'lucide-react';
import { CustomerUser, Order } from '../../types';
import { formatRupees } from '../../utils/format';
import { fetchCustomerProfileAPI } from '../../services/api';

interface CustomerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: CustomerUser;
  orders: Order[];
  onOpenCart?: () => void;
  onLogout?: () => void;
}

export const CustomerProfileModal: React.FC<CustomerProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  orders,
  onLogout,
}) => {
  const [liveOrders, setLiveOrders] = useState<any[]>(orders || []);

  useEffect(() => {
    if (isOpen) {
      // Sync latest customer profile and orders dynamically from database
      fetchCustomerProfileAPI().then((prof) => {
        if (prof && Array.isArray((prof as any).orders)) {
          setLiveOrders((prof as any).orders);
        } else if (orders && orders.length > 0) {
          setLiveOrders(orders);
        }
      });
    }
  }, [isOpen, orders]);

  if (!isOpen) return null;

  // Real orders list from live database query or passed orders
  const displayOrders =
    liveOrders && liveOrders.length > 0
      ? liveOrders
      : orders && orders.length > 0
      ? orders
      : ((currentUser as any)?.orders || []);

  const isGold = currentUser.membershipTier?.includes('Gold');
  const isSilver = currentUser.membershipTier?.includes('Silver');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-[#D8C2A7] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header / Loyalty Card Banner */}
        <div
          className={`p-4 sm:p-6 text-white relative overflow-hidden ${
            isGold
              ? 'bg-gradient-to-tr from-amber-600 via-amber-700 to-amber-900'
              : isSilver
              ? 'bg-gradient-to-tr from-slate-600 via-slate-700 to-slate-900'
              : 'bg-gradient-to-tr from-stone-800 to-stone-900'
          }`}
        >
          {/* Subtle Decorative Background circles */}
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-xl pointer-events-none" />

          <div className="relative z-10 flex items-start justify-between gap-2">
            <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white text-lg sm:text-xl font-black shadow-inner border border-white/20 shrink-0">
                {currentUser.avatar || currentUser.name.charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <h3 className="text-base sm:text-lg font-black text-white truncate max-w-[140px] sm:max-w-none">{currentUser.name}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[9px] sm:text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border border-white/20 shrink-0">
                    {isGold ? (
                      <Crown className="w-3 h-3 text-amber-300 fill-amber-300" />
                    ) : isSilver ? (
                      <Sparkles className="w-3 h-3 text-slate-200" />
                    ) : (
                      <ShieldCheck className="w-3 h-3 text-orange-200" />
                    )}
                    {currentUser.membershipTier || 'Bronze Member'}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-white/80 font-medium mt-1">
                  <span className="flex items-center gap-1 truncate max-w-[160px] sm:max-w-xs">
                    <Mail className="w-3 h-3 shrink-0" />
                    <span className="truncate">{currentUser.email}</span>
                  </span>
                  {currentUser.phone && (
                    <span className="hidden sm:inline">• {currentUser.phone}</span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Membership Benefit Bar */}
          <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-white/15 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-white/90 min-w-0">
              <Gift className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span className="font-bold truncate text-[11px] sm:text-xs">
                {isGold
                  ? 'VIP 5% Instant Cashback Active'
                  : isSilver
                  ? 'Silver Rewards Member • 2% Cashback'
                  : 'Standard Kiosk Patron Rewards'}
              </span>
            </div>
            <span className="text-[10px] sm:text-[11px] font-black text-amber-200 shrink-0 ml-2">
              {Math.floor((currentUser.totalSpentPaise || 84000) / 1000)} Pts
            </span>
          </div>
        </div>

        {/* Modal Body: Active Dispenser Locks & Order History */}
        <div className="p-3.5 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-primary" />
                <span>My Orders & Pickup Status</span>
              </h4>
              <span className="text-[11px] text-stone-400 font-bold">
                {displayOrders.length} {displayOrders.length === 1 ? 'Order' : 'Orders'}
              </span>
            </div>

            {displayOrders.length === 0 ? (
              <div className="p-6 rounded-2xl bg-[#FAF5EF] border border-[#EFE8DE] text-center space-y-2">
                <p className="text-xs font-bold text-stone-700">No Orders Yet</p>
                <p className="text-[11px] text-stone-500">
                  Select your snacks from the catalog and checkout to receive your instant locker pickup code.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {displayOrders.map((ord: any) => {
                  const statusLower = String(ord.status || '').toLowerCase();
                  return (
                    <div
                      key={ord.id}
                      className="p-4 rounded-2xl border border-stone-200 bg-white hover:border-primary/40 transition-all shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-xs text-stone-900">
                            {ord.orderNumber}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                              statusLower === 'paid'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : statusLower === 'claimed'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {ord.status}
                          </span>
                        </div>

                        <span className="font-black text-xs text-stone-900">
                          {formatRupees(ord.totalPaise)}
                        </span>
                      </div>

                      {/* Locker Compartment Callout */}
                      {ord.lockerNumber && (
                        <div className="mt-2.5 p-2 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center text-[10px] font-black">
                              📦
                            </div>
                            <div>
                              <p className="text-[10px] text-amber-800 font-bold">
                                Pickup Compartment: <span className="font-black text-amber-950">{ord.lockerNumber}</span>
                              </p>
                              <p className="text-[9px] text-amber-700 font-medium">
                                {statusLower === 'paid'
                                  ? 'Solenoid Unlocked • Ready to open'
                                  : 'Dispensed & Completed'}
                              </p>
                            </div>
                          </div>

                          {statusLower === 'paid' && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[9px] font-black animate-pulse">
                              OPEN DOOR
                            </span>
                          )}
                        </div>
                      )}

                      <div className="mt-2 pt-2 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-stone-500">
                        <span className="truncate max-w-[200px] sm:max-w-[240px]">
                          {Array.isArray(ord.items) && ord.items.length > 0
                            ? ord.items
                                .map((i: any) => `${i.product?.name || i.productName || 'Snack'} (x${i.quantity})`)
                                .join(', ')
                            : 'QuickPick Snack'}
                        </span>
                        <span className="shrink-0 text-[10px] text-stone-400 font-medium">
                          {ord.createdAt}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
          {onLogout ? (
            <button
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
            >
              Sign Out of Kiosk
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
