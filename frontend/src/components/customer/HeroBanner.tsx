import React, { useState, useEffect } from 'react';
import { ArrowRight, Flame, Sparkles, Coffee, ChevronLeft, ChevronRight } from 'lucide-react';

interface SlideData {
  id: number;
  badge: string;
  badgeIcon: React.ReactNode;
  title: string;
  highlightText: string;
  subtitle: string;
  image: string;
  ctaText: string;
}

const SLIDES: SlideData[] = [
  {
    id: 1,
    badge: 'Hot & Crispy • Instant Pickup',
    badgeIcon: <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />,
    title: 'Crave the Crispy',
    highlightText: 'Perfection!',
    subtitle: 'Freshly stocked treats. Pay in seconds via UPI and collect from your assigned smart locker.',
    image: '/images/hero-snacks.jpg',
    ctaText: 'Order Snacks Now',
  },
  {
    id: 2,
    badge: 'Chilled Refreshment • Fast Pickup',
    badgeIcon: <Sparkles className="w-3.5 h-3.5 text-amber-400" />,
    title: 'Cold Sodas & Chilled',
    highlightText: 'Energy Drinks!',
    subtitle: 'Grab Coca-Cola, Red Bull, and cool beverages at locker temperature instantly.',
    image: '/images/coke.jpg',
    ctaText: 'Grab Cold Drinks',
  },
  {
    id: 3,
    badge: 'Sweet Treats • 15% Off Combos',
    badgeIcon: <Coffee className="w-3.5 h-3.5 text-amber-400" />,
    title: 'Sweet Chocolates &',
    highlightText: 'Crisp Cookies!',
    subtitle: 'KitKat wafers, Oreo cookies, and mouth-watering chocolate treats ready in locker.',
    image: '/images/kitkat.jpg',
    ctaText: 'Explore Sweets',
  },
];

interface HeroBannerProps {
  onOrderNow?: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ onOrderNow }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto carousel rotation
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % SLIDES.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [isPaused]);

  const currentSlide = SLIDES[currentSlideIndex];

  const handlePrev = () => {
    setCurrentSlideIndex((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  };

  const handleNext = () => {
    setCurrentSlideIndex((prev) => (prev + 1) % SLIDES.length);
  };

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#7F1D1D] via-[#991B1B] to-[#B91C1C] text-white p-6 sm:p-8 lg:p-9 shadow-lg group/carousel"
    >
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-red-500/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-60 h-60 rounded-full bg-orange-500/20 blur-2xl pointer-events-none" />

      {/* Manual Slide Navigation Arrows */}
      <button
        onClick={handlePrev}
        className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center backdrop-blur-xs transition-all opacity-0 group-hover/carousel:opacity-100 active:scale-95"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <button
        onClick={handleNext}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center backdrop-blur-xs transition-all opacity-0 group-hover/carousel:opacity-100 active:scale-95"
        aria-label="Next slide"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Slide Content */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center min-h-[220px]">
        {/* Left text column */}
        <div className="md:col-span-7 lg:col-span-8 space-y-3.5 transition-all duration-300">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white text-[11px] font-bold uppercase tracking-wider">
            {currentSlide.badgeIcon}
            <span>{currentSlide.badge}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
            {currentSlide.title} <br className="hidden sm:inline" />
            <span className="text-amber-400">{currentSlide.highlightText}</span>
          </h2>

          <p className="text-xs sm:text-sm text-red-100 max-w-md leading-relaxed">
            {currentSlide.subtitle}
          </p>

          <div className="pt-2">
            <button
              onClick={onOrderNow}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-primary hover:bg-red-50 font-extrabold text-xs sm:text-sm shadow-md transition-all active:scale-95 group/btn"
            >
              <span>{currentSlide.ctaText}</span>
              <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center group-hover/btn:translate-x-0.5 transition-transform">
                <ArrowRight className="w-3 h-3 stroke-[3]" />
              </div>
            </button>
          </div>
        </div>

        {/* Right 3D image column */}
        <div className="md:col-span-5 lg:col-span-4 flex justify-center md:justify-end">
          <div className="relative group">
            <div className="absolute inset-0 bg-amber-500/20 rounded-3xl blur-xl" />
            <img
              key={currentSlide.id}
              src={currentSlide.image}
              alt={currentSlide.title}
              className="relative w-44 sm:w-52 md:w-full max-w-[240px] max-h-[190px] object-contain rounded-2xl drop-shadow-2xl animate-in fade-in zoom-in-95 duration-500"
            />
          </div>
        </div>
      </div>

      {/* Interactive Pagination Dots */}
      <div className="mt-4 flex items-center justify-center gap-2 pt-2">
        {SLIDES.map((slide, idx) => (
          <button
            key={slide.id}
            onClick={() => setCurrentSlideIndex(idx)}
            className={`transition-all duration-300 rounded-full ${
              currentSlideIndex === idx
                ? 'w-6 h-2 bg-amber-400'
                : 'w-2 h-2 bg-white/40 hover:bg-white/70'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
