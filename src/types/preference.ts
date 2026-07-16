export interface PreferencePayload {
  userId: string;
  primaryGoal: string;
  triggers: string[];
  supportTone: string;
  highRiskAction: string;
  accessibilityMode: string[];
  consentToAi: boolean;
}
