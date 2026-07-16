import { useCallback, useEffect, useState } from 'react';
import { getCareChats, getCommunityPosts, getDashboardAnalytics, getJournals, getProfile, getReferrals, type CareChatSession, type CommunityPost, type DashboardAnalytics, type ReferralRecord, type UserProfile } from '@/api/dashboard/queries';

export function useDashboardData(userId: string) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [communityCursor, setCommunityCursor] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [careChats, setCareChats] = useState<CareChatSession[]>([]);
  const [journals, setJournals] = useState<DashboardAnalytics['recentJournals']>([]);
  const [referralPage, setReferralPage] = useState(1);
  const [chatPage, setChatPage] = useState(1);
  const [journalPage, setJournalPage] = useState(1);
  const [hasMoreReferrals, setHasMoreReferrals] = useState(false);
  const [hasMoreChats, setHasMoreChats] = useState(false);
  const [hasMoreJournals, setHasMoreJournals] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState('');
  const [isLoadingMoreCommunity, setIsLoadingMoreCommunity] = useState(false);

  const refetch = useCallback(async () => {
    if (!userId) return;
    try {
      const [profileData, analyticsData, posts] = await Promise.all([
        getProfile(userId),
        getDashboardAnalytics(userId),
        getCommunityPosts(undefined, userId),
      ]);
      setProfile(profileData);
      if (profileData?.role) localStorage.setItem('happify.role', profileData.role);
      setAnalytics(analyticsData);
      setCommunityPosts(posts.items);
      setCommunityCursor(posts.nextCursor);
      const [referralData, chatData, journalData] = await Promise.all([getReferrals(profileData?.role === 'PSYCHOLOGIST' ? undefined : userId), getCareChats(userId), getJournals(userId)]);
      setReferrals(referralData.items);
      setCareChats(chatData.items);
      setJournals(journalData.items);
      setReferralPage(1);
      setChatPage(1);
      setJournalPage(1);
      setHasMoreReferrals(referralData.hasMore);
      setHasMoreChats(chatData.hasMore);
      setHasMoreJournals(journalData.hasMore);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const loadMoreCommunity = useCallback(async () => {
    if (!communityCursor || isLoadingMoreCommunity) return;
    setIsLoadingMoreCommunity(true);
    try {
      const posts = await getCommunityPosts(communityCursor, userId);
      setCommunityPosts((current) => [...current, ...posts.items]);
      setCommunityCursor(posts.nextCursor);
    } finally {
      setIsLoadingMoreCommunity(false);
    }
  }, [communityCursor, isLoadingMoreCommunity, userId]);

  const loadMoreReferrals = useCallback(async (isPsychologist: boolean) => {
    if (!hasMoreReferrals || loadingMore) return;
    setLoadingMore('referrals');
    try {
      const nextPage = referralPage + 1;
      const data = await getReferrals(isPsychologist ? undefined : userId, nextPage);
      setReferrals((current) => [...current, ...data.items.filter((item) => !current.some((existing) => existing.id === item.id))]);
      setReferralPage(nextPage);
      setHasMoreReferrals(data.hasMore);
    } finally { setLoadingMore(''); }
  }, [hasMoreReferrals, loadingMore, referralPage, userId]);

  const loadMoreChats = useCallback(async () => {
    if (!hasMoreChats || loadingMore) return;
    setLoadingMore('chats');
    try {
      const nextPage = chatPage + 1;
      const data = await getCareChats(userId, nextPage);
      setCareChats((current) => [...current, ...data.items.filter((item) => !current.some((existing) => existing.id === item.id))]);
      setChatPage(nextPage);
      setHasMoreChats(data.hasMore);
    } finally { setLoadingMore(''); }
  }, [chatPage, hasMoreChats, loadingMore, userId]);

  const loadMoreJournals = useCallback(async () => {
    if (!hasMoreJournals || loadingMore) return;
    setLoadingMore('journals');
    try {
      const nextPage = journalPage + 1;
      const data = await getJournals(userId, nextPage);
      setJournals((current) => [...current, ...data.items.filter((item) => !current.some((existing) => existing.id === item.id))]);
      setJournalPage(nextPage);
      setHasMoreJournals(data.hasMore);
    } finally { setLoadingMore(''); }
  }, [hasMoreJournals, journalPage, loadingMore, userId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { profile, analytics, communityPosts, communityCursor, referrals, careChats, journals, isLoading, loadingMore, isLoadingMoreCommunity, hasMoreReferrals, hasMoreChats, hasMoreJournals, setCommunityPosts, setReferrals, setCareChats, loadMoreCommunity, loadMoreReferrals, loadMoreChats, loadMoreJournals, refetch };
}
