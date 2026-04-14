import type { ComputedRef, InjectionKey } from 'vue';

export type ChromeVariant = 'tech-frame' | 'grid-frame' | 'cyan-bracket' | 'command-angled';

export const panelChromeKey: InjectionKey<ComputedRef<ChromeVariant>> = Symbol('panelChrome');

const supportedVariants = new Set<ChromeVariant>(['tech-frame', 'grid-frame', 'cyan-bracket', 'command-angled']);

export function resolveChromeVariant(value?: string): ChromeVariant {
  return supportedVariants.has(value as ChromeVariant) ? (value as ChromeVariant) : 'tech-frame';
}

export const shellBaseClass =
  'flex h-full min-h-0 flex-col gap-5 overflow-hidden';

export const shellVariantClasses: Record<ChromeVariant, string> = {
  'tech-frame': 'text-slate-50',
  'grid-frame': 'text-slate-50',
  'cyan-bracket': 'text-slate-50',
  'command-angled': 'text-slate-50',
};

export const panelBaseClass =
  "relative grid min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-[1.25rem] border p-5 shadow-[0_20px_70px_rgba(1,8,20,0.45)]";

export const panelVariantClasses: Record<ChromeVariant, string> = {
  'tech-frame':
    'border-cyan-300/24 bg-[linear-gradient(180deg,rgba(11,28,49,0.92),rgba(5,14,25,0.92))]',
  'grid-frame':
    'border-cyan-200/26 bg-[linear-gradient(180deg,rgba(8,34,56,0.94),rgba(5,16,28,0.9))]',
  'cyan-bracket':
    'border-teal-300/28 bg-[linear-gradient(180deg,rgba(6,28,34,0.94),rgba(5,14,25,0.92))]',
  'command-angled':
    'border-amber-200/26 bg-[linear-gradient(180deg,rgba(13,26,47,0.95),rgba(5,14,25,0.92))]',
};

export const panelCornerClasses: Record<ChromeVariant, string> = {
  'tech-frame': 'border-cyan-300/42',
  'grid-frame': 'border-cyan-200/40',
  'cyan-bracket': 'border-teal-300/46',
  'command-angled': 'border-amber-200/52',
};

export const titleBaseClass =
  'inline-flex min-h-9 items-center gap-2.5 rounded-[10px_18px_10px_10px] border px-3 py-1.5 text-[15px] font-semibold tracking-[0.02em] text-slate-50';

export const titleVariantClasses: Record<ChromeVariant, string> = {
  'tech-frame': 'border-cyan-300/26 bg-[linear-gradient(90deg,rgba(83,213,255,0.18),rgba(83,213,255,0.04))]',
  'grid-frame': 'border-cyan-200/30 bg-[linear-gradient(90deg,rgba(83,213,255,0.18),rgba(46,240,197,0.05))]',
  'cyan-bracket': 'border-teal-300/34 bg-[linear-gradient(90deg,rgba(46,240,197,0.18),rgba(83,213,255,0.06))]',
  'command-angled': 'border-amber-200/32 bg-[linear-gradient(90deg,rgba(83,213,255,0.16),rgba(255,200,87,0.1))]',
};

export const titleAccentClasses: Record<ChromeVariant, string> = {
  'tech-frame': 'bg-gradient-to-r from-cyan-300 to-sky-400',
  'grid-frame': 'bg-gradient-to-r from-cyan-300 to-teal-300',
  'cyan-bracket': 'bg-gradient-to-r from-teal-300 to-cyan-300',
  'command-angled': 'bg-gradient-to-r from-sky-300 to-amber-200',
};
