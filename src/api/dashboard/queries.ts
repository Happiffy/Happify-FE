import apiClient from '@/config/api-client';
import { Api } from '@/constants/api';

export type DashboardAnalytics = {
  totals: { moods: number, journals: number, communityPosts: number, referrals: number, heatmapPoints: number };
  latestMood: { state: string, intensity: number, createdAt: string } | null;
  moodTrend: { state: string, intensity: number, createdAt: string }[];
  recentJournals: { id: string, title: string, content: string, imageUrl?: string | null, detectedMood?: string | null, aiReflection?: string | null, riskLevel: string, createdAt: string }[];
  referrals: { id: string, riskLevel: string, reason: string, createdAt: string }[];
  riskSummary: { riskLevel: string, count: number }[];
};

export type UserProfile = {
  id?: string;
  displayName?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  role?: string;
  createdAt?: string;
  psychologistApplication?: { status: string, reviewComment?: string | null } | null;
};

export type CommunityComment = { id: string, alias: string, content: string, imageUrl?: string | null, createdAt: string };
export type CommunityPost = { id: string, alias: string, content: string, imageUrl?: string | null, mood?: string | null, supportCount: number, likedByMe?: boolean, createdAt: string, comments?: CommunityComment[] };
export type HeatmapRegion = { regionKey: string, count: number, moods: Record<string, number> };

export type ReferralBackground = { preference?: { primaryGoal?: string, triggers?: string[], supportTone?: string, highRiskAction?: string } | null, recentMoods?: { state: string, intensity: number, triggers: string[], note?: string | null, createdAt: string }[], recentJournals?: { title: string, riskLevel: string, detectedMood?: string | null, aiReflection?: string | null, createdAt: string }[] };
export type CareChatMessage = { id: string, senderId: string, content: string, imageUrl?: string | null, readAt?: string | null, createdAt: string, sender?: { id: string, displayName?: string | null, avatarUrl?: string | null, role?: string } };
export type CareChatSession = { id: string, referralId: string, userId: string, psychologistId: string, status?: 'OPEN' | 'CLOSED', summary?: string | null, closedAt?: string | null, updatedAt: string, user?: UserProfile, psychologist?: UserProfile, referral?: ReferralRecord, messages?: CareChatMessage[] };
export type ReferralRecord = { id: string, riskLevel: string, reason: string, requestComment?: string | null, reviewerComment?: string | null, backgroundSnapshot?: ReferralBackground | null, providerName?: string | null, status?: string, createdAt: string, user?: UserProfile, psychologist?: UserProfile, chatSession?: { id: string, updatedAt: string } | null };

export async function getProfile(userId: string) {
  const response = await apiClient.get(Api.profile, { params: { userId } });
  return response.data.data.profile as UserProfile | null;
}

export async function getDashboardAnalytics(userId: string) {
  const response = await apiClient.get(Api.analyticsDashboard, { params: { userId } });
  return response.data.data.dashboard as DashboardAnalytics;
}

export async function createMood(payload: { userId: string, state: string, intensity: number, triggers: string[], note?: string }) {
  const response = await apiClient.post(Api.mood, payload);
  return response.data.data.mood;
}

export async function createJournal(payload: { userId: string, title: string, content: string, imageUrl?: string, detectedMood?: string, riskLevel?: string, aiReflection?: string }) {
  const response = await apiClient.post(Api.journal, payload);
  return response.data.data.journal;
}

export async function updateProfile(userId: string, payload: { displayName?: string, bio?: string }) {
  const response = await apiClient.patch(Api.profile, payload, { params: { userId } });
  return response.data.data.profile;
}

export async function createCommunityPost(payload: { userId: string, alias: string, content: string, imageUrl?: string, mood?: string }) {
  const response = await apiClient.post(Api.community, payload);
  return response.data.data.post;
}

export async function createReferral(payload: { userId: string, riskLevel: string, reason: string, requestComment?: string, providerName?: string, providerType?: string, contactUrl?: string }) {
  const response = await apiClient.post(Api.referral, payload);
  return response.data.data.referral as ReferralRecord;
}

export async function applyPsychologist(payload: { userId: string, fullName: string, licenseNumber: string, certificateUrl: string, reason?: string }) {
  const response = await apiClient.post(Api.psychologistApplications, payload);
  return response.data.data.application;
}

export async function getCommunityPosts(cursor?: string, userId?: string) {
  const response = await apiClient.get(Api.community, { params: { ...(cursor ? { cursor } : {}), ...(userId ? { userId } : {}), limit: 10 } });
  return response.data.data as { items: CommunityPost[], nextCursor: string | null };
}

export async function getHeatmap() {
  const response = await apiClient.get(Api.heatmap, { params: { days: 7 } });
  return response.data.data.items as HeatmapRegion[];
}

export async function supportCommunityPost(postId: string, userId: string) {
  const response = await apiClient.post(`${Api.community}/${postId}/support`, { userId });
  return response.data.data.post as CommunityPost;
}

export async function createCommunityComment(postId: string, payload: { userId?: string, content: string, imageUrl?: string }) {
  const response = await apiClient.post(`${Api.community}/${postId}/comments`, payload);
  return response.data.data.comment as CommunityComment;
}

export async function getReferrals(userId?: string, page = 1, limit = 5) {
  const response = await apiClient.get(Api.referral, { params: { ...(userId ? { userId } : {}), page, limit } });
  return response.data.data as { items: ReferralRecord[], hasMore: boolean };
}

export async function reviewReferral(referralId: string, payload: { psychologistId: string, status: 'ACCEPTED' | 'REJECTED', reviewerComment?: string }) {
  const response = await apiClient.patch(`${Api.referral}/${referralId}/review`, payload);
  return response.data.data.referral as ReferralRecord;
}

export async function getCareChats(userId: string, page = 1, limit = 5) {
  const response = await apiClient.get(`${Api.referral}/chats`, { params: { userId, page, limit } });
  return response.data.data as { items: CareChatSession[], hasMore: boolean };
}

export async function getJournals(userId: string, page = 1, limit = 5) {
  const response = await apiClient.get(Api.journal, { params: { userId, page, limit } });
  return response.data.data as { items: DashboardAnalytics['recentJournals'], hasMore: boolean };
}

export async function getCareChat(sessionId: string) {
  const response = await apiClient.get(`${Api.referral}/chats/${sessionId}`);
  return response.data.data.session as CareChatSession | null;
}

export async function updateCareChatStatus(sessionId: string, status: 'OPEN' | 'CLOSED') {
  const response = await apiClient.patch(`${Api.referral}/chats/${sessionId}/status`, { status });
  return response.data.data.session as CareChatSession;
}

export async function sendCareChatMessage(sessionId: string, payload: { senderId: string, content: string, imageUrl?: string }) {
  const response = await apiClient.post(`${Api.referral}/chats/${sessionId}/messages`, payload);
  return response.data.data.message as CareChatMessage;
}

export async function uploadImage(payload: { imageBase64: string, contentType: 'image/jpeg' | 'image/png' | 'image/webp' }) {
  const response = await apiClient.post(Api.mediaImages, payload);
  return response.data.data.image as { url: string, key: string };
}
