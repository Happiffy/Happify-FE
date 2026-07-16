import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  CaretDown,
  X,
} from '@phosphor-icons/react'
import { Area, AreaChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { changePassword, isPasswordProvider, logout as signOutUser } from '@/pages/auth/api/auth.service'
import { applyPsychologist as submitPsychologistApplication, createCommunityComment, createCommunityPost, createJournal, createMood, createReferral as submitReferral, getHeatmap, reviewReferral, sendCareChatMessage, supportCommunityPost, updateCareChatStatus, updateProfile, uploadImage, type HeatmapRegion } from '@/api/dashboard/queries'
import { CloseChatAlert, DashboardAlert, LogoutAlert } from '@/components/dashboard/DashboardAlerts'
import { DuoSelect, EmptyState, MoodBadge, MoodButton, SkeletonBox, UserAvatar } from '@/components/ui'
import { btn, card, field, moodLabel, primaryBtn, tones } from '@/components/ui/theme'
import { useDashboardData } from '@/hooks/dashboard'
import RichTextEditor, { type RichTextEditorHandle } from '@/components/rich-text-editor'
import ColoredIcon from '@/components/colored-icon'
import JournalJourney from '@/components/journal-journey'
import { CommunityHeatmap } from '@/components/community-heatmap'
import { Emoji, MenuEmoji } from '@/constants/emoji'

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function DatePickerPopover({ label, value, onChange, max }: { label: string, value: string, onChange: (value: string) => void, max?: string }) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => new Date(`${value}T00:00:00`));
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstDay = new Date(year, monthIndex, 1).getDay();
  const dayCount = new Date(year, monthIndex + 1, 0).getDate();
  const formatDate = (day: number) => `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const monthLabel = month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  return <div className="relative min-w-0">
    <span className="mb-2 block text-sm font-black text-[#555]">{label}</span>
    <button className="flex min-h-12 w-full items-center justify-between rounded-2xl border-2 border-[#E5E5E5] bg-white px-4 font-bold text-[#3C3C3C] outline-none focus:border-[#58CC02] focus:ring-4 focus:ring-[#D7FFBF]" type="button" onClick={() => setOpen((current) => !current)} aria-expanded={open}>
      {value}<CaretDown size={18} weight="bold" />
    </button>
    {open && <div className="absolute left-0 top-[calc(100%+8px)] z-30 w-72 rounded-3xl border-2 border-[#E5E5E5] bg-white p-4 shadow-[0_6px_0_#D9D9D9]">
      <div className="mb-3 flex items-center justify-between"><button className="grid size-9 place-items-center rounded-xl hover:bg-[#F7F7F7]" type="button" aria-label="Previous month" onClick={() => setMonth(new Date(year, monthIndex - 1, 1))}><ArrowLeft size={17} weight="bold" /></button><span className="font-black">{monthLabel}</span><button className="grid size-9 place-items-center rounded-xl hover:bg-[#F7F7F7]" type="button" aria-label="Next month" onClick={() => setMonth(new Date(year, monthIndex + 1, 1))}><ArrowRight size={17} weight="bold" /></button></div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-black text-[#999]">{['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => <span key={day}>{day}</span>)}</div>
      <div className="mt-2 grid grid-cols-7 gap-1">{Array.from({ length: firstDay }, (_, index) => <span key={`blank-${index}`} />)}{Array.from({ length: dayCount }, (_, index) => { const day = index + 1; const date = formatDate(day); const disabled = Boolean(max && date > max); return <button className={`grid size-8 place-items-center rounded-xl text-sm font-bold ${date === value ? 'bg-[#58CC02] text-white' : disabled ? 'cursor-not-allowed text-[#CCC]' : 'hover:bg-[#F1FFE8]'}`} type="button" disabled={disabled} key={date} onClick={() => { onChange(date); setOpen(false); }}>{day}</button> })}</div>
    </div>}
  </div>
}

function LoadMoreSentinel({ enabled, loading, onVisible }: { enabled: boolean, loading: boolean, onVisible: () => void }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!enabled || loading || !ref.current) return;
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) onVisible(); }, { rootMargin: '160px' });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [enabled, loading, onVisible]);
  return <div ref={ref} className="grid min-h-12 place-items-center font-black text-[#999]">{loading ? 'Loading more...' : ''}</div>;
}

function DashboardPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { section } = useParams();
  const activeView = ['overview', 'records', 'community', 'care', 'chat', 'history', 'profile'].includes(section ?? '') ? section! : 'overview';
  const setActiveView = (view: string) => navigate(view === 'overview' ? '/dashboard' : `/dashboard/${view}`);
  const [moodState, setMoodState] = useState('CALM');
  const [pendingAction, setPendingAction] = useState('');
  const [journalContent, setJournalContent] = useState('');
  const [journalImage, setJournalImage] = useState('');
  const journalEditorRef = useRef<RichTextEditorHandle | null>(null);
  const communityEditorRef = useRef<RichTextEditorHandle | null>(null);
  const [journalSearch, setJournalSearch] = useState('');
  const [journalFilter, setJournalFilter] = useState('ALL');
  const [communityPost, setCommunityPost] = useState('');
  const [communityCommentDrafts, setCommunityCommentDrafts] = useState<Record<string, string>>({});
  const [communityCommentImages, setCommunityCommentImages] = useState<Record<string, string>>({});
  const [communityImage, setCommunityImage] = useState('');
  const [likedPostIds, setLikedPostIds] = useState<string[]>([]);
  const [supportCountOverrides, setSupportCountOverrides] = useState<Record<string, number>>({});
  const [referralComment, setReferralComment] = useState('');
  const [careSearch, setCareSearch] = useState('');
  const [careFilter, setCareFilter] = useState('PENDING');
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, string>>({});
  const [activeChatId, setActiveChatId] = useState('');
  const [chatDraft, setChatDraft] = useState('');
  const [chatSearch, setChatSearch] = useState('');
  const [chatImage, setChatImage] = useState('');
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const [onlineSessions, setOnlineSessions] = useState<Record<string, boolean>>({});
  const [readSessions, setReadSessions] = useState<Record<string, boolean>>({});
  const [certificateUrl, setCertificateUrl] = useState('');
  const [displayNameInput, setDisplayNameInput] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);
  const [showCloseChatAlert, setShowCloseChatAlert] = useState(false);
  const defaultHeatmapEndDate = toDateInputValue(new Date());
  const defaultHeatmapStartDate = toDateInputValue(new Date(Date.now() - 6 * 86400000));
  const [heatmapRegions, setHeatmapRegions] = useState<HeatmapRegion[]>([]);
  const [heatmapError, setHeatmapError] = useState('');
  const [heatmapDraftStartDate, setHeatmapDraftStartDate] = useState(defaultHeatmapStartDate);
  const [heatmapDraftEndDate, setHeatmapDraftEndDate] = useState(defaultHeatmapEndDate);
  const [heatmapStartDate, setHeatmapStartDate] = useState(defaultHeatmapStartDate);
  const [heatmapEndDate, setHeatmapEndDate] = useState(defaultHeatmapEndDate);
  const [seenCare, setSeenCare] = useState(() => localStorage.getItem('happify.seenCare') ?? '');
  const [seenChat, setSeenChat] = useState(() => localStorage.getItem('happify.seenChat') ?? '');
  const userId = localStorage.getItem('happify.userId') ?? '';
  const { profile, analytics, communityPosts, communityCursor, referrals, careChats, journals, isLoading, loadingMore, isLoadingMoreCommunity, hasMoreReferrals, hasMoreChats, hasMoreJournals, setCommunityPosts, setReferrals, setCareChats, loadMoreCommunity, loadMoreReferrals, loadMoreChats, loadMoreJournals, refetch } = useDashboardData(userId);
  const chatSocketRef = useRef<WebSocket | null>(null);
  const isPsychologist = (profile?.role ?? localStorage.getItem('happify.role')) === 'PSYCHOLOGIST';
  const activeCard = 'bg-[#F1FFE8] text-[#46A302] shadow-[0_4px_0_#B7ECA2] border-[#58CC02]';
  const idleCard = 'border-transparent text-[#777] hover:bg-[#F7F7F7] hover:text-[#3C3C3C]';
  const userMenuItems = [
    { id: 'overview', label: 'Overview' },
    { id: 'records', label: 'Records' },
    { id: 'community', label: 'Community' },
    { id: 'chat', label: 'Chat' },
    { id: 'profile', label: 'Profile' },
  ];
  const psychologistMenuItems = [
    { id: 'chat', label: 'Chat' },
    { id: 'profile', label: 'Profile' },
  ];
  const menuItems = isPsychologist ? psychologistMenuItems : userMenuItems;

  const logout = async () => {
    setShowLogoutAlert(false);
    await signOutUser();
    navigate('/login');
  };

  useEffect(() => {
    if (isPsychologist && !['care', 'chat', 'history', 'profile'].includes(activeView)) navigate('/dashboard/profile');
    if (!isPsychologist) setCareFilter('ALL');
  }, [activeView, isPsychologist, navigate]);

  useEffect(() => {
    const peerId = searchParams.get('user') ?? '';
    if (activeView !== 'chat' || !peerId) return;
    const chat = careChats.find((item) => (item.userId === userId ? item.psychologistId : item.userId) === peerId);
    if (chat && chat.id !== activeChatId) setActiveChatId(chat.id);
  }, [activeChatId, activeView, careChats, searchParams, userId]);

  useEffect(() => {
    const wsBaseUrl = (import.meta.env.VITE_API_URL ?? 'http://localhost:4000').replace(/^http/, 'ws');
    const channels = ['community', 'care', `user:${userId}:care`, ...(activeChatId ? [`care-chat:${activeChatId}`] : [])];
    const sockets = channels.map((channel) => {
      const socket = new WebSocket(`${wsBaseUrl}/ws?channel=${encodeURIComponent(channel)}`);
      socket.onmessage = (event) => {
        const payload = JSON.parse(String(event.data));
        if (payload.type === 'community:post') setCommunityPosts((posts) => posts.some((post) => post.id === payload.post.id) ? posts : [payload.post, ...posts]);
        if (payload.type === 'community:comment') setCommunityPosts((posts) => posts.map((post) => post.id === payload.postId && !(post.comments ?? []).some((comment) => comment.id === payload.comment.id) ? { ...post, comments: [...(post.comments ?? []), payload.comment] } : post));
        if (payload.type === 'community:support') setCommunityPosts((posts) => posts.map((post) => post.id === payload.postId ? { ...post, supportCount: payload.supportCount, likedByMe: payload.userId === userId ? true : post.likedByMe } : post));
        if (payload.type === 'presence' && payload.channel?.startsWith('care-chat:')) setOnlineSessions((sessions) => ({ ...sessions, [payload.channel.replace('care-chat:', '')]: payload.count > 1 }));
        if (payload.type === 'care-chat:session') setCareChats((chats) => chats.map((chat) => chat.id === payload.session.id ? { ...chat, status: payload.session.status, closedAt: payload.session.closedAt, updatedAt: payload.session.updatedAt } : chat));
        if (payload.type === 'care-chat:typing' && payload.userId !== userId) setTypingUsers((users) => ({ ...users, [payload.sessionId]: payload.name ?? 'Care partner' }));
        if (payload.type === 'care-chat:stop-typing') setTypingUsers((users) => ({ ...users, [payload.sessionId]: '' }));
        if (payload.type === 'care-chat:read' && payload.userId !== userId) setReadSessions((sessions) => ({ ...sessions, [payload.sessionId]: true }));
        if (payload.type === 'care-chat:message') setCareChats((chats) => chats.map((chat) => chat.id === payload.message.sessionId && !(chat.messages ?? []).some((item) => item.id === payload.message.id) ? { ...chat, messages: [...(chat.messages ?? []), payload.message], updatedAt: payload.message.createdAt } : chat));
        if (payload.type === 'referral:reviewed' && payload.referral?.status === 'ACCEPTED' && payload.referral?.chatSession?.id) {
          setActiveChatId(payload.referral.chatSession.id);
          navigate('/dashboard/chat');
        }
        if (payload.type?.startsWith('referral:')) void refetch();
      };
      if (channel === `care-chat:${activeChatId}`) chatSocketRef.current = socket;
      return socket;
    });
    return () => sockets.forEach((socket) => socket.close());
  }, [activeChatId, navigate, refetch, setCareChats, setCommunityPosts, userId]);

  const filteredCareChats = careChats.filter((chat) => chat.status !== 'CLOSED').filter((chat) => {
    const peer = chat.userId === userId ? chat.psychologist : chat.user;
    return !chatSearch.trim() || (peer?.displayName ?? 'Care partner').toLowerCase().includes(chatSearch.trim().toLowerCase());
  });
  const openCareChats = careChats.filter((chat) => chat.status !== 'CLOSED');
  const activeChat = openCareChats.find((chat) => chat.id === activeChatId);
  const filteredReferrals = referrals.filter((referral) => {
    const keyword = careSearch.trim().toLowerCase();
    const searchable = `${referral.providerName ?? ''} ${referral.user?.displayName ?? ''} ${referral.reason} ${referral.status ?? ''} ${referral.riskLevel}`.toLowerCase();
    const matchesSearch = !keyword || searchable.includes(keyword);
    const matchesFilter = isPsychologist ? (referral.status ?? 'PENDING') === 'PENDING' : (careFilter === 'ALL' || (referral.status ?? 'PENDING') === careFilter);
    return matchesSearch && matchesFilter;
  });
  const closedChats = careChats.filter((chat) => chat.status === 'CLOSED');
  const careSignature = isPsychologist
    ? referrals.filter((referral) => (referral.status ?? 'PENDING') === 'PENDING').map((referral) => referral.id).join(',')
    : referrals.map((referral) => `${referral.id}:${referral.status ?? 'PENDING'}`).join(',');
  const chatSignature = openCareChats.map((chat) => `${chat.id}:${chat.messages?.at(-1)?.id ?? ''}`).join(',');
  const showCareBadge = careSignature !== '' && careSignature !== seenCare;
  const showChatBadge = chatSignature !== '' && chatSignature !== seenChat;

  useEffect(() => {
    if (activeView === 'care' && careSignature !== seenCare) {
      setSeenCare(careSignature);
      localStorage.setItem('happify.seenCare', careSignature);
    }
    if (activeView === 'chat' && chatSignature !== seenChat) {
      setSeenChat(chatSignature);
      localStorage.setItem('happify.seenChat', chatSignature);
    }
  }, [activeView, careSignature, chatSignature, seenCare, seenChat]);

  useEffect(() => {
    if (profile?.displayName && !displayNameInput) setDisplayNameInput(profile.displayName);
  }, [displayNameInput, profile?.displayName]);

  useEffect(() => {
    if (!['overview', 'community'].includes(activeView)) return;
    setHeatmapError('');
    void getHeatmap({ startDate: heatmapStartDate, endDate: heatmapEndDate }).then(setHeatmapRegions).catch(() => setHeatmapError('The anonymous heatmap is unavailable right now.'));
  }, [activeView, heatmapEndDate, heatmapStartDate]);

  useEffect(() => {
    if (!activeChat?.id) return;
    if (chatSocketRef.current?.readyState === WebSocket.OPEN) chatSocketRef.current.send(JSON.stringify({ type: 'care-chat:read', sessionId: activeChat.id, userId }));
    setReadSessions((sessions) => ({ ...sessions, [activeChat.id]: false }));
  }, [activeChat?.id, userId]);

  const saveMood = async () => {
    if (!userId || isSaving) return;
    setIsSaving(true);
    try {
      await createMood({ userId, state: moodState, intensity: 4, triggers: ['School', 'Sleep'], note: 'Web dashboard check-in' });
      await refetch();
      setStatusMessage('Mood saved. Nice check-in.');
    } finally { setIsSaving(false); }
  };

  const saveJournal = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const plainText = journalEditorRef.current?.getText() ?? journalContent.trim();
    const content = journalEditorRef.current?.getHTML() ?? plainText;
    if (!userId || !plainText) return;
    setPendingAction('journal');
    try {
      const title = plainText.split(/[.!?\n]/)[0].slice(0, 60) || 'Journal entry';
      const imageUrl = journalImage ? await uploadImageIfNeeded(journalImage) : '';
      await createJournal({ userId, title, content, ...(imageUrl ? { imageUrl } : {}), detectedMood: moodState });
      await refetch();
      setJournalContent('');
      setJournalImage('');
      journalEditorRef.current?.clear();
      setStatusMessage('Journal saved. Reflection added.');
    } finally { setPendingAction(''); }
  };

  const readImage = (file: File, onLoad: (image: string) => void) => {
    if (file.size > 1_500_000) { setStatusMessage('Image too large. Max 1.5 MB.'); return; }
    const reader = new FileReader();
    reader.onload = () => onLoad(String(reader.result));
    reader.readAsDataURL(file);
  };

  const uploadImageIfNeeded = async (image: string) => {
    if (!image.startsWith('data:image/')) return image;
    const contentType = image.slice(5, image.indexOf(';')) as 'image/jpeg' | 'image/png' | 'image/webp';
    const uploaded = await uploadImage({ imageBase64: image, contentType });
    return uploaded.url;
  };

  const attachJournalImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) readImage(file, setJournalImage);
  };

  const attachCommunityImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) readImage(file, setCommunityImage);
  };

  const attachCommunityCommentImage = (postId: string, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) readImage(file, (image) => setCommunityCommentImages((images) => ({ ...images, [postId]: image })));
  };

  const attachChatImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) readImage(file, setChatImage);
  };

  const shareCommunityPost = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const plainText = communityEditorRef.current?.getText() ?? communityPost.trim();
    const content = communityEditorRef.current?.getHTML() ?? plainText;
    if (!plainText) return;
    setPendingAction('community-post');
    try {
      const imageUrl = communityImage ? await uploadImageIfNeeded(communityImage) : '';
      const post = await createCommunityPost({ userId, alias: 'Anonymous', content, ...(imageUrl ? { imageUrl } : {}), mood: moodState });
      setCommunityPosts((posts) => posts.some((item) => item.id === post.id) ? posts : [{ ...post, likedByMe: false, comments: [] }, ...posts]);
      setCommunityPost('');
      communityEditorRef.current?.clear();
      setCommunityImage('');
      setStatusMessage('Posted anonymously.');
    } finally { setPendingAction(''); }
  };

  const replyCommunityPost = async (postId: string) => {
    const content = communityCommentDrafts[postId]?.trim() ?? '';
    const image = communityCommentImages[postId];
    if (!content && !image) return;
    setPendingAction(`reply-${postId}`);
    try {
      const imageUrl = image ? await uploadImageIfNeeded(image) : '';
      const comment = await createCommunityComment(postId, { userId, content, ...(imageUrl ? { imageUrl } : {}) });
      setCommunityPosts((posts) => posts.map((post) => post.id === postId && !(post.comments ?? []).some((item) => item.id === comment.id) ? { ...post, comments: [...(post.comments ?? []), comment] } : post));
      setCommunityCommentDrafts((drafts) => ({ ...drafts, [postId]: '' }));
      setCommunityCommentImages((images) => ({ ...images, [postId]: '' }));
    } finally { setPendingAction(''); }
  };

  const createReferral = async () => {
    if (!userId) return;
    setPendingAction('referral');
    try {
      const referral = await submitReferral({ userId, riskLevel: 'MEDIUM', reason: 'User requested professional support path from web dashboard.', requestComment: referralComment.trim() || 'No extra comment provided.', providerName: 'Happify Professional Care', providerType: 'Verified psychologist' });
      setReferrals((items) => [referral, ...items]);
      setReferralComment('');
      setStatusMessage('Request sent. A psychologist can approve or reject it.');
    } finally { setPendingAction(''); }
  };

  const handleReferralReview = async (referralId: string, status: 'ACCEPTED' | 'REJECTED') => {
    if (!userId) return;
    setPendingAction(`review-${referralId}`);
    try {
      const referral = await reviewReferral(referralId, { psychologistId: userId, status, reviewerComment: reviewDrafts[referralId]?.trim() || undefined });
      setReferrals((items) => items.map((item) => item.id === referralId ? referral : item));
      await refetch();
      if (status === 'ACCEPTED' && referral.chatSession?.id) {
        setActiveChatId(referral.chatSession.id);
        navigate(`/dashboard/chat?user=${isPsychologist ? referral.user?.id : referral.psychologist?.id}`);
      }
      setStatusMessage(status === 'ACCEPTED' ? 'Referral approved. Chat opened.' : 'Referral rejected with note.');
    } finally { setPendingAction(''); }
  };

  const openChat = (chatId: string) => {
    const chat = careChats.find((item) => item.id === chatId);
    const peerId = chat ? (chat.userId === userId ? chat.psychologistId : chat.userId) : chatId;
    setActiveChatId(chatId);
    setSearchParams({ user: peerId });
  };

  const updateChatDraft = (value: string) => {
    setChatDraft(value);
    if (!activeChat?.id) return;
    if (chatSocketRef.current?.readyState === WebSocket.OPEN) chatSocketRef.current.send(JSON.stringify({ type: value ? 'care-chat:typing' : 'care-chat:stop-typing', sessionId: activeChat.id, userId, name: profile?.displayName ?? 'Care partner' }));
  };

  const requestCloseChat = () => {
    if (!activeChat?.id || pendingAction === 'chat-status') return;
    setShowCloseChatAlert(true);
  };

  const closeChatSession = async () => {
    if (!activeChat?.id || pendingAction === 'chat-status') return;
    const sessionId = activeChat.id;
    setPendingAction('chat-status');
    try {
      const session = await updateCareChatStatus(sessionId, 'CLOSED');
      setCareChats((chats) => chats.map((chat) => chat.id === sessionId ? { ...chat, ...session, status: session.status, closedAt: session.closedAt, updatedAt: session.updatedAt } : chat));
      setActiveChatId('');
      setSearchParams({});
      setShowCloseChatAlert(false);
      setStatusMessage('Care chat moved to history.');
    } catch {
      setStatusMessage('Could not close the care chat. Please try again.');
    } finally {
      setPendingAction('');
    }
  };

  const sendChat = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeChat?.id || activeChat.status === 'CLOSED' || (!chatDraft.trim() && !chatImage)) return;
    const sessionId = activeChat.id;
    const content = chatDraft.trim();
    const image = chatImage;
    const pendingId = `pending-${Date.now()}`;
    setChatDraft('');
    setChatImage('');
    setCareChats((chats) => chats.map((chat) => chat.id === sessionId ? { ...chat, messages: [...(chat.messages ?? []), { id: pendingId, senderId: userId, content, imageUrl: image || null, createdAt: new Date().toISOString() }] } : chat));
    chatSocketRef.current?.send(JSON.stringify({ type: 'care-chat:stop-typing', sessionId, userId }));
    setPendingAction('chat');
    try {
      const imageUrl = image ? await uploadImageIfNeeded(image) : '';
      const message = await sendCareChatMessage(sessionId, { senderId: userId, content, ...(imageUrl ? { imageUrl } : {}) });
      setCareChats((chats) => chats.map((chat) => chat.id === sessionId ? { ...chat, messages: (chat.messages ?? []).map((item) => item.id === pendingId ? message : item), updatedAt: message.createdAt } : chat));
    } catch {
      setCareChats((chats) => chats.map((chat) => chat.id === sessionId ? { ...chat, messages: (chat.messages ?? []).filter((item) => item.id !== pendingId) } : chat));
      setStatusMessage('Message failed to send. Please try again.');
    } finally { setPendingAction(''); }
  };

  const chartData = (analytics?.moodTrend ?? []).map((item) => ({ day: new Date(item.createdAt).toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }), intensity: item.intensity, mood: moodLabel(item.state) }));
  const monitoringStats = [
    { label: 'Mood records', value: analytics?.totals.moods ?? 0, icon: Emoji.greenHeart },
    { label: 'Journal entries', value: analytics?.totals.journals ?? 0, icon: Emoji.journal },
    { label: 'Community posts', value: analytics?.totals.communityPosts ?? 0, icon: Emoji.community },
    { label: 'Referrals', value: analytics?.totals.referrals ?? 0, icon: Emoji.referral },
  ];
  const filteredJournals = journals.filter((journal) => {
    const keyword = journalSearch.trim().toLowerCase();
    const matchesSearch = !keyword || `${journal.title} ${journal.content} ${journal.aiReflection ?? ''}`.toLowerCase().includes(keyword);
    const matchesFilter = journalFilter === 'ALL' || journal.riskLevel === journalFilter;
    return matchesSearch && matchesFilter;
  });
  const riskChartData = (analytics?.riskSummary ?? []).map((item) => ({ name: item.riskLevel, value: item.count }));
  const riskColors: Record<string, string> = { LOW: '#58CC02', MEDIUM: '#FFC800', HIGH: '#FF9600', CRISIS: '#FF4B4B' };
  const heatmapRangeIsValid = heatmapDraftStartDate <= heatmapDraftEndDate && (new Date(`${heatmapDraftEndDate}T00:00:00Z`).getTime() - new Date(`${heatmapDraftStartDate}T00:00:00Z`).getTime()) <= 89 * 86400000;
  const applyHeatmapRange = () => {
    if (!heatmapRangeIsValid) {
      setHeatmapError('Choose a valid date range of up to 90 days.');
      return;
    }
    setHeatmapStartDate(heatmapDraftStartDate);
    setHeatmapEndDate(heatmapDraftEndDate);
  };

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userId || !displayNameInput.trim()) return;
    await updateProfile(userId, { displayName: displayNameInput.trim() });
    if (newPassword) await changePassword(currentPassword, newPassword);
    await refetch();
    setCurrentPassword('');
    setDisplayNameInput('');
    setNewPassword('');
    setStatusMessage('Profile updated.');
  };

  const applyPsychologist = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userId || !certificateUrl.trim() || !licenseNumber.trim()) return;
    const fullName = profile?.displayName ?? 'Happify User';
    await submitPsychologistApplication({ userId, fullName, licenseNumber, certificateUrl, reason: 'I want to support Happify users as a verified psychologist.' });
    await refetch();
    setStatusMessage('Psychologist application submitted for DB review.');
  };

  const moduleContent: Record<string, ReactNode> = {
    overview: (
      <section className="grid gap-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {monitoringStats.map(({ label, value, icon }) => (
            <article className="flex min-h-24 items-center gap-4 rounded-3xl border-2 border-[#E5E5E5] bg-white p-4" key={label}>
              <ColoredIcon icon={icon} size="xl" />
              <div><strong className="text-3xl font-black">{value}</strong><p className="text-sm font-bold text-[#999]">{label}</p></div>
            </article>
          ))}
        </div>
        <section className="grid gap-4 xl:grid-cols-[1.2fr_.8fr]">
          <article className={`${card} p-5 sm:p-6`}>
            <div className="mb-4 flex items-start justify-between gap-4">
              <div><h2 className="text-2xl font-black tracking-[-.04em]">Mood intensity trend</h2><p className="font-bold text-[#999]">From your saved mood records.</p></div>
              {analytics?.latestMood && <MoodBadge state={analytics.latestMood.state} />}
            </div>
            {chartData.length === 0 ? (
              <div className="grid min-h-52 place-items-center rounded-2xl bg-[#F7F7F7] p-6 text-center font-bold text-[#999]">No mood data yet.<br />Save your first mood in Records.</div>
            ) : (
              <div className="[&_*]:outline-none"><ResponsiveContainer width="100%" height={240}>
                <AreaChart data={chartData} margin={{ top: 12, right: 6, bottom: 0, left: 6 }}>
                  <defs><linearGradient id="overviewMoodFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#58CC02" stopOpacity={0.38} /><stop offset="100%" stopColor="#58CC02" stopOpacity={0} /></linearGradient></defs>
                  <Tooltip cursor={false} formatter={(value, _name, item) => [`Intensity ${value}/5`, item.payload.mood]} labelFormatter={(_label, payload) => payload?.[0]?.payload?.day ? `Recorded ${payload[0].payload.day}` : 'Mood record'} contentStyle={{ borderRadius: 16, border: '2px solid #E5E5E5', boxShadow: 'none' }} />
                  <Area type="monotone" dataKey="intensity" stroke="#58CC02" strokeWidth={4} fill="url(#overviewMoodFill)" activeDot={{ r: 5, stroke: '#58CC02', strokeWidth: 2, fill: '#FFFFFF' }} />
                </AreaChart>
              </ResponsiveContainer></div>
            )}
          </article>
          <article className={`${card} min-h-[374px] p-5 sm:p-6`}>
            <p className="text-sm font-black uppercase tracking-[.16em] text-[#FF9600]">Journal risk summary</p>
            <div className="mt-5 grid gap-4">
              {riskChartData.length === 0 && <div className="grid min-h-52 place-items-center rounded-2xl bg-[#F7F7F7] p-6 text-center font-bold text-[#999]">No journal analyzed yet.</div>}
              {riskChartData.length > 0 && <div className="h-64 [&_*]:outline-none"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={riskChartData} dataKey="value" nameKey="name" innerRadius={64} outerRadius={104} paddingAngle={4}>{riskChartData.map((item) => <Cell key={item.name} fill={riskColors[item.name] ?? '#1CB0F6'} stroke="transparent" />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>}
            </div>
          </article>
        </section>
        <article className={`${card} p-5 sm:p-6`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black tracking-[-.04em]">Anonymous community heatmap</h2>
              <p className="mt-1 font-bold text-[#999]">Coarse regional blocks from at least three anonymous contributions; no individual locations are shown.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 rounded-3xl bg-[#F7F7F7] p-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
            <DatePickerPopover label="Start date" value={heatmapDraftStartDate} max={heatmapDraftEndDate} onChange={setHeatmapDraftStartDate} />
            <DatePickerPopover label="End date" value={heatmapDraftEndDate} max={defaultHeatmapEndDate} onChange={setHeatmapDraftEndDate} />
            <button className={`${primaryBtn} min-h-12`} type="button" onClick={applyHeatmapRange}>Apply</button>
          </div>
          <p className="mt-3 text-sm font-bold text-[#999]" aria-live="polite">{heatmapDraftStartDate !== heatmapStartDate || heatmapDraftEndDate !== heatmapEndDate ? 'Date range changed. Press Apply to update the heatmap.' : `Showing ${heatmapStartDate} to ${heatmapEndDate}.`}</p>
          <div className="mt-5">
            {heatmapError && <div className="grid min-h-80 place-items-center rounded-3xl bg-[#F7F7F7] p-6 text-center font-bold text-[#999]">{heatmapError}</div>}
            {!heatmapError && <CommunityHeatmap items={heatmapRegions} />}
          </div>
        </article>
        <section className="grid gap-4 xl:grid-cols-2">
          <article className={`${card} p-5 sm:p-6`}>
            <h2 className="text-2xl font-black tracking-[-.04em]">Recent journals</h2>
            <div className="mt-4 grid gap-3">
              {(analytics?.recentJournals ?? []).length === 0 && <EmptyState icon="fluent-emoji-flat:notebook" tone={tones.blue} title="No journals yet" body="Write your first reflection in Records. Your recent entries will show here." />}
              <JournalJourney journals={(analytics?.recentJournals ?? []).slice(0, 3)} compact />
            </div>
          </article>
          <article className={`${card} p-5 sm:p-6`}>
            <h2 className="text-2xl font-black tracking-[-.04em]">Referral activity</h2>
            <div className="mt-4 grid gap-3">
              {referrals.length === 0 && <EmptyState icon="fluent-emoji-flat:speech-balloon" tone={tones.red} title="No care activity yet" body="When you request professional support, updates will appear here." />}
              {referrals.slice(0, 3).map((referral) => (
                <div className="overflow-hidden rounded-[24px] border-2 border-[#E5E5E5] bg-white font-bold shadow-[0_3px_0_#D9D9D9]" key={referral.id}>
                  <div className="flex items-start justify-between gap-3 bg-[#F7F7F7] p-4"><div className="flex min-w-0 gap-3"><ColoredIcon icon={Emoji.referral} size="lg" /><div className="min-w-0"><p className="truncate font-black text-[#3C3C3C]">{referral.providerName ?? 'Care provider'}</p><p className="text-sm text-[#999]">{new Date(referral.createdAt).toLocaleString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p></div></div><span className={`rounded-full px-3 py-1 text-xs font-black ${referral.riskLevel === 'CRISIS' || referral.riskLevel === 'HIGH' ? 'bg-[#FFEBEB] text-[#D53838]' : 'bg-[#FFF8DF] text-[#D8A900]'}`}>{referral.riskLevel}</span></div>
                  <p className="p-4 leading-7 text-[#555]">{referral.reason}</p>
                </div>
              ))}
            </div>
          </article>
        </section>
      </section>
    ),
    records: (
      <section className="grid items-start gap-5 xl:grid-cols-[.72fr_1.28fr]" aria-labelledby="records-title">
        <div className="grid gap-4">
        <article className={`${card} self-start p-5 sm:p-6`}>
          <h2 id="records-title" className="text-3xl font-black tracking-[-.04em]">Mood record</h2>
          <p className="mt-1 font-bold text-[#777]">Web input for monitoring history.</p>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {['HAPPY', 'CALM', 'NEUTRAL', 'ANXIOUS', 'SAD', 'DISTRESSED'].map((item) => (
              <MoodButton key={item} state={item} selected={moodState === item} onSelect={() => setMoodState(item)} />
            ))}
          </div>
          <button className={`${primaryBtn} mt-5`} type="button" disabled={isSaving} onClick={saveMood}>{isSaving ? 'Saving...' : 'Save mood'}</button>
        </article>
        <form className={`${card} grid gap-4 p-5 sm:p-6`} onSubmit={saveJournal}>
          <div><h2 className="text-3xl font-black tracking-[-.04em]">Journal entry</h2><p className="mt-1 font-bold leading-7 text-[#777]">Write what happened, what you felt, and anything you want to remember. Example: “I’m really tired today because school was overwhelming.”</p></div>
          <label className="grid gap-2 font-black" htmlFor="journal-content">What happened today?</label>
          <RichTextEditor ref={journalEditorRef} placeholder="I feel really tired today because..." minHeight="min-h-44" onChange={(_, text) => setJournalContent(text)} />
          {journalImage && <div className="relative w-fit"><img className="max-h-44 rounded-2xl border-2 border-[#E5E5E5] object-cover" src={journalImage} alt="Journal attachment preview" /><button className="absolute -right-2 -top-2 grid size-8 place-items-center rounded-full bg-[#FF4B4B] text-white shadow-[0_2px_0_#D53838]" type="button" aria-label="Remove journal image" onClick={() => setJournalImage('')}><X size={16} weight="bold" /></button></div>}
          <div className="flex flex-wrap items-center gap-3"><label className="inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-2xl bg-[#F7F7F7] px-4 font-black text-[#777] shadow-[0_3px_0_#D9D9D9] transition hover:bg-[#EFEFEF]" htmlFor="journal-image"><ColoredIcon icon={Emoji.picture} />Add photo<input id="journal-image" className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" onChange={attachJournalImage} /></label>
          <button className={`${primaryBtn} justify-self-start`} type="submit" disabled={pendingAction === 'journal'}>{pendingAction === 'journal' ? 'Saving...' : 'Save entry'}</button></div>
        </form>
        </div>
        <article className={`${card} self-start p-5 sm:p-6`}>
          <h2 className="shrink-0 text-3xl font-black tracking-[-.04em]">Recent journals</h2>
          <div className="mt-4 grid shrink-0 gap-3 lg:grid-cols-[1fr_220px]"><input className="min-h-12 rounded-2xl border-2 border-[#E5E5E5] px-4 font-bold outline-none focus:border-[#58CC02] focus:ring-4 focus:ring-[#D7FFBF]" value={journalSearch} onChange={(event) => setJournalSearch(event.target.value)} placeholder="Search journals..." aria-label="Search journals" /><DuoSelect label="Filter journal risk" value={journalFilter} onChange={setJournalFilter} options={[{ value: 'ALL', label: 'All risks' }, { value: 'LOW', label: 'Low risk' }, { value: 'MEDIUM', label: 'Medium risk' }, { value: 'HIGH', label: 'High risk' }, { value: 'CRISIS', label: 'Crisis' }]} /></div>
          <div className="mt-4 grid gap-3">
            {journals.length === 0 && <EmptyState icon="fluent-emoji-flat:notebook" tone={tones.blue} title="No journals yet" body="Write your first reflection and your history will appear here." />}
            {journals.length > 0 && filteredJournals.length === 0 && <EmptyState icon={Emoji.journal} tone={tones.blue} title="No matching journals" body="Try another keyword or change the risk filter to see more entries." />}
            <JournalJourney journals={filteredJournals} />
            <LoadMoreSentinel enabled={hasMoreJournals} loading={loadingMore === 'journals'} onVisible={() => void loadMoreJournals()} />
          </div>
        </article>
      </section>
    ),
    profile: (
      <section className="grid gap-8" aria-labelledby="profile-title">
        <article className="grid gap-6 border-b-2 border-[#E5E5E5] pb-8 md:grid-cols-[auto_1fr] md:items-center">
          {profile?.avatarUrl ? <img className="size-32 rounded-full border-2 border-[#E5E5E5] object-cover shadow-[0_5px_0_#D9D9D9]" src={profile.avatarUrl} alt="Profile" referrerPolicy="no-referrer" /> : <div className="grid size-32 place-items-center rounded-full bg-[#1CB0F6] text-6xl font-black text-white shadow-[0_5px_0_#168CC7]">{(profile?.displayName ?? 'H').charAt(0).toUpperCase()}</div>}
          <div>
            <h2 id="profile-title" className="text-4xl font-black tracking-[-.05em]">{profile?.displayName ?? 'Happify User'}</h2>
            <p className="mt-2 font-bold text-[#999]">{profile?.email ?? 'No email'}</p>
            <p className="mt-1 font-bold text-[#999]">Joined {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#EAF8FF] px-4 py-2 font-black text-[#168CC7]"><ColoredIcon icon={profile?.role === 'PSYCHOLOGIST' ? Emoji.psychologist : Emoji.profile} />{profile?.role === 'PSYCHOLOGIST' ? 'Psychologist' : 'User'}</span>
              {profile?.psychologistApplication && <span className="rounded-full bg-[#FFF8DF] px-4 py-2 font-black text-[#D8A900]">Application: {profile.psychologistApplication.status}</span>}
            </div>
          </div>
        </article>
        <div className="grid gap-4 sm:grid-cols-2">
          <button className="group relative flex cursor-pointer items-center gap-4 rounded-[28px] border-2 border-[#58CC02] bg-[#F1FFE8] p-5 text-left shadow-[0_5px_0_#B7ECA2] transition hover:-translate-y-1 active:translate-y-1 active:shadow-none" type="button" onClick={() => setActiveView('care')}>
            <ColoredIcon icon={Emoji.care} size="xl" />
            <span className="min-w-0 flex-1"><span className="block text-xl font-black tracking-[-.03em] text-[#3C3C3C]">{isPsychologist ? 'Care requests' : 'Professional care'}</span><span className="mt-1 block font-bold text-[#777]">{isPsychologist ? 'Review pending requests.' : 'Request support and track status.'}</span></span>
            <span className="inline-flex items-center gap-2 rounded-2xl bg-[#58CC02] px-4 py-2 font-black text-white shadow-[0_3px_0_#46A302]">Open <ArrowRight size={18} weight="bold" /></span>
            {showCareBadge && <span className="absolute size-3 rounded-full bg-[#FF4B4B] ring-2 ring-white" />}
          </button>
          <button className="group flex cursor-pointer items-center gap-4 rounded-[28px] border-2 border-[#CE82FF] bg-[#FAF0FF] p-5 text-left shadow-[0_5px_0_#DDB2F7] transition hover:-translate-y-1 active:translate-y-1 active:shadow-none" type="button" onClick={() => setActiveView('history')}>
            <ColoredIcon icon={Emoji.history} size="xl" />
            <span className="min-w-0 flex-1"><span className="block text-xl font-black tracking-[-.03em] text-[#3C3C3C]">Chat history</span><span className="mt-1 block font-bold text-[#777]">Review summaries from finished sessions.</span></span>
            <span className="inline-flex items-center gap-2 rounded-2xl bg-[#CE82FF] px-4 py-2 font-black text-white shadow-[0_3px_0_#A760D2]">Open <ArrowRight size={18} weight="bold" /></span>
          </button>
        </div>
        <form className={`${card} grid gap-4 p-5 sm:p-6`} onSubmit={saveProfile}>
          <h3 className="text-2xl font-black tracking-[-.04em]">Edit profile</h3>
          <label className="grid gap-2 font-black" htmlFor="display-name">Display name</label>
          <input id="display-name" className="min-h-14 rounded-2xl border-2 border-[#E5E5E5] px-4 font-bold outline-none focus:border-[#58CC02] focus:ring-4 focus:ring-[#D7FFBF]" value={displayNameInput} onChange={(event) => setDisplayNameInput(event.target.value)} required />
          <div className="mt-2 border-t-2 border-[#E5E5E5] pt-4">
            <h4 className="text-xl font-black tracking-[-.03em]">Password</h4>
            <p className="mt-1 font-bold leading-7 text-[#777]">{isPasswordProvider() ? 'Fill this only when you want to change your password.' : 'You signed in with Google. Add a password only if you also want email login.'}</p>
          </div>
          {isPasswordProvider() && <><label className="grid gap-2 font-black" htmlFor="current-password">Current password</label><input id="current-password" className="min-h-14 rounded-2xl border-2 border-[#E5E5E5] px-4 font-bold outline-none focus:border-[#58CC02] focus:ring-4 focus:ring-[#D7FFBF]" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" /></>}
          <label className="grid gap-2 font-black" htmlFor="new-password">New password</label>
          <input id="new-password" className="min-h-14 rounded-2xl border-2 border-[#E5E5E5] px-4 font-bold outline-none focus:border-[#58CC02] focus:ring-4 focus:ring-[#D7FFBF]" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" minLength={6} />
          <button className={`${primaryBtn} justify-self-start`} type="submit">Save changes</button>
        </form>
        {!isPsychologist && <form className={`${card} grid gap-4 p-5 sm:p-6`} onSubmit={applyPsychologist}>
          <h3 className="text-2xl font-black tracking-[-.04em]">Apply as psychologist</h3>
          <p className="font-bold leading-7 text-[#777]">Send your license and certificate link. The Happify team will review your application.</p>
          <label className="grid gap-2 font-black" htmlFor="license-number">License / certificate number</label>
          <input id="license-number" className="min-h-14 rounded-2xl border-2 border-[#E5E5E5] px-4 font-bold outline-none focus:border-[#58CC02] focus:ring-4 focus:ring-[#D7FFBF]" value={licenseNumber} onChange={(event) => setLicenseNumber(event.target.value)} required />
          <label className="grid gap-2 font-black" htmlFor="certificate-url">Certificate proof URL</label>
          <input id="certificate-url" className="min-h-14 rounded-2xl border-2 border-[#E5E5E5] px-4 font-bold outline-none focus:border-[#58CC02] focus:ring-4 focus:ring-[#D7FFBF]" value={certificateUrl} onChange={(event) => setCertificateUrl(event.target.value)} placeholder="Drive/portfolio certificate link" required />
          <button className={`${primaryBtn} justify-self-start`} type="submit">Submit application</button>
        </form>}
        {isPsychologist && <article className={`${card} bg-[#F1FFE8] p-6`}>
          <h3 className="text-2xl font-black tracking-[-.04em] text-[#46A302]">Verified psychologist</h3>
          <p className="mt-2 font-bold leading-7 text-[#777]">You can review care requests and open approved chats.</p>
        </article>}
        <button className={`${btn} w-full bg-[#FF4B4B] text-white shadow-[0_5px_0_#D53838] lg:hidden`} type="button" onClick={() => setShowLogoutAlert(true)}>Sign out</button>

      </section>
    ),
    community: (
      <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <section className="grid min-w-0 gap-5" aria-labelledby="community-title">
        <form className={`${card} sticky top-5 z-20 grid min-w-0 gap-3 p-3 sm:p-5`} onSubmit={shareCommunityPost}>
          <h2 id="community-title" className="sr-only">Anonymous community</h2>
          <RichTextEditor ref={communityEditorRef} placeholder="Share anonymously... you are safe here." onChange={(_, text) => setCommunityPost(text)} />
          {communityImage && (
            <div className="relative justify-self-start">
              <img className="max-h-44 rounded-2xl border-2 border-[#E5E5E5] object-cover" src={communityImage} alt="Attachment preview" />
              <button className="absolute -right-2 -top-2 grid size-8 place-items-center rounded-full bg-[#FF4B4B] text-white shadow-[0_2px_0_#D53838]" type="button" aria-label="Remove image" onClick={() => setCommunityImage('')}><X size={16} weight="bold" /></button>
            </div>
          )}
          <div className="flex items-center justify-between gap-3">
            <label className="inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-2xl bg-[#F7F7F7] px-4 font-black text-[#777] transition hover:bg-[#EFEFEF]" htmlFor="community-image">
              <ColoredIcon icon={Emoji.picture} /> Photo
              <input id="community-image" className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" onChange={attachCommunityImage} />
            </label>
            <button className={primaryBtn} type="submit" disabled={pendingAction === 'community-post'}>{pendingAction === 'community-post' ? 'Posting...' : 'Post'}</button>
          </div>
        </form>
        <div className="grid gap-3">
          {communityPosts.length === 0 && <EmptyState icon="fluent-emoji-flat:people-hugging" tone={tones.purple} title="Community is quiet" body="Anonymous support posts will appear here once people start sharing." />}
          {communityPosts.map((post) => (
            <article className={`${card} min-w-0 overflow-hidden p-3 sm:p-5`} key={post.id}>
              <div className="flex items-center gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#CE82FF] font-black text-white">{post.alias.charAt(0).toUpperCase()}</span>
                <div className="min-w-0">
                  <p className="font-black">{post.alias}</p>
                  <p className="text-sm font-bold text-[#999]">{new Date(post.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}, {new Date(post.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}{post.mood ? ` · ${moodLabel(post.mood)}` : ''}</p>
                </div>
              </div>
              <div className="rich-content mt-3 min-w-0 break-words font-bold leading-7 text-[#555] [&_*]:max-w-full" dangerouslySetInnerHTML={{ __html: post.content }} />
              {post.imageUrl && <button className="mt-3 block w-full" type="button" onClick={() => setImagePreview(post.imageUrl ?? '')}><img className="max-h-80 w-full rounded-2xl border-2 border-[#E5E5E5] object-cover" src={post.imageUrl} alt="Post attachment" /></button>}
              <button className={`mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 font-black transition hover:-translate-y-0.5 ${likedPostIds.includes(post.id) || post.likedByMe ? 'bg-[#F3DFFF] text-[#A760D2]' : 'bg-[#F7F7F7] text-[#CE82FF]'}`} type="button" disabled={likedPostIds.includes(post.id) || post.likedByMe} aria-label={likedPostIds.includes(post.id) || post.likedByMe ? 'Already supported' : 'Support this post'} onClick={async () => { if (!userId || likedPostIds.includes(post.id) || post.likedByMe) return; setLikedPostIds((ids) => [...ids, post.id]); setSupportCountOverrides((counts) => ({ ...counts, [post.id]: (counts[post.id] ?? post.supportCount) + 1 })); await supportCommunityPost(post.id, userId); }}><ColoredIcon icon={likedPostIds.includes(post.id) || post.likedByMe ? Emoji.purpleHeart : Emoji.whiteHeart} size="sm" /> {supportCountOverrides[post.id] ?? post.supportCount}</button>
              <div className="mt-4 grid gap-2 border-t-2 border-[#EFEFEF] pt-3">
                {(post.comments ?? []).map((comment) => <div className="flex gap-3 border-t border-[#EFEFEF] px-1 py-4 first:border-t-0" key={comment.id}><span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#CE82FF] text-sm font-black text-white">{comment.alias.charAt(0).toUpperCase()}</span><div className="min-w-0 flex-1"><div><span className="block font-black text-[#3C3C3C]">{comment.alias}</span><span className="block text-xs font-black text-[#AAA]">{new Date(comment.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}, {new Date(comment.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span></div>{comment.content && <p className="mt-1 font-bold leading-6 text-[#3C3C3C]">{comment.content}</p>}{comment.imageUrl && <button className="mt-3 block" type="button" onClick={() => setImagePreview(comment.imageUrl ?? '')}><img className="max-h-44 rounded-2xl border-2 border-[#E5E5E5] object-cover" src={comment.imageUrl} alt="Reply attachment" /></button>}</div></div>)}
                {communityCommentImages[post.id] && <div className="relative justify-self-start"><img className="max-h-36 rounded-2xl border-2 border-[#E5E5E5] object-cover" src={communityCommentImages[post.id]} alt="Reply attachment preview" /><button className="absolute -right-2 -top-2 grid size-7 place-items-center rounded-full bg-[#FF4B4B] text-white shadow-[0_2px_0_#D53838]" type="button" aria-label="Remove reply image" onClick={() => setCommunityCommentImages((images) => ({ ...images, [post.id]: '' }))}><X size={14} weight="bold" /></button></div>}
                <form className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]" onSubmit={(event) => { event.preventDefault(); void replyCommunityPost(post.id); }}>
                  <input className="min-h-11 min-w-0 rounded-2xl border-2 border-[#E5E5E5] px-3 font-bold outline-none focus:border-[#CE82FF] sm:px-4" value={communityCommentDrafts[post.id] ?? ''} onChange={(event) => setCommunityCommentDrafts((drafts) => ({ ...drafts, [post.id]: event.target.value }))} placeholder="Write a kind reply..." aria-label="Reply" />
                  <label className="grid min-h-11 cursor-pointer place-items-center rounded-2xl bg-[#F7F7F7] px-3 text-[#CE82FF] transition hover:bg-[#F3DFFF]" htmlFor={`reply-image-${post.id}`}><ColoredIcon icon={Emoji.picture} /><input id={`reply-image-${post.id}`} className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => attachCommunityCommentImage(post.id, event)} /></label>
                  <button className="col-span-2 min-h-11 rounded-2xl bg-[#CE82FF] px-4 font-black text-white shadow-[0_3px_0_#A760D2] sm:col-span-1" type="submit" disabled={pendingAction === `reply-${post.id}`}>{pendingAction === `reply-${post.id}` ? 'Sending...' : 'Reply'}</button>
                </form>
              </div>
            </article>
          ))}
          <LoadMoreSentinel enabled={Boolean(communityCursor)} loading={isLoadingMoreCommunity} onVisible={() => void loadMoreCommunity()} />
        </div>
      </section>
        <aside className="sticky top-6 hidden content-start gap-4 xl:grid">
          <article className={`${card} p-5`}>
           <p className="text-sm font-black uppercase tracking-[.16em] text-[#CE82FF]">Community pulse</p>
          <div className="mt-4 grid gap-3 font-bold text-[#777]">
            <div className="flex items-center gap-3 rounded-2xl bg-[#F7F7F7] p-3"><ColoredIcon icon={Emoji.community} /><span className="flex-1">Posts</span><span className="font-black">{communityPosts.length}</span></div>
            <div className="flex items-center gap-3 rounded-2xl bg-[#F7F7F7] p-3"><ColoredIcon icon={Emoji.purpleHeart} /><span className="flex-1">Support given</span><span className="font-black">{communityPosts.reduce((sum, post) => sum + post.supportCount, 0)}</span></div>
          </div>
        </article>
        <article className={`${card} bg-[#F1FFE8] p-5`}>
          <p className="text-sm font-black uppercase tracking-[.16em] text-[#46A302]">Safe space rules</p>
          <div className="mt-4 grid gap-2 font-bold leading-6 text-[#777]">
            <span>Be kind, no judgement.</span>
            <span>Everyone stays anonymous.</span>
            <span>Crisis? Use the Care section.</span>
          </div>
        </article>
      </aside>
      </div>
    ),
    chat: (
      <section className="grid h-full overflow-hidden bg-white xl:grid-cols-[360px_1fr]" aria-labelledby="chat-title">
        <aside className={`${activeChatId ? 'hidden xl:grid' : 'grid'} content-start border-b-2 border-[#EFEFEF] p-5 xl:border-r-2 xl:border-b-0`}>
          <h2 id="chat-title" className="px-2 text-3xl font-black tracking-[-.04em]">Messages</h2>
          <p className="px-2 pb-4 pt-1 font-bold text-[#999]">Approved care sessions.</p>
          <input className="mb-4 min-h-12 rounded-2xl border-2 border-[#E5E5E5] px-4 font-bold outline-none focus:border-[#58CC02] focus:ring-4 focus:ring-[#D7FFBF]" value={chatSearch} onChange={(event) => setChatSearch(event.target.value)} placeholder="Search contact..." aria-label="Search chat contacts" />
          <div className="grid max-h-[calc(100vh-310px)] gap-1 overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {openCareChats.length === 0 && <EmptyState icon="fluent-emoji-flat:speech-balloon" tone={tones.blue} title="No chats yet" body="Once a psychologist approves your request, the chat opens here." />}
            {openCareChats.length > 0 && filteredCareChats.length === 0 && <div className="p-5 text-center font-bold text-[#999]">No contact found.</div>}
            {filteredCareChats.map((chat) => {
              const peer = chat.userId === userId ? chat.psychologist : chat.user;
              const lastMessage = chat.messages?.at(-1);
              const selected = activeChat?.id === chat.id;
              return <button className={`flex items-center gap-3 rounded-3xl p-3 text-left transition ${selected ? 'bg-[#EAF8FF]' : 'hover:bg-[#F7F7F7]'}`} type="button" key={chat.id} onClick={() => openChat(chat.id)}><span className={`grid size-12 shrink-0 place-items-center rounded-full font-black text-white ${selected ? 'bg-[#1CB0F6]' : 'bg-[#CE82FF]'}`}>{(peer?.displayName ?? 'C').charAt(0).toUpperCase()}</span><span className="min-w-0 flex-1"><span className="block truncate font-black text-[#3C3C3C]">{peer?.displayName ?? 'Care partner'}</span><span className="block truncate text-sm font-bold text-[#999]">{typingUsers[chat.id] ? `${typingUsers[chat.id]} is typing...` : lastMessage?.content || (lastMessage?.imageUrl ? 'Sent an image' : chat.referral?.reason || 'Chat opened')}</span></span><span className="text-xs font-black text-[#AAA]">{new Date(chat.updatedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</span></button>
             })}
             <LoadMoreSentinel enabled={hasMoreChats} loading={loadingMore === 'chats'} onVisible={() => void loadMoreChats()} />
           </div>
         </aside>
        <article className={`${activeChatId || careChats.length === 0 ? 'grid' : 'hidden xl:grid'} min-h-0 ${activeChat ? 'grid-rows-[auto_1fr_auto]' : 'grid-rows-[1fr]'} overflow-hidden bg-white`}>
          {!activeChat && <div className="grid h-full place-items-center text-center"><div><h2 className="text-2xl font-black tracking-[-.04em]">Choose a conversation</h2><p className="mt-2 font-bold text-[#999]">Pick a chat from the list to start messaging.</p></div></div>}
          {activeChat && <><header className="flex items-center gap-3 border-b-2 border-[#EFEFEF] p-4 sm:p-5"><button className="grid size-10 place-items-center rounded-full bg-[#F7F7F7] text-[#777] xl:hidden" type="button" aria-label="Back to chats" onClick={() => { setActiveChatId(''); setSearchParams({}); }}><ArrowRight className="rotate-180" size={22} weight="bold" /></button><span className="grid size-12 place-items-center rounded-full bg-[#1CB0F6] font-black text-white">{((activeChat.userId === userId ? activeChat.psychologist?.displayName : activeChat.user?.displayName) ?? 'C').charAt(0).toUpperCase()}</span><div><h3 className="text-2xl font-black tracking-[-.04em]">{activeChat.userId === userId ? (activeChat.psychologist?.displayName ?? 'Psychologist') : (activeChat.user?.displayName ?? 'User')}</h3><p className="flex items-center gap-2 font-bold text-[#999]"><span className={`size-2.5 rounded-full ${onlineSessions[activeChat.id] ? 'bg-[#58CC02]' : 'bg-[#AAA]'}`} />{typingUsers[activeChat.id] ? `${typingUsers[activeChat.id]} is typing...` : onlineSessions[activeChat.id] ? 'Online' : 'Offline'}</p></div><button className="ml-auto rounded-2xl bg-[#FFEBEB] px-4 py-2 font-black text-[#D53838] shadow-[0_3px_0_#F2B8B8] active:translate-y-0.5 active:shadow-none" type="button" disabled={pendingAction === 'chat-status'} onClick={requestCloseChat}>{pendingAction === 'chat-status' ? 'Closing...' : 'Close'}</button></header><div className="grid content-end gap-3 overflow-y-auto bg-[#FBFBFB] p-5"><div className="inline-flex items-center gap-2 justify-self-center rounded-full bg-white px-4 py-2 text-sm font-black text-[#999] shadow-[0_2px_0_#E5E5E5]"><ColoredIcon icon={Emoji.sparkle} size="sm" />{activeChat.status === 'CLOSED' ? 'Session closed' : (activeChat.messages ?? []).length > 0 ? 'Session started again' : 'Session started'}</div>{(activeChat.messages ?? []).length === 0 && activeChat.status !== 'CLOSED' && <EmptyState icon="fluent-emoji-flat:speech-balloon" tone={tones.blue} title="No messages yet" body="Start with a short, kind message." />}{(activeChat.messages ?? []).map((message) => { const mine = message.senderId === userId; return <div className={`grid max-w-[78%] gap-1 ${mine ? 'justify-self-end' : 'justify-self-start'}`} key={message.id}><div className={`rounded-[24px] px-5 py-3 font-bold ${mine ? 'bg-[#1CB0F6] text-white' : 'bg-white text-[#555]'}`}>{message.content && <p>{message.content}</p>}{message.imageUrl && <button className="mt-2 block" type="button" onClick={() => setImagePreview(message.imageUrl ?? '')}><img className="max-h-72 rounded-2xl object-cover" src={message.imageUrl} alt="Chat attachment" /></button>}</div>{mine && <span className="justify-self-end text-xs font-black text-[#999]">{readSessions[activeChat.id] ? 'Read' : 'Sent'}</span>}</div> })}</div>{chatImage && <div className="border-t-2 border-[#EFEFEF] bg-white px-4 pt-3"><div className="relative w-fit"><img className="max-h-32 rounded-2xl object-cover" src={chatImage} alt="Chat attachment preview" /><button className="absolute -right-2 -top-2 grid size-7 place-items-center rounded-full bg-[#FF4B4B] text-white" type="button" aria-label="Remove chat image" onClick={() => setChatImage('')}><X size={14} weight="bold" /></button></div></div>}<form className="flex items-center gap-2 border-t-2 border-[#EFEFEF] bg-white p-4" onSubmit={sendChat}><label className="grid min-h-12 cursor-pointer place-items-center rounded-2xl bg-[#F7F7F7] px-4 text-[#1CB0F6] transition hover:bg-[#EAF8FF]" htmlFor="chat-image"><ColoredIcon icon={Emoji.picture} /><input id="chat-image" className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" onChange={attachChatImage} /></label><textarea className="min-h-12 max-h-32 flex-1 resize-none rounded-3xl border-0 bg-[#F7F7F7] px-5 py-3 font-bold outline-none focus:bg-[#F1FFE8]" value={chatDraft} onChange={(event) => updateChatDraft(event.target.value)} onKeyDown={(event) => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') void sendChat(event as unknown as FormEvent<HTMLFormElement>); }} placeholder={activeChat.status === 'CLOSED' ? 'Session is closed' : 'Write a message...'} disabled={activeChat.status === 'CLOSED'} aria-label="Care chat message" rows={1} /><button className="rounded-full bg-[#58CC02] px-6 py-3 font-black text-white shadow-[0_4px_0_#46A302] active:translate-y-0.5 active:shadow-none disabled:opacity-70" type="submit" disabled={pendingAction === 'chat' || activeChat.status === 'CLOSED'}>{pendingAction === 'chat' ? 'Sending...' : 'Send'}</button></form></>}
        </article>
      </section>
    ),
    history: (
      <section className="grid items-start gap-5" aria-labelledby="history-title">
        <button className="inline-flex min-h-12 w-fit items-center gap-2 rounded-2xl bg-[#F7F7F7] px-4 font-black text-[#777] shadow-[0_3px_0_#D9D9D9] transition hover:-translate-y-0.5 active:translate-y-1 active:shadow-none" type="button" onClick={() => setActiveView('profile')}><ArrowRight className="rotate-180" size={20} weight="bold" />Back to profile</button>
        <article className={`${card} grid content-start gap-3 p-5 sm:p-6`}>
          <div><h2 id="history-title" className="text-2xl font-black tracking-[-.04em]">Chat history</h2><p className="mt-1 font-bold text-[#999]">Short summaries of finished care conversations, so you remember what was discussed.</p></div>
          {closedChats.length === 0 && <EmptyState icon="fluent-emoji-flat:speech-balloon" tone={tones.purple} title="No history yet" body="When a care chat session ends, a short summary appears here." />}
          {closedChats.map((chat) => {
            const peer = chat.userId === userId ? chat.psychologist : chat.user;
            return (
              <div className="overflow-hidden rounded-[24px] border-2 border-[#E5E5E5] bg-white font-bold shadow-[0_3px_0_#D9D9D9]" key={chat.id}>
                <div className="flex items-center justify-between gap-3 bg-[#F7F7F7] p-4">
                  <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-full bg-[#CE82FF] font-black text-white">{(peer?.displayName ?? 'C').charAt(0).toUpperCase()}</span><div><span className="block font-black text-[#3C3C3C]">{peer?.displayName ?? 'Care partner'}</span><span className="text-sm text-[#999]">{chat.closedAt ? new Date(chat.closedAt).toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</span></div></div>
                  <span className="rounded-full bg-[#F3DFFF] px-3 py-1 text-sm font-black text-[#A760D2]">Summary</span>
                </div>
                <p className="p-4 leading-7 text-[#555]">{chat.summary || 'No summary recorded for this session.'}</p>
              </div>
            )
          })}
          <LoadMoreSentinel enabled={hasMoreChats} loading={loadingMore === 'chats'} onVisible={() => void loadMoreChats()} />
        </article>
      </section>
    ),
    care: (
      <section className={`grid items-start gap-5 ${isPsychologist ? 'xl:grid-cols-1' : 'xl:grid-cols-[.78fr_1.22fr]'}`} aria-labelledby="care-title">
        <button className="inline-flex min-h-12 w-fit items-center gap-2 rounded-2xl bg-[#F7F7F7] px-4 font-black text-[#777] shadow-[0_3px_0_#D9D9D9] transition hover:-translate-y-0.5 active:translate-y-1 active:shadow-none xl:col-span-full" type="button" onClick={() => setActiveView('profile')}><ArrowRight className="rotate-180" size={20} weight="bold" />Back to profile</button>
        {!isPsychologist && <article className={`${card} self-start p-6`}>
          <ColoredIcon icon={Emoji.care} size="xl" />
          <h2 id="care-title" className="mt-5 text-3xl font-black tracking-[-.04em]">{isPsychologist ? 'Professional care desk' : 'Professional care'}</h2>
          <p className="mt-2 font-bold leading-7 text-[#777]">{isPsychologist ? 'Approve or reject requests, then continue in chat.' : 'Send a request first. Chat opens after psychologist approval.'}</p>
          {!isPsychologist && <div className="mt-5 grid gap-3"><textarea className={`${field} min-h-28`} value={referralComment} onChange={(event) => setReferralComment(event.target.value)} placeholder="Tell the psychologist what happened or why you need support..." aria-label="Referral comment" /><button className={primaryBtn} type="button" disabled={pendingAction === 'referral'} onClick={createReferral}>{pendingAction === 'referral' ? 'Sending request...' : 'Request professional care'}</button></div>}

        </article>}
        <div className="grid gap-5">
          <article className={`${card} grid content-start gap-3 p-5 sm:p-6`}>
            <h3 className="text-2xl font-black tracking-[-.04em]">{isPsychologist ? 'Approval queue' : 'My care requests'}</h3>
            <div className="grid gap-3 lg:grid-cols-[1fr_230px]"><input className="min-h-12 rounded-2xl border-2 border-[#E5E5E5] px-4 font-bold outline-none focus:border-[#58CC02] focus:ring-4 focus:ring-[#D7FFBF]" value={careSearch} onChange={(event) => setCareSearch(event.target.value)} placeholder={isPsychologist ? 'Search requests...' : 'Search my requests...'} aria-label="Search care requests" />{!isPsychologist && <DuoSelect label="Filter care requests" value={careFilter} onChange={setCareFilter} options={[{ value: 'ALL', label: 'All requests' }, { value: 'PENDING', label: 'Pending' }, { value: 'ACCEPTED', label: 'Approved' }, { value: 'REJECTED', label: 'Rejected' }]} />}</div>
            {referrals.length === 0 && <EmptyState icon="fluent-emoji-flat:speech-balloon" tone={tones.red} title={isPsychologist ? 'No requests waiting' : 'No care requests yet'} body={isPsychologist ? 'New user requests will appear here for approval.' : 'Request professional care when you want help from a verified psychologist.'} />}
            {referrals.length > 0 && filteredReferrals.length === 0 && <div className="rounded-3xl bg-[#F7F7F7] p-6 text-center font-bold text-[#999]">No request found.</div>}
            {filteredReferrals.map((referral) => (
              <div className="overflow-hidden rounded-[28px] border-2 border-[#E5E5E5] bg-white font-bold text-[#777] shadow-[0_4px_0_#D9D9D9]" key={referral.id}>
                <div className="flex flex-wrap items-center justify-between gap-3 bg-[#F7F7F7] p-4">
                  <div className="flex items-center gap-3"><ColoredIcon icon={Emoji.referral} size="lg" /><div><span className="block font-black text-[#3C3C3C]">{isPsychologist ? (referral.user?.displayName ?? 'Anonymous') : (referral.providerName ?? 'Care provider')}</span><span className="text-sm text-[#999]">{new Date(referral.createdAt).toLocaleString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span></div></div>
                  <div className="flex flex-wrap gap-2"><span className={`rounded-full px-3 py-1 text-sm font-black ${referral.riskLevel === 'CRISIS' || referral.riskLevel === 'HIGH' ? 'bg-[#FFEBEB] text-[#D53838]' : 'bg-[#FFF8DF] text-[#D8A900]'}`}>{referral.riskLevel}</span><span className={`rounded-full px-3 py-1 text-sm font-black ${referral.status === 'ACCEPTED' ? 'bg-[#F1FFE8] text-[#46A302]' : referral.status === 'REJECTED' ? 'bg-[#FFEBEB] text-[#D53838]' : 'bg-white text-[#777]'}`}>{referral.status ?? 'PENDING'}</span></div>
                </div>
                <p className="p-4 leading-7 text-[#555]">{referral.reason}</p>
                {referral.requestComment && <p className="mx-4 mt-3 rounded-2xl bg-white p-3 leading-7"><span className="font-black text-[#3C3C3C]">User comment: </span>{referral.requestComment}</p>}
                {isPsychologist && referral.backgroundSnapshot && <div className="mx-4 mt-3 grid gap-3 rounded-3xl bg-white p-4 text-sm"><span className="font-black text-[#3C3C3C]">User support context</span><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-[#F1FFE8] p-3 font-black text-[#46A302]"><span className="block text-xs uppercase tracking-[.12em]">Goal</span><span>{referral.backgroundSnapshot.preference?.primaryGoal ?? '—'}</span></div><div className="rounded-2xl bg-[#EAF8FF] p-3 font-black text-[#168CC7]"><span className="block text-xs uppercase tracking-[.12em]">Recent moods</span><span>{referral.backgroundSnapshot.recentMoods?.map((mood) => `${mood.state} ${mood.intensity}/5`).join(', ') || '—'}</span></div><div className="rounded-2xl bg-[#FFF8DF] p-3 font-black text-[#D8A900]"><span className="block text-xs uppercase tracking-[.12em]">Risk history</span><span>{referral.backgroundSnapshot.recentJournals?.map((journal) => journal.riskLevel).join(', ') || '—'}</span></div></div><div className="rounded-2xl bg-[#F7F7F7] p-4"><p className="mb-2 text-xs font-black uppercase tracking-[.12em] text-[#999]">Mood intensity trend</p><div className="[&_*]:outline-none"><ResponsiveContainer width="100%" height={120}><AreaChart data={(referral.backgroundSnapshot.recentMoods ?? []).slice(0, 5).reverse().map((mood) => ({ day: new Date(mood.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }), intensity: mood.intensity, mood: moodLabel(mood.state) }))} margin={{ top: 8, right: 6, bottom: 0, left: 6 }}><defs><linearGradient id={`requestMoodFill-${referral.id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#58CC02" stopOpacity={0.38} /><stop offset="100%" stopColor="#58CC02" stopOpacity={0} /></linearGradient></defs><Tooltip cursor={false} formatter={(value, _name, item) => [`Intensity ${value}/5`, item.payload.mood]} labelFormatter={(_label, payload) => payload?.[0]?.payload?.day ? `Recorded ${payload[0].payload.day}` : 'Mood record'} contentStyle={{ borderRadius: 16, border: '2px solid #E5E5E5', boxShadow: 'none' }} /><Area type="monotone" dataKey="intensity" stroke="#58CC02" strokeWidth={3} fill={`url(#requestMoodFill-${referral.id})`} activeDot={{ r: 4, stroke: '#58CC02', strokeWidth: 2, fill: '#FFFFFF' }} /></AreaChart></ResponsiveContainer></div></div><span className="font-bold text-[#777]">Triggers: {referral.backgroundSnapshot.preference?.triggers?.join(', ') || '—'}</span></div>}
                {referral.reviewerComment && <p className="mx-4 mt-3 rounded-2xl bg-white p-3 leading-7"><span className="font-black text-[#3C3C3C]">Psychologist note: </span>{referral.reviewerComment}</p>}
                {isPsychologist && referral.status === 'PENDING' && <div className="m-4 grid gap-3"><RichTextEditor placeholder="Approval/rejection note..." minHeight="min-h-20" onChange={(_, text) => setReviewDrafts((drafts) => ({ ...drafts, [referral.id]: text }))} /><div className="flex flex-wrap gap-2"><button className={`${btn} min-h-11 bg-[#58CC02] text-white shadow-[0_4px_0_#46A302]`} type="button" disabled={pendingAction === `review-${referral.id}`} onClick={() => void handleReferralReview(referral.id, 'ACCEPTED')}>{pendingAction === `review-${referral.id}` ? 'Processing...' : 'Approve'}</button><button className={`${btn} min-h-11 bg-[#FF4B4B] text-white shadow-[0_4px_0_#D53838]`} type="button" disabled={pendingAction === `review-${referral.id}`} onClick={() => void handleReferralReview(referral.id, 'REJECTED')}>Reject</button></div></div>}
              </div>
             ))}
             <LoadMoreSentinel enabled={hasMoreReferrals} loading={loadingMore === 'referrals'} onVisible={() => void loadMoreReferrals(isPsychologist)} />
           </article>

         </div>
      </section>
    ),
  };

  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden bg-[#FBFBFB] text-[#3C3C3C]">
      <aside className="flex items-center justify-between gap-4 border-b-2 border-[#E5E5E5] bg-white p-4 lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:w-[236px] lg:flex-col lg:items-stretch lg:border-r-2 lg:border-b-0 lg:gap-6 lg:p-5">
        <Link className="text-3xl font-black tracking-[-.06em] text-[#58CC02]" to="/" aria-label="Happify home">Happify</Link>
        <nav className="hidden gap-2 font-black lg:grid" aria-label="Dashboard navigation">
          {menuItems.map(({ id, label }) => (
            <button className={`relative flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition active:translate-y-1 active:shadow-none ${activeView === id ? activeCard : idleCard}`} type="button" key={id} onClick={() => setActiveView(id)}>
              <span className="relative"><ColoredIcon icon={MenuEmoji[id]} />{((id === 'chat' && showChatBadge) || (id === 'care' && showCareBadge)) && <span className="absolute -right-1 -top-1 size-2.5 rounded-full bg-[#FF4B4B] ring-2 ring-white" />}</span>
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <button className={`${btn} max-lg:hidden bg-[#FF4B4B] text-white shadow-[0_5px_0_#D53838] lg:mt-auto`} type="button" onClick={() => setShowLogoutAlert(true)}>Sign out</button>
      </aside>
      <main className={`grid min-w-0 w-full gap-6 lg:ml-[236px] lg:w-[calc(100%-236px)] ${activeView === 'chat' ? 'h-screen grid-rows-[1fr] p-0 pb-20 lg:pb-0' : activeView === 'records' ? 'content-start p-5 pb-24 sm:p-6 lg:pb-6' : 'content-start p-5 pb-24 sm:p-6 lg:pb-6'}`}>
        {activeView !== 'chat' && <section className="flex items-center justify-between gap-4">
          {activeView === 'overview' ? (
            <div className="flex items-center gap-4">
              <UserAvatar profile={profile} size="size-16" />
              <div>
                <h1 className="text-3xl font-black tracking-[-.05em] sm:text-4xl">Welcome back, {(profile?.displayName ?? 'friend').split(' ')[0]}!</h1>
                <p className="mt-1 flex items-center gap-2 font-bold text-[#999]">{analytics?.latestMood ? <>Last mood: <MoodBadge state={analytics.latestMood.state} /></> : 'No mood recorded yet today.'}</p>
              </div>
            </div>
          ) : (
            <h1 className="text-3xl font-black tracking-[-.05em] sm:text-4xl">{menuItems.find((item) => item.id === activeView)?.label}</h1>
          )}
        </section>}
        {statusMessage && <DashboardAlert message={statusMessage} onClose={() => setStatusMessage('')} />}
        {isLoading ? <DashboardSkeleton section={activeView} /> : moduleContent[activeView]}
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t-2 border-[#E5E5E5] bg-white px-2 py-2 lg:hidden" aria-label="Dashboard navigation">
        {menuItems.map(({ id, label }) => (
          <button className={`grid min-w-16 place-items-center gap-0.5 rounded-2xl px-2 py-1.5 text-[11px] font-black transition ${activeView === id ? 'bg-[#F1FFE8] text-[#46A302]' : 'text-[#999]'}`} type="button" key={id} onClick={() => setActiveView(id)}>
          <span className="relative"><ColoredIcon icon={MenuEmoji[id]} />{((id === 'chat' && showChatBadge) || (id === 'care' && showCareBadge)) && <span className="absolute -right-1 -top-1 size-2.5 rounded-full bg-[#FF4B4B] ring-2 ring-white" />}</span>
          {label}
          </button>
        ))}
      </nav>
      {imagePreview && <button className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" type="button" aria-label="Close image preview" onClick={() => setImagePreview('')}><img className="max-h-[90vh] max-w-[92vw] rounded-3xl object-contain" src={imagePreview} alt="Preview" /></button>}
      {showCloseChatAlert && <CloseChatAlert pending={pendingAction === 'chat-status'} onCancel={() => setShowCloseChatAlert(false)} onConfirm={() => void closeChatSession()} />}
      {showLogoutAlert && <LogoutAlert onCancel={() => setShowLogoutAlert(false)} onConfirm={() => void logout()} />}
    </div>
  )
}

function DashboardSkeleton({ section }: { section: string }) {
  if (section === 'chat') return (
    <section className="grid h-full overflow-hidden bg-white xl:grid-cols-[360px_1fr]">
      <aside className="grid content-start border-b-2 border-[#EFEFEF] p-5 xl:border-r-2 xl:border-b-0">
        <SkeletonBox className="h-8 w-40 rounded-xl" />
        <SkeletonBox className="mt-3 h-4 w-48 rounded-xl" />
        <div className="mt-10 grid gap-3">
          {[1, 2, 3].map((item) => <div className="flex items-center gap-3" key={item}><SkeletonBox className="size-12 shrink-0 rounded-full" /><div className="grid flex-1 gap-2"><SkeletonBox className="h-4 w-32 rounded-xl" /><SkeletonBox className="h-3 w-48 rounded-xl" /></div></div>)}
        </div>
      </aside>
      <article className="grid min-h-0 place-items-center bg-white"><div className="grid justify-items-center gap-3"><SkeletonBox className="h-6 w-56 rounded-xl" /><SkeletonBox className="h-4 w-72 rounded-xl" /></div></article>
    </section>
  )

  if (section === 'profile') return (
    <div className="grid gap-8">
      <div className="grid gap-6 border-b-2 border-[#E5E5E5] pb-8 md:grid-cols-[auto_1fr] md:items-center"><SkeletonBox className="size-32 rounded-full" /><div className="grid gap-3"><SkeletonBox className="h-10 w-72 rounded-xl" /><SkeletonBox className="h-5 w-56 rounded-xl" /><SkeletonBox className="h-5 w-44 rounded-xl" /></div></div>
      <SkeletonBox className="h-80" />
      <SkeletonBox className="h-64" />
    </div>
  )

  if (section === 'community') return (
    <div className="grid items-start gap-5 xl:grid-cols-[1fr_320px]">
      <section className="grid gap-5"><SkeletonBox className="h-44" />{[1, 2, 3].map((item) => <SkeletonBox className="h-64" key={item} />)}</section>
      <aside className="sticky top-6 hidden content-start gap-4 xl:grid"><SkeletonBox className="h-36" /><SkeletonBox className="h-36" /></aside>
    </div>
  )

  if (section === 'care') return (
    <section className="grid items-start gap-5 xl:grid-cols-[.78fr_1.22fr]"><SkeletonBox className="h-80" /><div className="grid gap-5"><SkeletonBox className="h-96" /></div></section>
  )

  if (section === 'history') return (
    <section className="grid items-start gap-5 xl:grid-cols-2"><SkeletonBox className="h-96" /><SkeletonBox className="h-96" /></section>
  )

  if (section === 'records') return (
    <section className="grid items-start gap-5 xl:grid-cols-[.9fr_1.1fr]"><SkeletonBox className="h-80" /><SkeletonBox className="h-80" /><SkeletonBox className="h-64 xl:col-span-2" /></section>
  )

  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{[1, 2, 3, 4].map((item) => <SkeletonBox className="h-24 rounded-3xl" key={item} />)}</div>
      <section className="grid gap-4 xl:grid-cols-[1.2fr_.8fr]"><SkeletonBox className="h-[374px]" /><SkeletonBox className="h-[374px]" /></section>
      <section className="grid gap-4 xl:grid-cols-2"><SkeletonBox className="h-72" /><SkeletonBox className="h-72" /></section>
    </div>
  )
}

export default DashboardPage

