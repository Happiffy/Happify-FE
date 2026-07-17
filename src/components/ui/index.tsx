import { useState } from 'react'
import { Link } from 'react-router-dom'
import { type Icon, CaretDown } from '@phosphor-icons/react'
import mascot from '@/assets/mascot-quokka.png'
import { iconBox, moodLabel } from '@/components/ui/theme'
import ColoredIcon from '@/components/colored-icon'
import { MoodEmoji } from '@/constants/emoji'

export function BrandLink({ inverse = false }: { compact?: boolean, inverse?: boolean }) {
  return (
    <Link className={`inline-flex items-center gap-2 font-black ${inverse ? 'text-white' : 'text-[#58CC02]'}`} to="/" aria-label="Happify home">
      <img className="size-10" src={mascot} alt="" />
      <span>Happify</span>
    </Link>
  )
}

export function GoogleIcon() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.15v2.84C3.96 20.53 7.68 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.15C1.41 8.53 1 10.22 1 12s.41 3.47 1.15 4.94l3.69-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.68 1 3.96 3.47 2.15 7.06l3.69 2.84C6.71 7.3 9.14 5.38 12 5.38z" />
    </svg>
  )
}

export function UserAvatar({ profile, size = 'size-11' }: { profile: { displayName?: string | null, avatarUrl?: string | null } | null, size?: string }) {
  if (profile?.avatarUrl) return <img className={`${size} rounded-full border-2 border-[#E5E5E5] object-cover`} src={profile.avatarUrl} alt="Profile" referrerPolicy="no-referrer" />
  return <span className={`${size} grid place-items-center rounded-full bg-[#58CC02] font-black text-white`}>{(profile?.displayName ?? 'H').charAt(0).toUpperCase()}</span>
}

export function EmptyState({ icon, tone, title, body }: { icon: Icon | string, tone: string, title: string, body: string }) {
  const EmptyIcon = typeof icon === 'string' ? null : icon;
  return (
    <div className="grid min-h-72 place-items-center p-8 text-center">
      <div>
        {EmptyIcon ? <span className={`${iconBox} ${tone} mx-auto`}><EmptyIcon size={30} weight="fill" /></span> : <ColoredIcon className="mx-auto" icon={icon as string} size="xl" />}
        <h2 className="mt-5 text-2xl font-black">{title}</h2>
        <p className="mt-2 max-w-sm font-bold leading-7 text-[#999]">{body}</p>
      </div>
    </div>
  )
}

export function DuoSelect({ value, options, onChange, label }: { value: string, options: { value: string, label: string, icon?: string }[], onChange: (value: string) => void, label: string }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value) ?? options[0];
  return (
    <div className="relative">
      <button className={`flex min-h-12 w-full items-center justify-between rounded-2xl border-2 bg-white px-4 font-black shadow-[0_3px_0_#D9D9D9] outline-none transition ${open ? 'border-[#58CC02] ring-4 ring-[#D7FFBF]' : 'border-[#E5E5E5]'}`} type="button" aria-label={label} aria-expanded={open} onClick={() => setOpen((current) => !current)}>
        <span className="inline-flex items-center gap-2">{selected.icon && <ColoredIcon icon={selected.icon} size="sm" />}{selected.label}</span><CaretDown size={18} weight="bold" />
      </button>
      {open && <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border-2 border-[#E5E5E5] bg-white font-black shadow-[0_5px_0_#D9D9D9]">{options.map((option) => <button className={`flex w-full items-center gap-2 px-4 py-3 text-left transition ${option.value === value ? 'bg-[#F1FFE8] text-[#46A302]' : 'hover:bg-[#F7F7F7] text-[#555]'}`} type="button" key={option.value} onClick={() => { onChange(option.value); setOpen(false); }}>{option.icon && <ColoredIcon icon={option.icon} size="sm" />}{option.label}</button>)}</div>}
    </div>
  );
}

export function SkeletonBox({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-[28px] bg-[#EFEFEF] ${className}`} />
}

export function MoodBadge({ state }: { state: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-[#F1FFE8] px-3 py-1.5 font-black text-[#46A302]">
      <ColoredIcon icon={MoodEmoji[state] ?? MoodEmoji.NEUTRAL} />
      {moodLabel(state)}
    </span>
  )
}

export function MoodButton({ state, selected, onSelect }: { state: string, selected: boolean, onSelect: () => void }) {
  return (
    <button className={`grid min-h-20 place-items-center gap-1 rounded-3xl border-2 px-4 font-black transition ${selected ? 'bg-[#F1FFE8] text-[#46A302] shadow-[0_4px_0_#B7ECA2] border-[#58CC02]' : 'border-[#E5E5E5] bg-white text-[#777] hover:bg-[#F7F7F7]'}`} type="button" onClick={onSelect}>
      <ColoredIcon icon={MoodEmoji[state] ?? MoodEmoji.NEUTRAL} size="lg" />
      {moodLabel(state)}
    </button>
  )
}
