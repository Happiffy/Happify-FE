import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowDown, ArrowRight, List, X } from "@phosphor-icons/react";
import ColoredIcon from "@/components/colored-icon";
import { Emoji } from "@/constants/emoji";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import heroImage from "@/assets/hero-happify.png";
import { BrandLink, UserAvatar } from "@/components/ui";
import { card, page, primaryBtn, shell, tones } from "@/components/ui/theme";
import {
  DashboardAlert,
  LogoutAlert,
} from "@/components/dashboard/DashboardAlerts";
import { useDashboardData } from "@/hooks/dashboard";
import { logout } from "@/pages/auth/api/auth.service";

gsap.registerPlugin(ScrollTrigger);

const pillars = [
  { tag: "Detect", title: "Notice patterns early", icon: Emoji.brain },
  { tag: "Support", title: "Get help in the moment", icon: Emoji.care },
  { tag: "Grow", title: "Build gentle routines", icon: Emoji.sparkle },
];

const features = [
  { title: "Mood Tracker", body: "Quick daily check-ins.", icon: Emoji.mood },
  {
    title: "Journal AI",
    body: "Private reflection summaries.",
    icon: Emoji.journal,
  },
  {
    title: "Grounding",
    body: "Breathing and panic tools.",
    icon: Emoji.grounding,
  },
  { title: "Community", body: "Anonymous safe space.", icon: Emoji.community },
  { title: "Heatmap", body: "Anonymous campus signals.", icon: Emoji.heatmap },
  {
    title: "Referral",
    body: "Professional help routes.",
    icon: Emoji.referral,
  },
];

const safety = [
  {
    title: "Not a diagnosis tool",
    icon: Emoji.medical,
    tone: "bg-[#FFEBEB] shadow-[0_3px_0_#F2B8B8]",
  },
  {
    title: "Human escalation",
    icon: Emoji.escalation,
    tone: "bg-[#EAF8FF] shadow-[0_3px_0_#B9E5FA]",
  },
  {
    title: "Privacy by design",
    icon: Emoji.shield,
    tone: "bg-[#F1FFE8] shadow-[0_3px_0_#B7ECA2]",
  },
];

const companionSteps = [
  {
    title: "Start talking",
    body: "Share what is on your mind, at your own pace.",
  },
  {
    title: "Feel understood",
    body: "Get a thoughtful response that meets you where you are.",
  },
  {
    title: "Find your next step",
    body: "Try a gentle tool or connect with human support when needed.",
  },
];

function HeroVisual() {
  return (
    <div
      className="relative mx-auto grid w-full max-w-[520px] justify-items-center"
      data-hero
    >
      <img
        className="w-full max-w-[480px] object-contain"
        src={heroImage}
        alt="Happify app and quokka mascot illustration"
      />
    </div>
  );
}

