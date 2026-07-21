'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Testimonial {
  id: string;
  name: string;
  role: string;
  when: string;
  rating: number;
  text: string;
  accent: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: '1',
    name: 'Ananya',
    role: 'Final-year CSE · Placed at TCS',
    when: '2 weeks ago',
    rating: 5,
    text: 'The placement drive simulation felt exactly like our campus drive. Aptitude, coding, and HR rounds in one flow helped me stay calm on the real interview day.',
    accent: '#098855',
  },
  {
    id: '2',
    name: 'Rohan',
    role: 'Graduate · Mock Interview User',
    when: '1 week ago',
    rating: 5,
    text: 'AI mock interviews caught the exact gaps in my behavioral answers. After two weeks of practice, I cleared my first culture-fit round with confidence.',
    accent: '#1E7BFF',
  },
  {
    id: '3',
    name: 'Meera',
    role: 'MBA Student · Resume Analysis',
    when: '3 days ago',
    rating: 5,
    text: 'The ATS resume score showed what recruiters were missing. I fixed keyword gaps and started getting shortlists within a week.',
    accent: '#FF541F',
  },
  {
    id: '4',
    name: 'Karan',
    role: 'B.Tech · GD Practice',
    when: '5 days ago',
    rating: 4,
    text: 'Group discussion practice with AI peers was a game changer. I learned how to structure points and not freeze when others spoke over me.',
    accent: '#098855',
  },
  {
    id: '5',
    name: 'Sneha',
    role: 'Job Seeker · Career Guidance',
    when: '1 week ago',
    rating: 5,
    text: 'Career guidance mapped a clear skill path for product roles. SolviQ turned random preparation into a focused weekly plan.',
    accent: '#1E7BFF',
  },
  {
    id: '6',
    name: 'Vikram',
    role: 'Campus Aspirant · Coding Tests',
    when: '4 days ago',
    rating: 5,
    text: 'Role-based coding and aptitude tests mirrored company patterns. I stopped guessing and started practicing what actually shows up in drives.',
    accent: '#FF541F',
  },
  {
    id: '7',
    name: 'Divya',
    role: 'ECE Student · Readiness Score',
    when: '6 days ago',
    rating: 5,
    text: 'The free job readiness score was honest and useful. It showed my weak areas early so I could fix them before placement season.',
    accent: '#098855',
  },
  {
    id: '8',
    name: 'Aditya',
    role: 'Placed · Infosys',
    when: '2 weeks ago',
    rating: 5,
    text: 'From resume feedback to mock HR rounds, SolviQ felt like having a placement mentor on demand. Worth every practice session.',
    accent: '#1E7BFF',
  },
];

