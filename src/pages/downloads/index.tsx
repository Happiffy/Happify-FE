import { ArrowLeft, DownloadSimple, GithubLogo, ShieldCheck } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import ColoredIcon from '@/components/colored-icon'
import { Emoji } from '@/constants/emoji'
import { card, page, primaryBtn, shell } from '@/components/ui/theme'

const apkUrl = 'https://github.com/Happiffy/Happify-Mobile/releases/download/mobile-v1.3.10/Happify-1.3.10.apk'
const releaseUrl = 'https://github.com/Happiffy/Happify-Mobile/releases/tag/mobile-v1.3.10'

export default function DownloadsPage() {
  return (
    <main className={`${page} grid min-h-screen place-items-center py-8`}>
      <section className={`${shell} max-w-2xl`}>
        <Link className="mb-8 inline-flex items-center gap-2 font-black text-[#777] transition hover:text-[#3C3C3C]" to="/">
          <ArrowLeft size={20} weight="bold" />
          Back to Happify
        </Link>
        <div className={`${card} overflow-hidden`}>
          <div className="bg-[#EAF8FF] p-6 sm:p-8">
            <div className="grid size-16 place-items-center rounded-3xl bg-[#1CB0F6] shadow-[0_4px_0_#168CC7]">
              <ColoredIcon icon={Emoji.mood} size="xl" />
            </div>
            <p className="mt-6 text-sm font-black uppercase tracking-[.14em] text-[#168CC7]">Happify for Android</p>
            <h1 className="mt-2 text-4xl font-black tracking-[-.05em] text-[#3C3C3C] sm:text-5xl">Download Happify</h1>
            <p className="mt-3 max-w-lg text-lg font-bold text-[#666]">Install the latest mobile app to track your wellbeing, talk with your companion, and access support anywhere.</p>
          </div>
          <div className="p-6 sm:p-8">
            <a className={`${primaryBtn} w-full`} href={apkUrl}>
              <DownloadSimple size={24} weight="bold" />
              Download APK · v1.3.10
            </a>
            <div className="mt-6 grid gap-3 text-sm font-bold text-[#666]">
              <p className="flex items-start gap-3"><ShieldCheck className="mt-0.5 shrink-0 text-[#58CC02]" size={20} weight="fill" />Android APK from the official Happify Mobile release.</p>
              <p className="flex items-start gap-3"><ColoredIcon className="mt-0.5" icon={Emoji.sparkle} size="sm" />After download, Android may ask you to allow installs from your browser or file manager.</p>
            </div>
            <a className="mt-7 inline-flex items-center gap-2 font-black text-[#168CC7] underline decoration-2 underline-offset-4" href={releaseUrl} target="_blank" rel="noreferrer">
              <GithubLogo size={20} weight="fill" />
              View release notes and checksum
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}
