import { useEffect } from 'react';

const btn = 'inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl px-6 font-black transition active:translate-y-1 active:shadow-none';

export function DashboardAlert({ message, onClose }: { message: string, onClose: () => void }) {
  const normalized = message.toLowerCase();
  const isError = normalized.includes('failed') || normalized.includes('error') || normalized.includes('could not') || normalized.includes('describe ') || normalized.includes('enter ') || normalized.includes('write ') || normalized.includes('add ');
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed right-5 top-5 z-50 max-w-sm rounded-3xl border-2 p-4 font-black ${isError ? 'border-[#FF4B4B] bg-[#FFEBEB] text-[#D53838] shadow-[0_4px_0_#F2B8B8]' : 'border-[#58CC02] bg-[#F1FFE8] text-[#46A302] shadow-[0_4px_0_#B7ECA2]'}`} role={isError ? 'alert' : 'status'}>
      {message}
    </div>
  );
}

export function LogoutAlert({ onCancel, onConfirm }: { onCancel: () => void, onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#3C3C3C]/35 p-5" role="dialog" aria-modal="true" aria-labelledby="logout-title">
      <div className="w-full max-w-sm rounded-[28px] border-2 border-[#E5E5E5] bg-white p-6 shadow-[0_8px_0_#D9D9D9]">
        <h2 id="logout-title" className="text-3xl font-black tracking-[-.04em]">Sign out?</h2>
        <p className="mt-2 font-bold leading-7 text-[#777]">You’ll be signed out of Happify on this device. You can sign back in anytime.</p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button className={`${btn} bg-[#F7F7F7] text-[#777] shadow-[0_5px_0_#D9D9D9]`} type="button" onClick={onCancel}>Cancel</button>
          <button className={`${btn} bg-[#FF4B4B] text-white shadow-[0_5px_0_#D53838]`} type="button" onClick={onConfirm}>Sign out</button>
        </div>
      </div>
    </div>
  );
}

export function CloseChatAlert({ pending, onCancel, onConfirm }: { pending: boolean, onCancel: () => void, onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#3C3C3C]/35 p-5" role="dialog" aria-modal="true" aria-labelledby="close-chat-title" aria-busy={pending}>
      <div className="w-full max-w-sm rounded-[28px] border-2 border-[#E5E5E5] bg-white p-6 shadow-[0_8px_0_#D9D9D9]">
        <h2 id="close-chat-title" className="text-3xl font-black tracking-[-.04em]">Close session?</h2>
        <p className="mt-2 font-bold leading-7 text-[#777]">Both sides can reopen this care chat later if support is needed again.</p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button className={`${btn} bg-[#F7F7F7] text-[#777] shadow-[0_5px_0_#D9D9D9] disabled:cursor-not-allowed disabled:opacity-60`} type="button" onClick={onCancel} disabled={pending}>Cancel</button>
          <button className={`${btn} bg-[#FF4B4B] text-white shadow-[0_5px_0_#D53838] disabled:cursor-wait disabled:opacity-75`} type="button" onClick={onConfirm} disabled={pending}>{pending ? 'Closing...' : 'Close'}</button>
        </div>
      </div>
    </div>
  );
}