export function Testimonials() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoveredRef = useRef(false);
  const loopItems = [...TESTIMONIALS, ...TESTIMONIALS];

  const updateScrollState = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const nextProgress = max > 0 ? el.scrollLeft / max : 0;
    setProgress(nextProgress);
    setCanPrev(el.scrollLeft > 8);
    setCanNext(el.scrollLeft < max - 8);
  }, []);

  const pauseTemporarily = useCallback((ms = 4000) => {
    setIsPaused(true);
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      if (!hoveredRef.current) setIsPaused(false);
    }, ms);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [updateScrollState]);

  // Continuous right → left auto scroll with seamless loop
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    let rafId = 0;
    const speed = 0.45;

    const tick = () => {
      if (!isPaused && el) {
        const loopWidth = el.scrollWidth / 2;
        el.scrollLeft += speed;
        if (loopWidth > 0 && el.scrollLeft >= loopWidth) {
          el.scrollLeft -= loopWidth;
        }
        updateScrollState();
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isPaused, updateScrollState]);

  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, []);

  const scrollByCard = useCallback(
    (direction: 'left' | 'right') => {
      const el = scrollerRef.current;
      if (!el) return;
      pauseTemporarily();
      const amount = Math.min(340, el.clientWidth * 0.85);
      el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
    },
    [pauseTemporarily],
  );

  return (
    <section
      id="testimonials"
      className="relative overflow-hidden bg-[#F5F6F8] py-16 dark:bg-gray-950 sm:py-20 lg:py-24"
    >
      <div className="relative z-10 mx-auto w-[92%] max-w-[1240px]">
        {/* Top header */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="mb-12 text-center sm:mb-14"
        >
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl lg:text-[2.75rem]">
            Read reviews, prepare with confidence.
          </h2>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <span className="font-semibold text-gray-900 dark:text-white">4.8/5</span>
            <Star className="h-4 w-4 fill-brand-green text-brand-green" />
            <span className="font-semibold text-brand-green">SolviQ Students</span>
            <span className="text-gray-400">·</span>
            <span>Based on 2,400+ practice sessions</span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[280px_minmax(0,1fr)]">
          {/* Left sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex flex-col justify-between lg:min-h-[320px]"
          >
            <div>
              <span className="block font-serif text-6xl leading-none text-gray-300 dark:text-gray-700" aria-hidden>
                “
              </span>
              <h3 className="mt-2 max-w-[220px] text-2xl font-bold leading-snug text-gray-900 dark:text-white">
                What our students are saying
              </h3>
            </div>

            <div className="mt-8 flex items-center gap-3 lg:mt-0">
              <button
                type="button"
                onClick={() => scrollByCard('left')}
                disabled={!canPrev}
                aria-label="Previous testimonials"
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 transition hover:border-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200',
                  !canPrev && 'cursor-not-allowed opacity-40',
                )}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div className="relative h-[2px] flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-gray-900 transition-all duration-300 dark:bg-white"
                  style={{ width: `${Math.max(18, progress * 100)}%` }}
                />
              </div>

              <button
                type="button"
                onClick={() => scrollByCard('right')}
                disabled={!canNext}
                aria-label="Next testimonials"
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 transition hover:border-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200',
                  !canNext && 'cursor-not-allowed opacity-40',
                )}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </motion.div>

          {/* Scrollable cards */}
          <div
            ref={scrollerRef}
            onMouseEnter={() => {
              hoveredRef.current = true;
              setIsPaused(true);
            }}
            onMouseLeave={() => {
              hoveredRef.current = false;
              setIsPaused(false);
            }}
            onFocusCapture={() => {
              hoveredRef.current = true;
              setIsPaused(true);
            }}
            onBlurCapture={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                hoveredRef.current = false;
                setIsPaused(false);
              }
            }}
            className="scrollbar-hide flex gap-5 overflow-x-auto scroll-smooth pb-2 pt-1"
            style={{ scrollSnapType: 'none' }}
          >
            {loopItems.map((item, index) => (
              <TestimonialCard
                key={`${item.id}-${index}`}
                item={item}
                index={index % TESTIMONIALS.length}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({ item, index }: { item: Testimonial; index: number }) {
  const initial = item.name.charAt(0).toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.3) }}
      className="w-[280px] shrink-0 sm:w-[300px]"
      style={{ scrollSnapAlign: 'start' }}
    >
      <div className="relative rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] dark:bg-gray-900 dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)] sm:p-6">
        <p className="min-h-[120px] text-[15px] leading-relaxed text-gray-700 dark:text-gray-300">
          {item.text}
        </p>

        <div className="mt-4 flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={cn(
                'h-4 w-4',
                i < item.rating
                  ? 'fill-brand-green text-brand-green'
                  : 'fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700',
              )}
            />
          ))}
        </div>

        {/* Speech bubble tail */}
        <span
          className="absolute -bottom-2 left-8 h-4 w-4 rotate-45 bg-white shadow-sm dark:bg-gray-900"
          aria-hidden
        />
      </div>

      <div className="mt-4 flex items-center gap-3 pl-1">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base font-bold text-white"
          style={{ backgroundColor: item.accent }}
        >
          {initial}
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold text-gray-900 dark:text-white">{item.name}</p>
          <p className="truncate text-xs text-gray-500 dark:text-gray-400">
            {item.role} · {item.when}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
