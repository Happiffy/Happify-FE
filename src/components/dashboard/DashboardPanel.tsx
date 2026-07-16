import type { Icon } from '@phosphor-icons/react';

const card = 'rounded-[28px] border-2 border-[#E5E5E5] bg-white shadow-[0_4px_0_#D9D9D9]';
const iconBox = 'grid size-14 shrink-0 place-items-center rounded-2xl';
const btn = 'inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl px-6 font-black transition active:translate-y-1 active:shadow-none';
const primaryBtn = `${btn} bg-[#58CC02] text-white shadow-[0_5px_0_#46A302] hover:-translate-y-0.5`;
const tones = {
  green: 'bg-[#58CC02] text-white shadow-[0_4px_0_#46A302]',
  blue: 'bg-[#1CB0F6] text-white shadow-[0_4px_0_#168CC7]',
  gold: 'bg-[#FFC800] text-[#8C6D00] shadow-[0_4px_0_#D8A900]',
  red: 'bg-[#FF4B4B] text-white shadow-[0_4px_0_#D53838]',
  purple: 'bg-[#CE82FF] text-white shadow-[0_4px_0_#A760D2]',
  peach: 'bg-[#FF9600] text-white shadow-[0_4px_0_#D97A00]',
};

export function DashboardPanel({ title, subtitle, tone, icon: IconComponent, items, action, onAction }: { title: string, subtitle: string, tone: keyof typeof tones, icon: Icon, items: string[], action: string, onAction?: () => void }) {
  return (
    <section className="grid gap-5 xl:grid-cols-[.75fr_1.25fr]" aria-labelledby={`${title}-title`}>
      <article className={`${card} p-6`}>
        <span className={`${iconBox} ${tones[tone]}`}><IconComponent size={28} weight="fill" /></span>
        <h2 id={`${title}-title`} className="mt-5 text-3xl font-black tracking-[-.04em]">{title}</h2>
        <p className="mt-2 font-bold leading-7 text-[#777]">{subtitle}</p>
        <button className={`${primaryBtn} mt-6`} type="button" onClick={onAction}>{action}</button>
      </article>
      <article className={`${card} grid content-start gap-4 p-5 sm:p-6`}>
        {items.map((item, index) => (
          <div className="flex items-center gap-4 rounded-3xl bg-[#F7F7F7] p-4" key={item}>
            <span className={`${iconBox} ${tones[tone]} size-11 rounded-xl text-sm`}>{index + 1}</span>
            <p className="font-bold leading-7 text-[#777]">{item}</p>
          </div>
        ))}
      </article>
    </section>
  );
}
