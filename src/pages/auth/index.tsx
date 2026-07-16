import { useEffect, useRef, useState, type FormEvent, type InputHTMLAttributes } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { completeGoogleRedirect, getAuthErrorMessage, registerWithEmail, registerWithGoogle, signInWithEmail, signInWithGoogle } from '@/pages/auth/api/auth.service'
import { BrandLink, GoogleIcon } from '@/components/ui'
import { page, primaryBtn } from '@/components/ui/theme'

function AuthInput({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="grid gap-2 font-black">
      {label}
      <input className="min-h-14 rounded-2xl border-2 border-[#E5E5E5] bg-white px-4 font-bold outline-none transition focus:border-[#58CC02] focus:ring-4 focus:ring-[#D7FFBF]" {...props} />
    </label>
  )
}

export default function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const isRegister = mode === 'register';
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    let active = true;
    setIsSubmitting(true);
    void completeGoogleRedirect()
      .then((user) => {
        if (active && user) navigate(mode === 'register' ? '/onboarding' : '/dashboard');
      })
      .catch((error) => {
        if (active) setError(getAuthErrorMessage(error, mode));
      })
      .finally(() => {
        if (active) setIsSubmitting(false);
      });
    return () => { active = false; };
  }, [mode, navigate]);

  const completeAuth = async (action: () => Promise<unknown>) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setError('');
    setIsSubmitting(true);
    try {
      await action();
      navigate(isRegister ? '/onboarding' : '/dashboard');
    } catch (error) {
      setError(getAuthErrorMessage(error, mode));
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const submitEmailAuth = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void completeAuth(() => isRegister ? registerWithEmail(name, email, password) : signInWithEmail(email, password));
  };

  return (
    <div className={page}>
      <main className="grid min-h-screen place-items-center px-5 py-8">
        <div className="grid w-full max-w-md items-center">
          <form className="mx-auto grid w-full gap-5 p-2 sm:p-4" onSubmit={submitEmailAuth}>
            <BrandLink />
            <div>
              <p className="text-sm font-black uppercase tracking-[.18em] text-[#58CC02]">{isRegister ? 'Register' : 'Login'}</p>
              <h2 className="mt-2 text-4xl font-black tracking-[-.05em] sm:text-5xl">{isRegister ? 'Create account' : 'Sign in'}</h2>
            </div>
            <button className="flex min-h-14 items-center justify-center gap-3 rounded-2xl border-2 border-[#E5E5E5] bg-white font-black transition hover:bg-[#F7F7F7] hover:shadow-[0_3px_0_#D9D9D9] active:translate-y-1 active:shadow-none" type="button" onClick={() => void completeAuth(isRegister ? registerWithGoogle : signInWithGoogle)} disabled={isSubmitting}><GoogleIcon /> {isRegister ? 'Register with Google' : 'Login with Google'}</button>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-sm font-black text-[#777] before:h-0.5 before:bg-[#E5E5E5] after:h-0.5 after:bg-[#E5E5E5]"><span>or</span></div>
            {isRegister && <AuthInput label="Full name" type="text" autoComplete="name" placeholder="Your name" value={name} onChange={(event) => setName(event.target.value)} required />}
            <AuthInput label="Email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
            <AuthInput label="Password" type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} placeholder="••••••••" value={password} onChange={(event) => setPassword(event.target.value)} required />
            <button className={primaryBtn} type="submit" disabled={isSubmitting}>{isSubmitting ? 'Loading...' : isRegister ? 'Continue' : 'Login'}</button>
            {error && <p className="font-black text-[#FF4B4B]" role="alert">{error}</p>}
            <p className="text-center font-bold text-[#777]">{isRegister ? 'Already have an account?' : 'New here?'} <Link className="font-black text-[#58CC02]" to={isRegister ? '/login' : '/register'}>{isRegister ? 'Login' : 'Register'}</Link></p>
          </form>
        </div>
      </main>
    </div>
  )
}
