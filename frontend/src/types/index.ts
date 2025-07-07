// 🧠 Mental Wellness AI Assistant - TypeScript Types

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  sentiment?: string;
  isMemoryDisplay?: boolean;
  personality_mode?: string;
}

export interface SentimentAnalysis {
  overall_sentiment: 'positive' | 'negative' | 'neutral';
  polarity: number; // -1 to 1
  subjectivity: number; // 0 to 1
  emotions: Record<string, number>;
  mental_health_indicators: MentalHealthIndicators;
  urgency_level: 'low' | 'medium' | 'high' | 'crisis';
  insights: string[];
  confidence: number;
}

export interface MentalHealthIndicators {
  depression_signs: string[];
  anxiety_signs: string[];
  stress_indicators: string[];
  positive_coping: string[];
  support_seeking: string[];
  crisis_indicators: string[];
}

export interface CommandResult {
  type: 'reflection' | 'mood' | 'task' | 'remember' | 'sos' | 'error';
  success: boolean;
  result?: any;
  task?: Task;
  error?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: TaskCategory;
  wellness_impact: 'positive' | 'neutral' | 'challenging';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  due_date?: string;
  completed_at?: string;
  tags: string[];
  estimated_effort: 'low' | 'medium' | 'high';
  wellness_suggestions: string[];
  days_until_due?: number;
}

export type TaskCategory = 
  | 'self_care'
  | 'mindfulness'
  | 'exercise'
  | 'social'
  | 'work'
  | 'personal'
  | 'health'
  | 'learning'
  | 'creative'
  | 'household';

export interface MoodEntry {
  id: string;
  mood_value: number; // 1-10 scale
  mood_label: string;
  note: string;
  timestamp: string;
  context?: Record<string, any>;
  note_sentiment?: {
    polarity: number;
    subjectivity: number;
  };
}

export interface MoodAnalytics {
  period: string;
  total_entries: number;
  average_mood: number;
  mood_trend: 'improving' | 'declining' | 'stable' | 'insufficient_data';
  mood_distribution: {
    low: number;
    moderate: number;
    high: number;
  };
  daily_summary: DailySummary[];
  insights: string[];
  recommendations: string[];
}

export interface DailySummary {
  date: string;
  entries: number;
  average_mood: number;
  mood_range: {
    min: number;
    max: number;
  };
}

export interface PersonalityMode {
  name: string;
  description: string;
  emoji: string;
  characteristics: string[];
  communication_style: {
    tone: string;
    pace: string;
    language: string;
    approach: string;
  };
  specialties: string[];
  sample_responses: string[];
}

export interface PersonalityModes {
  [key: string]: PersonalityMode;
}

export interface ChatSettings {
  personality_mode: string;
  language: 'english' | 'sinhala' | 'tamil';
  auto_save_reflections: boolean;
  show_sentiment_analysis: boolean;
  enable_mood_tracking: boolean;
  crisis_detection: boolean;
}

export interface UserProfile {
  name?: string;
  preferred_personality?: string;
  preferred_language: string;
  timezone?: string;
  crisis_contacts?: CrisisContact[];
  wellness_goals?: string[];
  therapy_sessions?: TherapySession[];
}

export interface CrisisContact {
  name: string;
  phone: string;
  relationship: string;
  primary: boolean;
}

export interface TherapySession {
  date: string;
  notes: string;
  mood_before: number;
  mood_after: number;
  topics: string[];
}

export interface Reflection {
  id: string;
  content: string;
  category: string;
  timestamp: string;
  type: 'reflection';
}

export interface MemoryStats {
  short_term: {
    message_count: number;
    max_token_limit: number;
  };
  long_term: {
    reflections: number;
    important_memories: number;
    mood_data: number;
    sos_requests: number;
    user_profile: number;
  };
}

export interface TaskAnalytics {
  period: string;
  total_tasks: number;
  completed_tasks: number;
  completion_rate: number;
  category_breakdown: Record<string, number>;
  priority_breakdown: Record<string, number>;
  wellness_impact_breakdown: Record<string, number>;
  insights: string[];
  recommendations: string[];
}

export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ChatResponse {
  response: string;
  sentiment: SentimentAnalysis;
  personality_mode: string;
  language: string;
  command_result?: CommandResult;
  timestamp: string;
}

export interface SOSResource {
  name: string;
  phone: string;
  description: string;
  website?: string;
}

export interface WellnessSuggestion {
  title: string;
  description: string;
  category: 'immediate' | 'self_care' | 'long_term' | 'professional';
  difficulty: 'easy' | 'medium' | 'challenging';
  time_estimate: string;
  icon?: string;
}

// UI State Types
export interface AppState {
  isLoading: boolean;
  error: string | null;
  user: UserProfile | null;
  settings: ChatSettings;
  currentPersonalityMode: string;
  messages: Message[];
  tasks: Task[];
  moodEntries: MoodEntry[];
  reflections: Reflection[];
}

export interface LoadingState {
  chat: boolean;
  mood: boolean;
  tasks: boolean;
  analytics: boolean;
}

// Hook Types
export interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  immediate?: boolean;
}

export interface UseChatOptions {
  autoScroll?: boolean;
  saveHistory?: boolean;
  enableCommands?: boolean;
}

// Component Props Types
export interface ChatMessageProps {
  message: Message;
  isTyping?: boolean;
  showSentiment?: boolean;
}

export interface MoodSelectorProps {
  onMoodSelect: (mood: number, note: string) => void;
  isLoading?: boolean;
}

export interface TaskCardProps {
  task: Task;
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
}

export interface PersonalityModeCardProps {
  mode: PersonalityMode;
  modeId: string;
  isActive: boolean;
  onSelect: (modeId: string) => void;
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
