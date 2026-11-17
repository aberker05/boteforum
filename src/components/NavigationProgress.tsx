'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const prefetchedSet = useRef<Set<string>>(new Set());

  // Rota değişimi tamamlandığında çubuğu %100 yapıp gizle
  useEffect(() => {
    if (!visible) return;
    setProgress(100);
    const timer = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 180);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;

    // Fare linkin üzerine geldiğinde veya mobilde dokunulduğunda (0ms) arka planda tam sayfayı önyükle (Prefetch)
    const handleHoverOrTouch = (e: Event) => {
      const target = (e.target as HTMLElement | null)?.closest('a');
      if (!target) return;
      const href = target.getAttribute('href');
      if (
        !href ||
        href.startsWith('#') ||
        href.startsWith('http') ||
        href.startsWith('mailto:')
      ) {
        return;
      }
      if (!prefetchedSet.current.has(href)) {
        prefetchedSet.current.add(href);
        try {
          router.prefetch(href);
        } catch {
          // ignore
        }
      }
    };

    const handleClick = (e: MouseEvent) => {
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }
      const anchor = (e.target as HTMLElement | null)?.closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      const targetAttr = anchor.getAttribute('target');
      if (
        !href ||
        targetAttr === '_blank' ||
        href.startsWith('#') ||
        href.startsWith('http') ||
        href.startsWith('mailto:')
      ) {
        return;
      }

      const currentFull =
        window.location.pathname + window.location.search;
      if (href === currentFull || href === window.location.pathname) {
        return;
      }

      setVisible(true);
      setProgress(35);
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(() => {
        setProgress((prev) => (prev < 88 ? prev + 12 : prev));
      }, 120);
    };

    document.addEventListener('mouseover', handleHoverOrTouch, { passive: true });
    document.addEventListener('touchstart', handleHoverOrTouch, { passive: true });
    document.addEventListener('click', handleClick);

    return () => {
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener('mouseover', handleHoverOrTouch);
      document.removeEventListener('touchstart', handleHoverOrTouch);
      document.removeEventListener('click', handleClick);
    };
  }, [router]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-0.5 pointer-events-none overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-indigo-500 via-emerald-400 to-violet-500 transition-all duration-150 ease-out shadow-[0_0_10px_#6366f1]"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
