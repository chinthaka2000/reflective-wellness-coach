// 🧠 Mental Wellness AI Assistant - API Service

import axios, { AxiosInstance } from 'axios';
import {
  ChatResponse,
  MoodEntry,
  MoodAnalytics,
  Task,
  TaskAnalytics,
  PersonalityModes,
  Reflection,
  MemoryStats,
  SOSResource
} from '../types';


class ApiService {
  private api: AxiosInstance;

  constructor() {
    
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_URL || '/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('❌ API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => {
        console.log(`✅ API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('❌ API Response Error:', error);
        
        // Handle common error scenarios
        if (error.response) {
          // Server responded with error status
          const message = error.response.data?.error || error.response.data?.message || 'Server error occurred';
          throw new Error(message);
        } else if (error.request) {
          // Request was made but no response received
          throw new Error('Unable to connect to server. Please check your connection.');
        } else {
          // Something else happened
          throw new Error(error.message || 'An unexpected error occurred');
        }
      }
    );
  }

  // Health check
  async healthCheck(): Promise<any> {
    const response = await this.api.get('/health');
    return response.data;
  }

  // Chat endpoints
  async sendMessage(
    message: string,
    personalityMode: string = 'calm_coach',
    language: string = 'english',
    additionalData?: Record<string, any>
  ): Promise<ChatResponse> {
    const response = await this.api.post('/chat', {
      message,
      personality_mode: personalityMode,
      language,
      ...additionalData,
    });
    return response.data;
  }

  // Mood tracking endpoints
  async logMood(mood: string | number, note: string = '', context?: Record<string, any>): Promise<MoodEntry> {
    const response = await this.api.post('/mood', {
      mood,
      note,
      context,
    });
    return response.data.result;
  }

  async getMoodAnalytics(days: number = 7): Promise<MoodAnalytics> {
    const response = await this.api.get(`/mood/analytics?days=${days}`);
    return response.data.analytics;
  }

  // Task management endpoints
  async getTasks(status?: string, category?: string): Promise<Task[]> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (category) params.append('category', category);
    
    const response = await this.api.get(`/tasks?${params.toString()}`);
    return response.data.tasks;
  }

  async createTask(taskData: {
    title: string;
    description?: string;
    priority?: string;
    due_date?: string;
    category?: string;
    wellness_impact?: string;
  }): Promise<Task> {
    const response = await this.api.post('/tasks', taskData);
    return response.data.task;
  }

  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
    const response = await this.api.put(`/tasks/${taskId}`, updates);
    return response.data.task;
  }

  async deleteTask(taskId: string): Promise<boolean> {
    const response = await this.api.delete(`/tasks/${taskId}`);
    return response.data.success;
  }

  async getTaskAnalytics(days: number = 30): Promise<TaskAnalytics> {
    const response = await this.api.get(`/tasks/analytics?days=${days}`);
    return response.data.analytics;
  }

  // Memory endpoints
  async saveReflection(reflection: string, category: string = 'general'): Promise<Reflection> {
    const response = await this.api.post('/memory/reflect', {
      reflection,
      category,
    });
    return response.data.result;
  }

  async rememberImportant(content: string, importance: string = 'medium'): Promise<any> {
    const response = await this.api.post('/memory/remember', {
      content,
      importance,
    });
    return response.data.result;
  }

  async getMemoryStats(): Promise<MemoryStats> {
    const response = await this.api.get('/memory/stats');
    return response.data;
  }

  async showMemories(): Promise<any> {
    const response = await this.api.get('/memory/show');
    return response.data.memories;
  }

  // Personality mode endpoints
  async getPersonalityModes(): Promise<{ modes: PersonalityModes; current_mode: string }> {
    const response = await this.api.get('/personality/modes');
    return response.data;
  }

  async setPersonalityMode(mode: string): Promise<boolean> {
    const response = await this.api.post('/personality/mode', { mode });
    return response.data.success;
  }

  // SOS and crisis support
  async triggerSOS(content: string, urgency: string = 'medium', location?: string): Promise<{
    message: string;
    resources: SOSResource[];
    logged: boolean;
  }> {
    const response = await this.api.post('/chat', {
      message: `#sos ${content}`,
      urgency,
      location,
    });
    return response.data.command_result?.result;
  }

  // Utility methods
  async ping(): Promise<boolean> {
    try {
      await this.healthCheck();
      return true;
    } catch {
      return false;
    }
  }

  // Batch operations
  async sendBatchMessages(messages: Array<{
    message: string;
    personality_mode?: string;
    language?: string;
  }>): Promise<ChatResponse[]> {
    const promises = messages.map(msg => this.sendMessage(
      msg.message,
      msg.personality_mode,
      msg.language
    ));
    return Promise.all(promises);
  }

  async createBatchTasks(tasks: Array<{
    title: string;
    description?: string;
    priority?: string;
    category?: string;
  }>): Promise<Task[]> {
    const promises = tasks.map(task => this.createTask(task));
    return Promise.all(promises);
  }

  // Error handling helpers
  private handleApiError(error: any): never {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    } else if (error.message) {
      throw new Error(error.message);
    } else {
      throw new Error('An unexpected error occurred');
    }
  }

  // Request cancellation
  private cancelTokenSource = axios.CancelToken.source();

  cancelAllRequests(): void {
    this.cancelTokenSource.cancel('Operation cancelled by user');
    this.cancelTokenSource = axios.CancelToken.source();
  }

  // File upload support (for future features)
  async uploadFile(file: File, endpoint: string): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.api.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / (progressEvent.total || 1)
        );
        console.log(`Upload Progress: ${percentCompleted}%`);
      },
    });

    return response.data;
  }

  // WebSocket support placeholder (for future real-time features)
  setupWebSocket?(url: string): WebSocket {
    const ws = new WebSocket(url);
    
    ws.onopen = () => {
      console.log('🔌 WebSocket connected');
    };
    
    ws.onclose = () => {
      console.log('🔌 WebSocket disconnected');
    };
    
    ws.onerror = (error) => {
      console.error('🔌 WebSocket error:', error);
    };
    
    return ws;
  }
}

// Create and export singleton instance
export const apiService = new ApiService();

// Export class for testing purposes
export default ApiService;

// Helper functions for common operations
export const apiHelpers = {
  // Quick mood logging
  quickMoodLog: async (mood: number, note?: string) => {
    try {
      return await apiService.logMood(mood, note || '');
    } catch (error) {
      console.error('Failed to log mood:', error);
      throw error;
    }
  },

  // Quick task creation
  quickTask: async (title: string, category: string = 'personal') => {
    try {
      return await apiService.createTask({ title, category });
    } catch (error) {
      console.error('Failed to create task:', error);
      throw error;
    }
  },

  // Quick reflection save
  quickReflection: async (content: string) => {
    try {
      return await apiService.saveReflection(content);
    } catch (error) {
      console.error('Failed to save reflection:', error);
      throw error;
    }
  },

  // Check API connectivity
  checkConnection: async (): Promise<boolean> => {
    try {
      await apiService.ping();
      return true;
    } catch {
      return false;
    }
  },

  // Format error messages for UI
  formatError: (error: any): string => {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    if (error?.response?.data?.error) return error.response.data.error;
    return 'An unexpected error occurred';
  },
};

// Type guards for API responses
export const isApiError = (response: any): response is { error: string } => {
  return response && typeof response.error === 'string';
};

export const isApiSuccess = <T>(response: any): response is { success: true; data: T } => {
  return response && response.success === true;
};
