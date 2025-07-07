import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Calendar, Heart, CheckCircle, Brain, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// API and utilities
import { apiService } from '../utils/api';
import { MoodAnalytics, TaskAnalytics } from '../types';
import { getMoodEmoji, getMoodLabel, formatDateOnly } from '../utils/helpers';

const Analytics: React.FC = () => {
  const [moodAnalytics, setMoodAnalytics] = useState<MoodAnalytics | null>(null);
  const [taskAnalytics, setTaskAnalytics] = useState<TaskAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [timeRange, setTimeRange] = useState(7);

  // Load analytics data
  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const [moodData, taskData] = await Promise.all([
        apiService.getMoodAnalytics(timeRange).catch(() => null),
        apiService.getTaskAnalytics(timeRange).catch(() => null),
      ]);
      
      setMoodAnalytics(moodData);
      setTaskAnalytics(taskData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mood analytics card
  const MoodAnalyticsCard = () => {
    if (!moodAnalytics) {
      return (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-reflect p-6"
        >
          <div className="flex items-center space-x-2 mb-4">
            <Heart className="w-5 h-5 text-accent" />
            <h3 className="text-lg font-semibold font-serif text-primary">Mood Analytics</h3>
          </div>
          <div className="text-center py-8 text-text/60">
            <Heart className="w-12 h-12 text-text/30 mx-auto mb-2" />
            <p>No mood data available for the selected period</p>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-reflect p-6"
      >
        <div className="flex items-center space-x-2 mb-6">
          <Heart className="w-5 h-5 text-accent" />
          <h3 className="text-lg font-semibold font-serif text-primary">Mood Analytics</h3>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="glass-card p-4 rounded-xl border border-primary/20"
          >
            <div className="text-2xl font-bold text-primary">
              {moodAnalytics.average_mood.toFixed(1)}
            </div>
            <div className="text-sm text-text/80">Average Mood</div>
            <div className="text-xs text-text/60">
              {getMoodEmoji(Math.round(moodAnalytics.average_mood))} 
              {getMoodLabel(Math.round(moodAnalytics.average_mood))}
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="glass-card p-4 rounded-xl border border-secondary/20"
          >
            <div className="text-2xl font-bold text-secondary">
              {moodAnalytics.total_entries}
            </div>
            <div className="text-sm text-text/80">Total Entries</div>
            <div className="text-xs text-text/60">{moodAnalytics.period}</div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="glass-card p-4 rounded-xl border border-accent/20"
          >
            <div className="text-2s font-bold text-accent capitalize">
              {moodAnalytics.mood_trend}
            </div>
            <div className="text-sm text-text/80">Trend</div>
            <div className="text-xs text-text/60">
              {moodAnalytics.mood_trend === 'improving' ? '📈' : 
               moodAnalytics.mood_trend === 'declining' ? '📉' : '➡️'}
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="glass-card p-4 rounded-xl border border-tertiary/20"
          >
            <div className="text-2xl font-bold text-tertiary">
              {moodAnalytics.mood_distribution.high}
            </div>
            <div className="text-sm text-text/80">High Mood Days</div>
            <div className="text-xs text-text/60">Out of {moodAnalytics.total_entries}</div>
          </motion.div>
        </div>

        {/* Daily breakdown */}
        {moodAnalytics.daily_summary && moodAnalytics.daily_summary.length > 0 && (
          <div>
            <h4 className="font-medium text-text mb-3">Daily Breakdown</h4>
            <div className="space-y-2">
              {moodAnalytics.daily_summary.slice(0, 7).map((day, index) => (
                <motion.div 
                  key={day.date}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 glass-card rounded-lg border border-white/20"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{getMoodEmoji(Math.round(day.average_mood))}</span>
                    <div>
                      <div className="font-medium text-text">
                        {formatDateOnly(day.date)}
                      </div>
                      <div className="text-sm text-text/60">
                        {day.entries} {day.entries === 1 ? 'entry' : 'entries'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-text">
                      {day.average_mood.toFixed(1)}
                    </div>
                    <div className="text-sm text-text/60">
                      {getMoodLabel(Math.round(day.average_mood))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  // Task analytics card
  const TaskAnalyticsCard = () => {
    if (!taskAnalytics) {
      return (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-reflect p-6"
        >
          <div className="flex items-center space-x-2 mb-4">
            <CheckCircle className="w-5 h-5 text-accent" />
            <h3 className="text-lg font-semibold font-serif text-primary">Task Analytics</h3>
          </div>
          <div className="text-center py-8 text-text/60">
            <CheckCircle className="w-12 h-12 text-text/30 mx-auto mb-2" />
            <p>No task data available for the selected period</p>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-reflect p-6"
      >
        <div className="flex items-center space-x-2 mb-6">
          <CheckCircle className="w-5 h-5 text-accent" />
          <h3 className="text-lg font-semibold font-serif text-primary">Task Analytics</h3>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="glass-card p-4 rounded-xl border border-secondary/20"
          >
            <div className="text-2xl font-bold text-secondary">
              {Math.round(taskAnalytics.completion_rate * 100)}%
            </div>
            <div className="text-sm text-text/80">Completion Rate</div>
            <div className="text-xs text-text/60">
              {taskAnalytics.completed_tasks} of {taskAnalytics.total_tasks}
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="glass-card p-4 rounded-xl border border-primary/20"
          >
            <div className="text-2xl font-bold text-primary">
              {taskAnalytics.total_tasks}
            </div>
            <div className="text-sm text-text/80">Total Tasks</div>
            <div className="text-xs text-text/60">{taskAnalytics.period}</div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="glass-card p-4 rounded-xl border border-tertiary/20"
          >
            <div className="text-2xl font-bold text-tertiary">
              {taskAnalytics.completed_tasks}
            </div>
            <div className="text-sm text-text/80">Completed</div>
            <div className="text-xs text-text/60">Tasks finished</div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="glass-card p-4 rounded-xl border border-accent/20"
          >
            <div className="text-2xl font-bold text-accent">
              {Object.values(taskAnalytics.priority_breakdown).reduce((a, b) => Math.max(a, b), 0)}
            </div>
            <div className="text-sm text-text/80">Most Common</div>
            <div className="text-xs text-text/60 capitalize">
              {Object.entries(taskAnalytics.priority_breakdown)
                .reduce((a, b) => a[1] > b[1] ? a : b)[0]} priority
            </div>
          </motion.div>
        </div>

        {/* Category breakdown */}
        {Object.keys(taskAnalytics.category_breakdown).length > 0 && (
          <div className="mb-6">
            <h4 className="font-medium text-text mb-3">Tasks by Category</h4>
            <div className="space-y-2">
              {Object.entries(taskAnalytics.category_breakdown)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([category, count], index) => (
                  <motion.div 
                    key={category}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-2 glass-card rounded border border-white/20"
                  >
                    <span className="text-sm font-medium text-text capitalize">
                      {category.replace('_', ' ')}
                    </span>
                    <span className="text-sm text-text/60">{count} tasks</span>
                  </motion.div>
                ))}
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  // Insights card
  const InsightsCard = () => {
    const allInsights = [
      ...(moodAnalytics?.insights || []),
      ...(taskAnalytics?.insights || [])
    ];

    const allRecommendations = [
      ...(moodAnalytics?.recommendations || []),
      ...(taskAnalytics?.recommendations || [])
    ];

    if (allInsights.length === 0 && allRecommendations.length === 0) {
      return null;
    }

    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-reflect p-6"
      >
        <div className="flex items-center space-x-2 mb-6">
          <Sparkles className="w-5 h-5 text-accent" />
          <h3 className="text-lg font-semibold font-serif text-primary">Insights & Recommendations</h3>
        </div>

        {/* Insights */}
        {allInsights.length > 0 && (
          <div className="mb-6">
            <h4 className="font-medium font-serif text-primary mb-3">📊 Key Insights</h4>
            <div className="space-y-3">
              {allInsights.slice(0, 5).map((insight, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 glass-card border border-primary/20 rounded-lg"
                >
                  <p className="text-text text-sm">{insight}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {allRecommendations.length > 0 && (
          <div>
            <h4 className="font-medium text-text mb-3">💡 Recommendations</h4>
            <div className="space-y-3">
              {allRecommendations.slice(0, 5).map((recommendation, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start space-x-3 p-3 glass-card border border-secondary/20 rounded-lg"
                >
                  <div className="w-2 h-2 bg-secondary rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-text text-sm">{recommendation}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="h-full bg-background overflow-y-auto">
      <div className="container-wellness py-6 space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <div className="flex items-center justify-center space-x-2">
            <BarChart3 className="w-8 h-8 text-accent" />
            <h1 className="text-3xl font-bold font-serif text-primary" style={{ fontFamily: "'Playfair Display', serif" }}>Analytics & Insights</h1>
          </div>
          <p className="text-text/70">
            Understand your patterns and track your wellness journey
          </p>
        </motion.div>

        {/* Time range selector */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-center space-x-2"
        >
          <span className="text-sm font-medium text-text">Time Range:</span>
          {[7, 14, 30, 90].map((days) => (
            <motion.button
              key={days}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setTimeRange(days)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                timeRange === days
                  ? 'gradient-primary text-white'
                  : 'glass-card hover:bg-white/10 text-text'
              }`}
            >
              {days} days
            </motion.button>
          ))}
        </motion.div>

        {isLoading ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-text/60">Loading analytics...</p>
          </motion.div>
        ) : (
          <>
            {/* Analytics cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MoodAnalyticsCard />
              <TaskAnalyticsCard />
            </div>

            {/* Insights */}
            <InsightsCard />

            {/* Summary card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-reflect p-6 gradient-card"
            >
              <div className="flex items-center space-x-2 mb-4">
                <Brain className="w-5 h-5 text-accent" />
                <h3 className="text-lg font-semibold font-serif text-primary">Wellness Summary</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="text-center"
                >
                  <div className="text-2xl mb-2">
                    {moodAnalytics ? getMoodEmoji(Math.round(moodAnalytics.average_mood)) : '😊'}
                  </div>
                  <div className="font-medium text-text">Overall Mood</div>
                  <div className="text-sm text-text/60">
                    {moodAnalytics 
                      ? getMoodLabel(Math.round(moodAnalytics.average_mood))
                      : 'No data yet'
                    }
                  </div>
                </motion.div>

                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="text-center"
                >
                  <div className="text-2xl mb-2">🎯</div>
                  <div className="font-medium text-text">Task Progress</div>
                  <div className="text-sm text-text/60">
                    {taskAnalytics 
                      ? `${Math.round(taskAnalytics.completion_rate * 100)}% completion`
                      : 'No tasks yet'
                    }
                  </div>
                </motion.div>

                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="text-center"
                >
                  <div className="text-2xl mb-2">📈</div>
                  <div className="font-medium text-text">Growth Trend</div>
                  <div className="text-sm text-text/60">
                    {moodAnalytics?.mood_trend === 'improving' 
                      ? 'Improving'
                      : moodAnalytics?.mood_trend === 'stable'
                      ? 'Stable'
                      : moodAnalytics?.mood_trend === 'declining'
                      ? 'Needs attention'
                      : 'Getting started'
                    }
                  </div>
                </motion.div>
              </div>

              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="mt-6 p-4 glass-card rounded-lg border border-white/20"
              >
                <h4 className="font-medium text-text mb-2">🌱 Keep Growing</h4>
                <p className="text-sm text-text/70">
                  Your mental wellness journey is unique. These insights help you understand your patterns 
                  and celebrate your progress. Remember, small consistent steps lead to meaningful change.
                </p>
              </motion.div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
};

export default Analytics;
