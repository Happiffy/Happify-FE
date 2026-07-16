import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight } from '@phosphor-icons/react'
import { BrandLink } from '@/components/ui'
import { primaryBtn } from '@/components/ui/theme'
import { upsertPreference } from '@/pages/onboarding/api/preference.service'

const onboardingQuestions = [
  {
    title: 'What brings you here?',
    hint: 'Pick what you want Happify to help with first.',
    options: ['Feel calmer day to day', 'Understand my mood patterns', 'Build a journaling habit', 'Find someone safe to talk to'],
  },
  {
    title: 'What usually affects your mood?',
    hint: 'Choose anything that feels familiar.',
    options: ['School pressure', 'Family situation', 'Social media', 'Sleep problems', 'Feeling lonely', 'Friendship or relationship issues'],
  },
  {
    title: 'How should Happify talk to you?',
    hint: 'This shapes the companion tone.',
    options: ['Soft and gentle', 'Clear and practical', 'Encouraging', 'Short and direct'],
  },
  {
    title: 'When things feel heavy, what helps?',
    hint: 'We use this for safer support suggestions.',
    options: ['Breathing or grounding', 'Contact someone I trust', 'Talk to a professional', 'Show urgent help options'],
  },
]

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const question = onboardingQuestions[step];
  const progress = ((step + 1) / onboardingQuestions.length) * 100;

  const toggleAnswer = (title: string, option: string) => {
    setAnswers((current) => {
      const values = current[title] ?? [];
      const nextValues = values.includes(option) ? values.filter((value) => value !== option) : [...values, option];
      return { ...current, [title]: nextValues };
    });
  };

  const savePreferences = async () => {
    const userId = localStorage.getItem('happify.userId');
    if (!userId) { setError('Please login before saving preferences.'); return; }
    setIsSaving(true);
    setError('');
    try {
      await upsertPreference({
        userId,
        primaryGoal: answers['What brings you here?']?.[0] ?? 'Understand my mood patterns',
        triggers: answers['What usually affects your mood?'] ?? [],
        supportTone: answers['How should Happify talk to you?']?.[0] ?? 'Soft and gentle',
        highRiskAction: answers['When things feel heavy, what helps?']?.[0] ?? 'Talk to a professional',
        accessibilityMode: [],
        consentToAi: true,
      });
      navigate('/dashboard');
    } catch { setError('Failed to save preferences. Please try again.'); }
    finally { setIsSaving(false); }
  };

  const next = () => {
    if (step < onboardingQuestions.length - 1) setStep((value) => value + 1);
    else void savePreferences();
  };

  return (
    <div className="h-screen overflow-hidden bg-white text-[#3C3C3C]">
      <header className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-5">
        <BrandLink />
        <Link className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#EAF8FF] px-6 font-black text-[#168CC7] shadow-[0_4px_0_#B9E5FA]" to="/dashboard">Skip</Link>
      </header>
      <main className="mx-auto grid h-[calc(100vh-80px)] w-full max-w-6xl grid-rows-[auto_1fr_auto] px-5 pb-6">
        <div className="flex items-center gap-5">
          <button className="grid size-12 place-items-center rounded-full text-[#999] transition hover:bg-[#F7F7F7]" type="button" onClick={() => step ? setStep((value) => value - 1) : navigate('/dashboard')} aria-label="Back"><ArrowRight className="rotate-180" size={32} weight="bold" /></button>
          <div className="h-4 flex-1 rounded-full bg-[#E5E5E5]"><div className="h-4 rounded-full bg-[#58CC02] transition-all" style={{ width: `${progress}%` }} /></div>
        </div>
        <section className="grid min-h-0 items-center py-6">
          <div className="mx-auto grid w-full max-w-3xl min-h-0 content-center gap-6">
            <div>
              <p className="text-sm font-black uppercase tracking-[.18em] text-[#58CC02]">Personalization</p>
              <h1 className="mt-2 text-4xl font-black tracking-[-.05em] sm:text-5xl">{question.title}</h1>
              <p className="mt-3 text-lg font-extrabold text-[#777]">{question.hint}</p>
            </div>
            <div className="grid gap-3">
              {question.options.map((option) => {
                const selected = answers[question.title]?.includes(option);
                return (
                  <button className={`flex min-h-16 items-center justify-between rounded-3xl border-2 px-5 text-left text-lg font-black transition active:translate-y-1 ${selected ? 'border-[#58CC02] bg-[#F1FFE8] text-[#46A302] shadow-[0_4px_0_#B7ECA2]' : 'border-[#E5E5E5] bg-white text-[#555] hover:bg-[#F7F7F7]'}`} type="button" key={option} onClick={() => toggleAnswer(question.title, option)}>
                    <span>{option}</span>
                    {selected && <span className="grid size-8 place-items-center rounded-full bg-[#58CC02] text-sm text-white">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </section>
        <div>
          <button className={`${primaryBtn} w-full text-lg`} type="button" onClick={next} disabled={isSaving}>{isSaving ? 'Saving...' : step === onboardingQuestions.length - 1 ? 'Finish' : 'Continue'}</button>
          {error && <p className="mt-4 font-black text-[#FF4B4B]" role="alert">{error}</p>}
        </div>
      </main>
    </div>
  )
}
