import { ApiService } from '@/constants/api-service';

export const Api = {
  analyticsDashboard: `${ApiService.baseURL}/analytics/dashboard`,
  authVerify: `${ApiService.baseURL}/auth/verify`,
  preferences: `${ApiService.baseURL}/preferences`,
  mood: `${ApiService.baseURL}/mood`,
  journal: `${ApiService.baseURL}/journal`,
  community: `${ApiService.baseURL}/community`,
  heatmap: `${ApiService.baseURL}/heatmap`,
  referral: `${ApiService.baseURL}/referral`,
  profile: `${ApiService.baseURL}/profile`,
  mediaImages: `${ApiService.baseURL}/media/images`,
  psychologistApplications: `${ApiService.baseURL}/profile/psychologist-applications`,
};
