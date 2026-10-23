import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Home,
  FileText,
  Unlock,
  Check,
  Star,
  Sparkles,
} from 'lucide-react';
import { Order } from '../../types';
import { formatTime } from '../../utils/format';

interface SuccessScreenProps {
  order: Order;
  onViewDetails: () => void;
  onBackToHome: () => void;
  onClaimOrder: () => void;
}

const RATING_FEEDBACK_TAGS = [
  '⚡ Ultra Fast Kiosk',
  '🍿 Fresh & Tasty Snacks',
  '📲 Instant UPI Payment',
  '🚪 Clean Smart Locker',
];

export const SuccessScreen: React.FC<SuccessScreenProps> = ({
  order,
  onViewDetails,
  onBackToHome,
  onClaimOrder,
}) => {
  const [isClaimed, setIsClaimed] = useState(order.status === 'claimed');

  // Rating State (Per User Request)
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [selectedTags, setSelectedTags] = useState<string[]>(['⚡ Ultra Fast Kiosk']);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [isRatingSubmitted, setIsRatingSubmitted] = useState(false);

  // Trigger celebration confetti on mount
  useEffect(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#E2231A', '#F59E0B', '#16A34A', '#FAF5EF'],
      });
    } catch (e) {
      // Graceful fallback
    }
  }, []);

  const handleClaim = () => {
    setIsClaimed(true);
    onClaimOrder();
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#16A34A', '#E2231A'],
      });
    } catch (e) {}
  };

  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags((prev) => prev.filter((t) => t !== tag));
    } else {
      setSelectedTags((prev) => [...prev, tag]);
    }
  };

  const handleSubmitRating = () => {
    if (rating === 0) return;
    setIsRatingSubmitted(true);
    try {
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.8 },
        colors: ['#F59E0B', '#E2231A'],
      });
    } catch (e) {}
  };

  const getRatingLabel = (stars: number) => {
    switch (stars) {
      case 1:
        return 'Needs improvement 😞';
      case 2:
        return 'Fair experience 😐';
      case 3:
        return 'Good 🙂';
      case 4:
        return 'Very Good! 😊';
      case 5:
        return 'Loved the speed & snacks! 🤩';
      default:
        return 'Tap a star to rate';
    }
  };

  const activeRatingDisplay = hoverRating || rating;
  const currentTime = formatTime();

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 sm:py-8 space-y-6 animate-in fade-in zoom-in-95 duration-300">
      {/* Top Card: Payment Successful */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EFE8DE] shadow-soft text-center space-y-6">
        {/* Celebration Animated Icon */}
        <div className="flex flex-col items-center justify-center">
          <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-green-100 text-green-600 flex items-center justify-center shadow-lg shadow-green-100 ring-8 ring-green-50 animate-bounce">
            <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 stroke-[2.5]" />
          </div>

          <h2 className="mt-5 text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
            Payment Successful!
          </h2>
          <p className="mt-1 text-sm text-stone-500 font-medium">
            Your order is confirmed. Order #{order.orderNumber}
          </p>
        </div>

        {/* Locker Number Highlight Card */}
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-red-50/80 via-amber-50/40 to-red-50/80 border border-red-100/80 flex items-center justify-between">
          <div className="text-left space-y-1">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Locker Number
            </span>
            <div className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight">
              {order.lockerNumber || 'L-07'}
            </div>
            <p className="text-xs text-primary font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-ping inline-block" />
              Compartment Ready
            </p>
          </div>

          {/* 3D Locker Kiosk Image */}
          <div className="relative">
            <img
              src="/images/locker-kiosk.jpg"
              alt="Locker Kiosk"
              className="w-20 h-20 sm:w-24 sm:h-24 object-contain rounded-2xl drop-shadow-md border border-white"
            />
          </div>
        </div>

        {/* Status Timeline / Tracking */}
        <div className="pt-1 text-left space-y-3">
          <div className="space-y-3">
            {/* Payment Received */}
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <span className="font-semibold text-stone-800">Payment Received</span>
              </div>
              <span className="text-stone-400 font-medium">{currentTime}</span>
            </div>

            {/* Order Preparing */}
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <span className="font-semibold text-stone-800">Order Preparing</span>
              </div>
              <span className="text-stone-400 font-medium">{currentTime}</span>
            </div>

            {/* Ready for Pickup */}
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <span className="font-semibold text-stone-800">Ready for Pickup</span>
              </div>
              <span className="text-stone-400 font-medium">{currentTime}</span>
            </div>
          </div>
        </div>

        {/* Claim / Unlock Locker Button */}
        <div className="pt-1">
          {!isClaimed ? (
            <button
              onClick={handleClaim}
              className="w-full py-3.5 px-4 rounded-2xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white flex items-center justify-center gap-2 shadow-md shadow-green-200 transition-all active:scale-98"
            >
              <Unlock className="w-4 h-4" />
              <span>Unlock & Collect Snacks</span>
            </button>
          ) : (
            <div className="p-3.5 rounded-2xl bg-green-50 border border-green-200 flex items-center justify-center gap-2 text-green-700 font-bold text-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span>Locker {order.lockerNumber || 'L-07'} Claimed & Opened! Enjoy your snacks!</span>
            </div>
          )}
        </div>

        {/* Interactive Rating Section (Per User Request) */}
        <div className="pt-4 border-t border-[#EFE8DE] text-left">
          {!isRatingSubmitted ? (
            <div className="bg-[#FAF5EF]/80 rounded-2xl p-4 sm:p-5 border border-[#EFE8DE] space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-stone-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span>Rate Your QuickPick Experience</span>
                  </h4>
                  <p className="text-xs text-stone-500 mt-0.5">
                    How was the ordering speed & pickup?
                  </p>
                </div>
                <span className="text-xs font-bold text-primary bg-red-50 px-2 py-0.5 rounded-lg">
                  {getRatingLabel(activeRatingDisplay)}
                </span>
              </div>

              {/* 5-Star Interactive Buttons */}
              <div className="flex items-center gap-2 justify-center py-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="p-1 text-stone-300 hover:scale-125 transition-transform focus:outline-none"
                    aria-label={`Rate ${star} star`}
                  >
                    <Star
                      className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                        star <= (hoverRating || rating)
                          ? 'fill-amber-400 text-amber-400 stroke-amber-400 drop-shadow-xs'
                          : 'stroke-stone-300'
                      }`}
                    />
                  </button>
                ))}
              </div>

              {/* Feedback Chip Tags */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {RATING_FEEDBACK_TAGS.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleToggleTag(tag)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all ${
                        isSelected
                          ? 'bg-primary text-white shadow-xs'
                          : 'bg-white border border-[#EFE8DE] text-stone-600 hover:border-red-200'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>

              {/* Optional Comments */}
              <div className="relative pt-1">
                <input
                  type="text"
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  placeholder="Leave a quick note (optional)..."
                  className="w-full pl-3 pr-3 py-2 text-xs bg-white border border-[#EFE8DE] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-stone-800 placeholder:text-stone-400"
                />
              </div>

              {/* Submit Rating Button */}
              <button
                onClick={handleSubmitRating}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-black text-white bg-primary hover:bg-primary-hover shadow-sm transition-all active:scale-98"
              >
                Submit Rating & Feedback
              </button>
            </div>
          ) : (
            <div className="bg-green-50/80 rounded-2xl p-4 border border-green-200 text-center space-y-1.5 animate-in fade-in duration-300">
              <div className="flex items-center justify-center gap-1.5 text-amber-500">
                {Array.from({ length: rating }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <h4 className="text-sm font-bold text-green-900">
                Thank you for your rating! ⭐
              </h4>
              <p className="text-xs text-green-700">
                Your feedback helps us keep the locker kiosk fast, fresh & seamless!
              </p>
            </div>
          )}
        </div>

        {/* Primary Action Buttons */}
        <div className="pt-2 space-y-3">
          <button
            onClick={onViewDetails}
            className="w-full py-3.5 px-4 rounded-2xl font-bold text-sm text-white bg-primary hover:bg-primary-hover flex items-center justify-center gap-2 shadow-md shadow-red-200 transition-all active:scale-98"
          >
            <FileText className="w-4 h-4" />
            <span>View Order Details</span>
          </button>

          <button
            onClick={onBackToHome}
            className="w-full py-3 px-4 rounded-2xl font-bold text-sm text-stone-600 hover:text-stone-900 bg-stone-50 hover:bg-stone-100 border border-[#EFE8DE] flex items-center justify-center gap-2 transition-all active:scale-98"
          >
            <Home className="w-4 h-4" />
            <span>Back to Home</span>
          </button>
        </div>
      </div>
    </div>
  );
};
