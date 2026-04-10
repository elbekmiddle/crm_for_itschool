import React, { useLayoutEffect, useRef, useState } from 'react';
import { cn } from '../../lib/utils';

type TabDef = { id: string; label: React.ReactNode; className?: string };

type Props = {
  tabs: TabDef[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
  tabButtonClassName?: string;
};

/**
 * Pastki chiziq aktiv tab ostiga silliq siljiydi (barcha tab-row uchun qayta ishlatiladi).
 */
export function SlidingTabIndicator({
  tabs,
  activeId,
  onChange,
  className,
  tabButtonClassName,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [line, setLine] = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    const measure = () => {
      const idx = tabs.findIndex((t) => t.id === activeId);
      const el = idx >= 0 ? btnRefs.current[idx] : null;
      const wrap = wrapRef.current;
      if (!el || !wrap) return;
      const a = el.getBoundingClientRect();
      const b = wrap.getBoundingClientRect();
      setLine({ left: a.left - b.left, width: a.width });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [activeId, tabs]);

  return (
    <div ref={wrapRef} className={cn('relative flex flex-wrap items-center gap-1 border-b border-slate-100 dark:border-[var(--border)]', className)}>
      {tabs.map((t, i) => {
        const active = t.id === activeId;
        return (
          <button
            key={t.id}
            type="button"
            ref={(el) => {
              btnRefs.current[i] = el;
            }}
            onClick={() => onChange(t.id)}
            className={cn(
              'relative z-[1] px-3 py-2.5 text-sm font-bold transition-colors duration-200',
              active ? 'text-primary-600 dark:text-[var(--accent)]' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300',
              tabButtonClassName,
              t.className,
            )}
          >
            {t.label}
          </button>
        );
      })}
      <span
        className="pointer-events-none absolute bottom-0 z-0 h-0.5 rounded-full bg-primary-600 transition-[left,width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] dark:bg-[var(--accent)]"
        style={{ left: line.left, width: line.width }}
        aria-hidden
      />
    </div>
  );
}
