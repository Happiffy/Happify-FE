import apiClient from '@/config/api-client';
import { Api } from '@/constants/api';
import type { PreferencePayload } from '@/types/preference';

export async function upsertPreference(payload: PreferencePayload) {
  const response = await apiClient.put(Api.preferences, payload);
  return response.data;
}
