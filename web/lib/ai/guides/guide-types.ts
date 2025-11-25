/**
 * Guide Types
 * Type definitions for AI-guided setup flows
 */

export interface AIGuideStep {
  title: string;
  instruction: string;
  helpPrompt: string;  // Prompt for AI to provide contextual help
  detailedHelp?: string;  // Static detailed help (shown before AI)
  validationUrl?: string;  // Optional: API endpoint to validate step completion
  troubleshootingPrompt?: string;  // Prompt for AI troubleshooting
}

export interface AIGuide {
  id: string;
  title: string;
  description: string;
  estimatedTime: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: 'setup' | 'integration' | 'content' | 'optimization';
  steps: AIGuideStep[];
  prerequisites?: string[];
  nextSteps?: string[];
}

export interface GuideProgress {
  guideId: string;
  currentStep: number;
  completed: boolean;
  startedAt: Date;
  completedAt?: Date;
}
