import { type Icon, Smiley, SmileyMeh, SmileyNervous, SmileySad, SmileyWink, SmileyXEyes } from '@phosphor-icons/react'

export const page = 'min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_0%_30%,rgba(88,204,2,.16),transparent_34%),radial-gradient(circle_at_100%_35%,rgba(28,176,246,.16),transparent_34%),linear-gradient(90deg,#F8FFF4_0%,#FFFFFF_45%,#EAF8FF_100%)] text-[#3C3C3C]'
export const shell = 'mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12'
export const btn = 'inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl px-6 font-black transition active:translate-y-1 active:shadow-none'
export const primaryBtn = `${btn} bg-[#58CC02] text-white shadow-[0_5px_0_#46A302] hover:-translate-y-0.5`
export const secondaryBtn = `${btn} bg-[#EAF8FF] text-[#168CC7] shadow-[0_5px_0_#B9E5FA] hover:-translate-y-0.5`
export const card = 'rounded-[28px] border-2 border-[#E5E5E5] bg-white shadow-[0_4px_0_#D9D9D9]'
export const field = 'rounded-3xl border-2 border-[#E5E5E5] bg-white p-4 font-bold outline-none focus:border-[#58CC02] focus:ring-4 focus:ring-[#D7FFBF]'
export const iconBox = 'grid size-14 shrink-0 place-items-center rounded-2xl'

export const tones = {
  green: 'bg-[#58CC02] text-white shadow-[0_4px_0_#46A302]',
  blue: 'bg-[#1CB0F6] text-white shadow-[0_4px_0_#168CC7]',
  gold: 'bg-[#FFC800] text-[#8C6D00] shadow-[0_4px_0_#D8A900]',
  red: 'bg-[#FF4B4B] text-white shadow-[0_4px_0_#D53838]',
  purple: 'bg-[#CE82FF] text-white shadow-[0_4px_0_#A760D2]',
  peach: 'bg-[#FF9600] text-white shadow-[0_4px_0_#D97A00]',
}

export const moodIcons: Record<string, Icon> = {
  HAPPY: Smiley,
  CALM: SmileyWink,
  NEUTRAL: SmileyMeh,
  ANXIOUS: SmileyNervous,
  SAD: SmileySad,
  DISTRESSED: SmileyXEyes,
}

export function moodLabel(state: string) {
  return state.charAt(0) + state.slice(1).toLowerCase()
}
