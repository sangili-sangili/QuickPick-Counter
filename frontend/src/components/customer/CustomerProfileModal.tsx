import React from 'react';
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
  if (!isOpen) return null;

  // Find orders for this customer
  const userOrders = orders.filter(
    (o) =>
      o.customerId === currentUser.id ||
      (currentUser.name === 'Alex Johnson' && o.orderNumber === 'ORD1234') ||
      (currentUser.name === 'Priya Sharma' && o.orderNumber === 'ORD1233')
  );

  const isGold = currentUser.membershipTier?.includes('Gold');
  const isSilver = currentUser.membershipTier?.includes('Silver');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-[#D8C2A7] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header / Loyalty Card Banner */}
        <div
          className={`p-6 text-white relative overflow-hidden ${
            isGold
              ? 'bg-gradient-to-tr from-amber-600 via-amber-700 to-amber-900'
              : isSilver
              ? 'bg-gradient-to-tr from-slate-600 via-slate-700 to-slate-900'
              : 'bg-gradient-to-tr from-stone-800 to-stone-900'
          }`}
        >
          {/* Subtle Decorative Background circles */}
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-xl pointer-events-none" />

          <div className="relative z-10 flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white text-xl font-black shadow-inner border border-white/20">
                {currentUser.avatar || currentUser.name.charAt(0).toUpperCase()}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-white">{currentUser.name}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border border-white/20">
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
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {currentUser.email}
                  </span>
                  {currentUser.phone && (
                    <span>• {currentUser.phone}</span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Membership Benefit Bar */}
          <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-white/90">
              <Gift className="w-3.5 h-3.5 text-amber-300" />
              <span className="font-bold">
                {isGold
                  ? 'VIP 5% Instant Cashback Active'
                  : isSilver
                  ? 'Silver Rewards Member • 2% Cashback'
                  : 'Standard Kiosk Patron Rewards'}
              </span>
            </div>
            <span className="text-[11px] font-black text-amber-200">
              {Math.floor((currentUser.totalSpentPaise || 84000) / 1000)} Points
            </span>
          </div>
        </div>

        {/* Modal Body: Active Dispenser Locks & Order History */}
        <div className="p-6 overflow-y-auto space-y-5">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-primary" />
                <span>My Kiosk Orders & Pickup Status</span>
              </h4>
              <span className="text-[11px] text-stone-400 font-bold">
                {userOrders.length} {userOrders.length === 1 ? 'Order' : 'Orders'}
              </span>
            </div>

            {userOrders.length === 0 ? (
              <div className="p-6 rounded-2xl bg-[#FAF5EF] border border-[#EFE8DE] text-center space-y-2">
                <p className="text-xs font-bold text-stone-700">No Orders Yet</p>
                <p className="text-[11px] text-stone-500">
                  Select your snacks from the catalog and checkout to receive your instant locker pickup code.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {userOrders.map((ord) => (
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
                            ord.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : ord.status === 'claimed'
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
                              {ord.status === 'paid'
                                ? 'Solenoid Unlocked • Ready to open'
                                : 'Dispensed & Completed'}
                            </p>
                          </div>
                        </div>

                        {ord.status === 'paid' && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[9px] font-black animate-pulse">
                            OPEN DOOR
                          </span>
                        )}
                      </div>
                    )}

                    <div className="mt-2 pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                      <span className="truncate max-w-[240px]">
                        {ord.items.map((i) => `${i.product.name} (x${i.quantity})`).join(', ')}
                      </span>
                      <span className="shrink-0 text-[10px] text-stone-400 font-medium">
                        {ord.createdAt}
                      </span>
                    </div>
                  </div>
                ))}
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
