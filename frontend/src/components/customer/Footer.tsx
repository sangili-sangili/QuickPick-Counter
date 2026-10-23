import React from 'react';
import { HelpCircle, ShieldCheck, Box, PhoneCall } from 'lucide-react';

interface FooterProps {
  onOpenHelp: () => void;
  onGoHome: () => void;
  onViewAll: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenHelp,
  onGoHome,
  onViewAll,
}) => {
  return (
    <footer className="mt-12 bg-white border-t border-[#EFE8DE] text-stone-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Col 1: Brand Info */}
          <div className="md:col-span-5 space-y-3.5">
            <div
              onClick={onGoHome}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center text-white shadow-sm">
                <span className="text-lg">🍿</span>
              </div>
              <span className="text-xl font-black tracking-tight text-stone-900 group-hover:text-primary transition-colors">
                Snack<span className="text-primary">Hub</span>
              </span>
            </div>

            <p className="text-xs sm:text-sm text-stone-500 leading-relaxed max-w-sm">
              Your instant self-service snack counter. Pick your favorite munchies, pay in seconds with UPI QR, and collect from an automated smart locker.
            </p>

            <div className="flex items-center gap-4 text-xs font-semibold text-stone-500 pt-1">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-green-600" />
                Secure UPI
              </span>
              <span className="flex items-center gap-1.5">
                <Box className="w-4 h-4 text-primary" />
                Contactless Locker
              </span>
            </div>
          </div>

          {/* Col 2: Quick Navigation */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Quick Links
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm font-semibold">
              <li>
                <button
                  onClick={onGoHome}
                  className="hover:text-primary transition-colors text-left"
                >
                  Home Catalog
                </button>
              </li>
              <li>
                <button
                  onClick={onViewAll}
                  className="hover:text-primary transition-colors text-left"
                >
                  View All Products & Combos
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenHelp}
                  className="hover:text-primary transition-colors text-left"
                >
                  3-Step Kiosk Instructions
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Help & Support Menu (Per Point 8) */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-primary" />
              Help & Support Menu
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-stone-600">
              <li>
                <button
                  onClick={onOpenHelp}
                  className="hover:text-primary font-semibold transition-colors flex items-center gap-1.5"
                >
                  <span>How SnackHub Locker Pickup Works</span>
                </button>
              </li>
              <li className="text-stone-500 text-xs">
                Hold Policy: Stock is reserved for 120 seconds upon checkout.
              </li>
              <li className="text-stone-500 text-xs">
                Payment: Scan with Google Pay, PhonePe, Paytm, or any UPI app.
              </li>
              <li className="pt-1 flex items-center gap-2 text-xs font-bold text-stone-800">
                <PhoneCall className="w-3.5 h-3.5 text-primary" />
                <span>Kiosk Support: 1800-SNACK-HUB</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div className="mt-8 pt-6 border-t border-[#EFE8DE] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-400">
          <p>© 2026 SnackHub QuickPick Counter. All rights reserved.</p>
          <div className="flex items-center gap-4 font-medium">
            <button onClick={onOpenHelp} className="hover:text-stone-600">
              Kiosk Guide
            </button>
            <span>•</span>
            <span>Privacy</span>
            <span>•</span>
            <span>Terms</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
