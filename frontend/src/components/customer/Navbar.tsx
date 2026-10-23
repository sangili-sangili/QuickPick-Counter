import React, { useState, useRef, useEffect } from 'react';
import { Heart, ShoppingBag, User, LogOut, ChevronDown, Sparkles } from 'lucide-react';
import { CustomerUser } from '../../types';

interface NavbarProps {
  cartCount: number;
  wishlistCount: number;
  currentUser: CustomerUser | null;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onOpenAuth: () => void;
  onOpenProfile?: () => void;
  onLogout: () => void;
  onGoHome: () => void;
  onGoToAdmin?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  wishlistCount,
  currentUser,
  onOpenCart,
  onOpenWishlist,
  onOpenAuth,
  onOpenProfile,
  onLogout,
  onGoHome,
  onGoToAdmin,
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-[#E8D7C0]/95 backdrop-blur-md border-b border-[#D8C2A7] shadow-[0_2px_12px_rgba(41,37,36,0.06)] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
        {/* Left: Brand Logo */}
        <div
          onClick={onGoHome}
          className="flex items-center gap-3 cursor-pointer select-none group"
        >
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-primary via-red-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-red-500/20 group-hover:scale-105 transition-transform shrink-0">
            <span className="text-xl">🍿</span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-xl font-black tracking-tight text-stone-900 group-hover:text-primary transition-colors">
                Snack<span className="text-primary">Hub</span>
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onGoToAdmin?.();
                }}
                className="px-2 py-0.5 rounded-full bg-primary/10 hover:bg-primary hover:text-white text-primary text-[10px] font-black uppercase tracking-wider border border-primary/20 transition-all cursor-pointer"
                title="Switch to Admin Portal"
              >
                Kiosk • Admin
              </button>
            </div>
            <p className="text-[11px] text-stone-600 font-semibold leading-none mt-0.5">
              Crispy. Fast. <span className="text-primary font-bold">Always Fresh.</span>
            </p>
          </div>
        </div>

        {/* Right Actions: Customer Auth, Wishlist Heart & Shopping Bag Cart */}
        <div className="flex items-center gap-2.5">
            {/* Wishlist Button */}
          <button
            onClick={onOpenWishlist}
            className="relative w-10 h-10 rounded-2xl bg-white/90 hover:bg-white border border-[#D8C2A7] flex items-center justify-center text-stone-700 hover:text-primary hover:border-primary/40 transition-all shadow-xs active:scale-95 cursor-pointer"
            title="Wishlist / Favorites"
          >
            <Heart className="w-4 h-4 hover:fill-primary" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center shadow-xs">
                {wishlistCount}
              </span>
            )}
          </button>

          {/* Cart Icon */}
          <button
            onClick={onOpenCart}
            id="cart-trigger-button"
            className="relative w-10 h-10 rounded-2xl bg-white/90 hover:bg-white border border-[#D8C2A7] flex items-center justify-center text-stone-800 hover:text-primary hover:border-primary/40 transition-all shadow-xs active:scale-95 group cursor-pointer"
            title="Open Cart"
          >
            <ShoppingBag className="w-4 h-4 group-hover:text-primary transition-colors" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center shadow-sm animate-pulse-ring">
                {cartCount}
              </span>
            )}
          </button>
          {/* Customer Auth Button / Profile Dropdown */}
          {!currentUser ? (
            <button
              onClick={onOpenAuth}
              className="h-10 px-3.5 rounded-2xl bg-white/90 hover:bg-white border border-[#D8C2A7] flex items-center gap-1.5 text-stone-700 hover:text-primary hover:border-primary/40 transition-all shadow-xs active:scale-95 text-xs font-bold cursor-pointer"
              title="Customer Sign In or Register"
            >
              <User className="w-4 h-4 text-stone-500" />
              <span className="hidden sm:inline">Sign In</span>
            </button>
          ) : (
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="h-10 px-3 rounded-2xl bg-white/90 hover:bg-white border border-[#D8C2A7] flex items-center gap-2 text-stone-800 hover:border-primary/40 transition-all shadow-xs active:scale-95 text-xs font-bold cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-[11px] font-black shrink-0 shadow-xs">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline max-w-[85px] truncate font-bold text-stone-800">
                  {currentUser.name.split(' ')[0]}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-stone-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl p-2.5 shadow-xl border border-[#EFE8DE] animate-in fade-in zoom-in-95 duration-150 z-50">
                  <div className="p-3 bg-[#FAF5EF] rounded-xl border border-[#EFE8DE] mb-2">
                    <p className="text-xs font-black text-stone-900 truncate">{currentUser.name}</p>
                    <p className="text-[10px] text-stone-400 font-medium truncate mt-0.5">
                      {currentUser.email || currentUser.phone}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-extrabold border border-amber-200">
                        <Sparkles className="w-2.5 h-2.5" />
                        {currentUser.membershipTier || 'Gold Member'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      onOpenProfile?.();
                    }}
                    className="w-full px-3 py-2 rounded-xl text-left text-xs font-bold text-stone-800 hover:bg-[#FAF5EF] flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-primary" />
                    <span>My Account & Orders</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      onOpenWishlist();
                    }}
                    className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-stone-700 hover:bg-[#FAF5EF] flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Heart className="w-3.5 h-3.5 text-primary" />
                    <span>My Wishlist ({wishlistCount})</span>
                  </button>

                  <div className="border-t border-[#EFE8DE] my-1" />

                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      onLogout();
                    }}
                    className="w-full px-3 py-2 rounded-xl text-left text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          )}

        
        </div>
      </div>
    </header>
  );
};
