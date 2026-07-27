import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../../api/client';
import { trackBannerClick } from '../../lib/analytics';

interface Banner {
  id: number;
  imagenDesktopUrl: string;
  imagenMobileUrl: string | null;
  href: string | null;
  esExterno: boolean;
  abreEnNuevaPestana: boolean;
  titulo: string;
}

const AUTOPLAY_MS = 6000;
const MD_BREAKPOINT = 768;

function usePerView() {
  const [perView, setPerView] = useState(1);
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${MD_BREAKPOINT}px)`);
    const sync = () => setPerView(mq.matches ? 2 : 1);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  return perView;
}

function chunk<T>(arr: T[], size: number): T[][] {
  if (size <= 0) return [arr];
  const pages: T[][] = [];
  for (let i = 0; i < arr.length; i += size) pages.push(arr.slice(i, i + size));
  return pages;
}

function BannerImage({ banner }: { banner: Banner }) {
  const mobile = banner.imagenMobileUrl || banner.imagenDesktopUrl;
  return (
    <picture>
      <source media={`(min-width: ${MD_BREAKPOINT}px)`} srcSet={banner.imagenDesktopUrl} />
      <img src={mobile} alt={banner.titulo} loading="lazy" className="block h-auto w-full" />
    </picture>
  );
}

function BannerLink({ banner, children }: { banner: Banner; children: React.ReactNode }) {
  const onClick = () => trackBannerClick(banner.titulo, banner.id);

  if (!banner.href) {
    return <div className="block overflow-hidden rounded-xl">{children}</div>;
  }

  if (banner.esExterno || banner.abreEnNuevaPestana) {
    return (
      <a
        href={banner.href}
        onClick={onClick}
        target={banner.abreEnNuevaPestana ? '_blank' : undefined}
        rel={banner.abreEnNuevaPestana ? 'noopener noreferrer' : undefined}
        className="block overflow-hidden rounded-xl"
      >
        {children}
      </a>
    );
  }

  return (
    <Link to={banner.href} onClick={onClick} className="block overflow-hidden rounded-xl">
      {children}
    </Link>
  );
}

export function BannerSlider() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [page, setPage] = useState(0);
  const perView = usePerView();
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getBannersPublicos('home')
      .then((res) => {
        if (!cancelled) setBanners(res || []);
      })
      .catch(() => {
        if (!cancelled) setBanners([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const pages = useMemo(() => chunk(banners, perView), [banners, perView]);
  const pageCount = pages.length;

  useEffect(() => {
    setPage((p) => (pageCount === 0 ? 0 : Math.min(p, pageCount - 1)));
  }, [pageCount]);

  const go = useCallback(
    (next: number) => {
      if (pageCount <= 0) return;
      setPage(((next % pageCount) + pageCount) % pageCount);
    },
    [pageCount],
  );

  useEffect(() => {
    if (pageCount <= 1) return;
    const t = setInterval(() => setPage((p) => (p + 1) % pageCount), AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [pageCount]);

  if (banners.length === 0) return null;

  return (
    <section className="container mx-auto max-w-7xl px-4 pt-4 md:pt-8">
      <div
        className="group relative overflow-hidden"
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (touchStartX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchStartX.current;
          if (Math.abs(dx) > 40) go(page + (dx < 0 ? 1 : -1));
          touchStartX.current = null;
        }}
      >
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${page * 100}%)` }}
        >
          {pages.map((group, pageIdx) => (
            <div
              key={pageIdx}
              className="grid w-full shrink-0 grid-cols-1 gap-3 md:grid-cols-2"
            >
              {group.map((b) => (
                <BannerLink key={b.id} banner={b}>
                  <BannerImage banner={b} />
                </BannerLink>
              ))}
            </div>
          ))}
        </div>

        {pageCount > 1 && (
          <>
            <button
              type="button"
              aria-label="Anterior"
              onClick={() => go(page - 1)}
              className="absolute left-2 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-stone-700 opacity-0 shadow-sm transition-opacity hover:bg-white group-hover:opacity-100 md:flex"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              aria-label="Siguiente"
              onClick={() => go(page + 1)}
              className="absolute right-2 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-stone-700 opacity-0 shadow-sm transition-opacity hover:bg-white group-hover:opacity-100 md:flex"
            >
              <ChevronRight size={20} />
            </button>

            <div className="mt-3 flex justify-center gap-1.5">
              {pages.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Ir a la página ${i + 1}`}
                  onClick={() => setPage(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === page ? 'w-6 bg-brand-700' : 'w-2 bg-stone-300 hover:bg-stone-400'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