function Nav() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showSignOutAlert, setShowSignOutAlert] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const userId = localStorage.getItem("happify.userId") ?? "";
  const { profile } = useDashboardData(userId);

  useEffect(() => {
    if (!menuOpen && !profileOpen) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [menuOpen, profileOpen]);

  const signOut = async () => {
    await logout();
    sessionStorage.setItem("happify.toast", "Signed out.");
    setProfileOpen(false);
    navigate("/");
  };

  return (
    <header ref={navRef} className="fixed inset-x-3 top-3 z-40 sm:inset-x-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between rounded-full border-2 border-[#E5E5E5] bg-white/95 px-4 py-2 shadow-[0_2px_0_#D9D9D9] backdrop-blur">
        <BrandLink compact />
        {userId ? (
          <div className="relative">
            <button
              className="flex items-center gap-3 rounded-full px-2 py-1 font-black transition hover:bg-[#F7F7F7]"
              type="button"
              aria-expanded={profileOpen}
              onClick={() => setProfileOpen((value) => !value)}
            >
              <UserAvatar profile={profile} />
              <span className="hidden sm:block">
                {profile?.displayName ?? "Account"}
              </span>
            </button>
            {profileOpen && (
              <div className="absolute right-0 top-[calc(100%+10px)] w-64 rounded-3xl border-2 border-[#E5E5E5] bg-white p-4 shadow-[0_4px_0_#D9D9D9]">
                <p className="font-black">
                  {profile?.displayName ?? "Happify User"}
                </p>
                <p className="mt-1 truncate text-sm font-bold text-[#999]">
                  {profile?.email ?? ""}
                </p>
                <div className="mt-4 grid gap-2">
                  <Link
                    className="rounded-2xl px-4 py-3 text-left font-black text-[#3C3C3C] transition hover:bg-[#F7F7F7]"
                    to="/dashboard"
                    onClick={() => setProfileOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button
                    className="rounded-2xl bg-[#FF4B4B] px-4 py-3 font-black text-white shadow-[0_4px_0_#D53838] transition active:translate-y-1 active:shadow-none"
                    type="button"
                    onClick={() => setShowSignOutAlert(true)}
                  >
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <nav
              className={`${menuOpen ? "flex" : "hidden"} absolute left-0 right-0 top-[calc(100%+10px)] w-full flex-col gap-3 rounded-3xl border-2 border-[#E5E5E5] bg-white p-4 font-black shadow-[0_4px_0_#D9D9D9] lg:static lg:flex lg:w-auto lg:flex-row lg:items-center lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none`}
              aria-label="Main navigation"
            >
              <Link
                className="rounded-full px-5 py-3 text-left text-[#3C3C3C]"
                to="/dashboard"
                onClick={() => setMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                className="rounded-full bg-[#58CC02] px-5 py-3 text-center text-white shadow-[0_4px_0_#46A302]"
                to="/login"
                onClick={() => setMenuOpen(false)}
              >
                Login
              </Link>
            </nav>
            <button
              className="grid size-11 place-items-center rounded-2xl bg-[#58CC02] text-white lg:hidden"
              type="button"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((value) => !value)}
            >
              {menuOpen ? (
                <X size={22} weight="bold" />
              ) : (
                <List size={22} weight="bold" />
              )}
            </button>
          </>
        )}
      </div>
      {showSignOutAlert && (
        <LogoutAlert
          onCancel={() => setShowSignOutAlert(false)}
          onConfirm={() => {
            setShowSignOutAlert(false);
            void signOut();
          }}
        />
      )}
    </header>
  );
}

export default function LandingPage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    const message = sessionStorage.getItem("happify.toast");
    if (!message) return;
    setToastMessage(message);
    sessionStorage.removeItem("happify.toast");
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const context = gsap.context(() => {
      gsap.from("[data-hero]", {
        y: 18,
        opacity: 0,
        duration: 0.65,
        stagger: 0.08,
        ease: "power3.out",
      });
      gsap.from("[data-reveal]", {
        y: 24,
        opacity: 0,
        duration: 0.55,
        stagger: 0.08,
        ease: "power3.out",
        scrollTrigger: { trigger: "[data-reveal]", start: "top 85%" },
      });
    }, rootRef);
    return () => context.revert();
  }, []);

  return (
    <div ref={rootRef} className={page}>
      <Nav />
      {toastMessage && (
        <DashboardAlert
          message={toastMessage}
          onClose={() => setToastMessage("")}
        />
      )}
      <main>
        <section
          className={`${shell} grid min-h-screen items-center gap-8 pt-28 pb-10 lg:grid-cols-[0.95fr_1.05fr] lg:pt-24`}
        >
          <div className="text-center lg:text-left">
            <h1
              className="mx-auto max-w-[11ch] text-5xl font-black leading-[.98] tracking-[-.05em] text-[#4B4B4B] sm:text-6xl lg:mx-0 lg:text-7xl xl:text-8xl"
              data-hero
            >
              Feel better, one check-in at a time.
            </h1>
            <p
              className="mx-auto mt-5 max-w-xl text-lg font-extrabold leading-8 text-[#777] lg:mx-0"
              data-hero
            >
              Mood, journaling, grounding, community, and referral in one
              friendly support app.
            </p>
            <div
              className="mt-8 flex justify-center lg:justify-start"
              data-hero
            >
              <Link
                className={primaryBtn}
                to={
                  localStorage.getItem("happify.userId")
                    ? "/dashboard"
                    : "/register"
                }
              >
                {localStorage.getItem("happify.userId")
                  ? "Dashboard"
                  : "Get started"}{" "}
                <ArrowRight size={18} weight="bold" />
              </Link>
            </div>
          </div>
          <HeroVisual />
        </section>

        <section
          id="features"
          className={`${shell} py-16 sm:py-24`}
          data-reveal
        >
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-black uppercase tracking-[.18em] text-[#58CC02]">
              Happify app
            </p>
            <h2 className="mt-3 text-4xl font-black tracking-[-.04em] sm:text-5xl">
              Simple tools. Less pressure.
            </h2>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3">
            {features.map(({ title, body, icon }) => (
              <article
                className={`${card} grid min-h-[204px] grid-rows-[56px_56px_1fr] gap-3 p-4 sm:min-h-[220px] sm:p-5`}
                key={title}
              >
                <ColoredIcon icon={icon} size="xl" />
                <h3 className="grid content-end text-2xl font-black leading-tight tracking-[-.03em]">
                  {title}
                </h3>
                <p className="mt-2 font-bold leading-snug text-[#777]">
                  {body}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="framework"
          className={`${shell} py-16 sm:py-24`}
          data-reveal
        >
          <div className="grid items-center gap-8 lg:grid-cols-[.8fr_1.2fr]">
            <div>
              <p className="text-sm font-black uppercase tracking-[.18em] text-[#58CC02]">
                Framework
              </p>
              <h2 className="mt-3 text-4xl font-black tracking-[-.04em] sm:text-5xl">
                Detect. Support. Grow.
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3">
              {pillars.map(({ tag, title, icon }, index) => (
                <article
                  className={`${card} grid min-h-[196px] grid-rows-[64px_26px_1fr] justify-items-center p-5 text-center ${index === 2 ? "col-span-2 mx-auto w-[calc(50%-0.5rem)] lg:col-span-1 lg:w-full" : ""}`}
                  key={tag}
                >
                  <ColoredIcon className="mx-auto" icon={icon} size="xl" />
                  <p className="self-center text-xs font-black uppercase tracking-[.16em] text-[#58CC02]">
                    {tag}
                  </p>
                  <h3 className="grid content-center text-xl font-black leading-tight">
                    {title}
                  </h3>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="safety" className={`${shell} py-16 sm:py-24`} data-reveal>
          <div className={`${card} bg-[#F8FFF4] p-6 sm:p-8 lg:p-10`}>
            <div className="grid gap-8 lg:grid-cols-[minmax(0,.75fr)_minmax(0,1.25fr)] lg:items-center">
              <div className="max-w-md">
                <p className="text-sm font-black uppercase tracking-[.18em] text-[#58CC02]">
                  Companion + Safety
                </p>
                <h2 className="mt-3 text-4xl font-black tracking-[-.04em] sm:text-5xl">
                  Talk. Feel heard. Stay safe.
                </h2>
                <p className="mt-4 max-w-sm font-bold leading-relaxed text-[#777]">
                  A gentle space to share, reflect, and find support when you
                  need it.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-stretch sm:gap-3">
                {companionSteps.map(({ title, body }, index) => (
                  <div className="contents" key={title}>
                    <article className="grid min-h-[116px] grid-cols-[2.75rem_1fr] content-center items-start gap-x-3 rounded-2xl border-2 border-[#E5E5E5] bg-white p-4 shadow-[0_2px_0_#D9D9D9] sm:grid-cols-1 sm:justify-items-center sm:gap-2 sm:rounded-3xl sm:p-4 sm:text-center">
                      <span
                        className={`grid size-11 place-items-center rounded-xl text-sm font-black text-white sm:size-14 sm:rounded-2xl sm:text-base ${index % 2 === 0 ? tones.green : tones.blue}`}
                      >
                        {index + 1}
                      </span>
                      <div>
                        <h3 className="font-black leading-tight">{title}</h3>
                        <p className="mt-1 text-sm font-bold leading-snug text-[#777] sm:text-xs">
                          {body}
                        </p>
                      </div>
                    </article>
                    {index < companionSteps.length - 1 && (
                      <div className="grid place-items-center py-0.5 sm:py-0">
                        <ArrowDown
                          className="text-[#58CC02] sm:hidden"
                          size={20}
                          weight="bold"
                        />
                        <ArrowRight
                          className="hidden text-[#58CC02] sm:block"
                          size={18}
                          weight="bold"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-5 flex max-w-3xl flex-col gap-2.5 sm:flex-row sm:flex-wrap">
              {safety.map(({ title, icon, tone }) => (
                <article
                  className={`flex items-center gap-3 rounded-2xl p-3 pr-5 font-black ${tone}`}
                  key={title}
                >
                  <ColoredIcon icon={icon} size="lg" />
                  <span className="text-sm">{title}</span>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t-2 border-[#E5E5E5] bg-white py-4">
        <div
          className={`${shell} flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between`}
        >
          <BrandLink />
          <p className="max-w-xl font-bold text-[#777]">
            Early support, not a replacement for professional care.
          </p>
        </div>
      </footer>
    </div>
  );
}
