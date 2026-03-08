'use client';

import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { CreatorProfile } from '@/lib/creator-aggregator';
import { CreatorProfileCard } from '@/components/creator-profile-card';

interface CreatorCarouselProps {
  creators: CreatorProfile[];
  maxCreators?: number;
}

export function CreatorCarousel({ creators, maxCreators = 10 }: CreatorCarouselProps) {
  const limitedCreators = creators.slice(0, maxCreators);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    slidesToScroll: 1,
    loop: false,
  });

  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback((index: number) => {
    if (emblaApi) emblaApi.scrollTo(index);
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
  }, [emblaApi, onSelect]);

  return (
    <div className="relative">
      {/* Embla Carousel Container */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-6">
          {limitedCreators.map((creator, index) => (
            <div
              key={creator.name}
              className="flex-[0_0_100%] md:flex-[0_0_50%] lg:flex-[0_0_33.333%]"
            >
              <CreatorProfileCard
                rank={index + 1}
                creator={creator}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows - Hidden on mobile */}
      <div className="hidden md:flex justify-between absolute top-1/2 -translate-y-1/2 left-0 right-0 px-6 -mx-6 pointer-events-none">
        <button
          onClick={scrollPrev}
          disabled={selectedIndex === 0}
          className="pointer-events-auto w-12 h-12 rounded-full bg-gradient-to-r from-pink-600 to-orange-500 text-white shadow-lg flex items-center justify-center hover:shadow-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Previous creators"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={scrollNext}
          disabled={selectedIndex >= limitedCreators.length - 3}
          className="pointer-events-auto w-12 h-12 rounded-full bg-gradient-to-r from-pink-600 to-orange-500 text-white shadow-lg flex items-center justify-center hover:shadow-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Next creators"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Dot Indicators */}
      <div className="flex justify-center gap-2 mt-6">
        {limitedCreators.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollTo(index)}
            className={`h-2 rounded-full transition-all ${
              index === selectedIndex
                ? 'w-8 bg-gradient-to-r from-pink-600 to-orange-500'
                : 'w-2 bg-gray-300 hover:bg-gray-400'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
