import type { DashboardAnalytics } from '@/api/dashboard/queries'
import ColoredIcon from '@/components/colored-icon'
import { MoodEmoji } from '@/constants/emoji'

const riskTone: Record<string, string> = {
  LOW: 'bg-[#F1FFE8] text-[#46A302]',
  MEDIUM: 'bg-[#FFF8DF] text-[#D8A900]',
  HIGH: 'bg-[#FFF0DF] text-[#D97A00]',
  CRISIS: 'bg-[#FFEBEB] text-[#D53838]',
}

type Journal = DashboardAnalytics['recentJournals'][number]

export default function JournalJourney({ journals, compact = false }: { journals: Journal[], compact?: boolean }) {
  if (journals.length === 0) return null
  return (
    <div className="relative grid gap-5 py-2">
      <div className="absolute bottom-6 left-6 top-6 w-1 rounded-full bg-[#D7FFBF] sm:left-1/2 sm:-translate-x-1/2" />
      {journals.map((journal, index) => {
        const left = index % 2 === 0
        return (
          <div className="relative grid grid-cols-[48px_1fr] items-center gap-3 sm:grid-cols-[1fr_64px_1fr] sm:gap-4" key={journal.id}>
            <article className={`rounded-[24px] bg-[#F7F7F7] p-4 font-bold ${left ? 'sm:col-start-1 sm:text-right' : 'sm:col-start-3'} ${compact ? '' : 'sm:p-5'}`}>
              <div className={`flex flex-wrap items-center gap-2 ${left ? 'sm:justify-end' : ''}`}>
                <span className="text-sm font-black text-[#999]">{new Date(journal.createdAt).toLocaleString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-black ${riskTone[journal.riskLevel] ?? riskTone.LOW}`}>{journal.riskLevel}</span>
              </div>
              <h3 className="mt-2 text-lg font-black tracking-[-.02em] text-[#3C3C3C]">{journal.title}</h3>
              <div className="rich-content mt-2 whitespace-normal break-words leading-7 text-[#555]" dangerouslySetInnerHTML={{ __html: journal.content }} />
              {journal.imageUrl && <img className={`mt-3 w-full rounded-2xl object-cover ${compact ? 'max-h-28' : 'max-h-64'}`} src={journal.imageUrl} alt="Journal attachment" />}
              {!compact && journal.aiReflection && <div className="mt-3 rounded-2xl bg-[#EAF8FF] p-3 text-left leading-6 text-[#168CC7]"><span className="text-xs font-black uppercase tracking-[.12em]">Happify reflection</span><p className="mt-1">{journal.aiReflection}</p></div>}
            </article>
            <div className="z-10 col-start-1 row-start-1 grid size-12 place-items-center rounded-full border-4 border-white bg-[#F1FFE8] shadow-[0_4px_0_#B7ECA2] sm:col-start-2 sm:size-16">
              <ColoredIcon icon={MoodEmoji[journal.detectedMood ?? 'NEUTRAL'] ?? MoodEmoji.NEUTRAL} size="lg" />
            </div>
          </div>
        )
      })}
    </div>
  )
}
