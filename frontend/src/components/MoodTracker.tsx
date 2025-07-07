import React, { useState, useEffect } from 'react';
import { Heart, TrendingUp, Calendar, Plus, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// API and utilities
import { apiService } from '../utils/api';
import { MoodEntry, MoodAnalytics } from '../types';
import { getMoodEmoji, getMoodLabel, getMoodColor, formatRelativeTime } from '../utils/helpers';

const MoodTracker: React.FC = () => {
  const [currentMood, setCurrentMood] = useState<number | null>(null);
  const [moodNote, setMoodNote] = useState('');
  const [isLogging, setIsLogging] = useState(false);
  const [recentEntries, setRecentEntries] = useState<MoodEntry[]>([]);
  const [analytics, setAnalytics] = useState<MoodAnalytics | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  // Load recent mood data
  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setIsLoadingAnalytics(true);
    try {
      const data = await apiService.getMoodAnalytics(7);
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading mood analytics:', error);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  // Handle mood logging
  const handleLogMood = async () => {
    if (currentMood === null) {
      toast.error('Please select a mood level');
      return;
    }

    setIsLogging(true);
    try {
      const entry = await apiService.logMood(currentMood, moodNote);
      
      toast.success('Mood logged successfully! 🌟');
      
      // Reset form
      setCurrentMood(null);
      setMoodNote('');
      
      // Reload analytics
      await loadAnalytics();
      
    } catch (error) {
      toast.error('Failed to log mood. Please try again.');
      console.error('Error logging mood:', error);
    } finally {
      setIsLogging(false);
    }
  };

  // Mood selector component
  const MoodSelector = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-text text-center">
        How are you feeling right now?
      </h3>
      
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((value) => (
          <motion.button
            key={value}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCurrentMood(value)}
            className={`
              flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-200
              ${currentMood === value
                ? 'gradient-primary text-white scale-110 shadow-lg'
                : 'glass-card hover:bg-white/10 hover:shadow-md'
              }
              focus:outline-none focus:ring-2 focus:ring-primary
            `}
          >
            <span className="text-2xl mb-1">{getMoodEmoji(value)}</span>
            <span className="text-xs font-medium">{value}</span>
          </motion.button>
        ))}
      </div>
      
      <AnimatePresence>
        {currentMood && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center"
          >
            <p className="text-lg font-medium text-text">
              {getMoodEmoji(currentMood)} {getMoodLabel(currentMood)}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // Recent entries component
  const RecentEntries = () => {
    if (!analytics?.daily_summary || analytics.daily_summary.length === 0) {
      return (
        <div className="text-center py-8">
          <Heart className="w-12 h-12 text-text/30 mx-auto mb-4" />
          <p className="text-text/60">No mood entries yet. Start tracking your mood today!</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {analytics.daily_summary.slice(0, 5).map((day, index) => (
          <motion.div 
            key={day.date} 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between p-3 glass-card"
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{getMoodEmoji(Math.round(day.average_mood))}</span>
              <div>
                <div className="font-medium text-text">
                  {new Date(day.date).toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </div>
                <div className="text-sm text-text/60">
                  {day.entries} {day.entries === 1 ? 'entry' : 'entries'}
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className={`text-sm px-2 py-1 rounded-full ${getMoodColor(Math.round(day.average_mood))}`}>
                {getMoodLabel(Math.round(day.average_mood))}
              </div>
              <div className="text-xs text-text/50 mt-1">
                Avg: {typeof day.average_mood === 'number' ? day.average_mood.toFixed(1) : 'N/A'}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  // Analytics summary component
  const AnalyticsSummary = () => {
    if (!analytics) return null;

    return (
      <div className="grid grid-cols-2 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4"
        >
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <span className="font-medium text-text">Average Mood</span>
          </div>
          <div className="text-2xl font-bold text-primary">
            {typeof analytics.average_mood === 'number' ? analytics.average_mood.toFixed(1) : 'N/A'}
          </div>
          <div className="text-sm text-text/70">
            {getMoodLabel(Math.round(analytics.average_mood))}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-4"
        >
          <div className="flex items-center space-x-2 mb-2">
            <Calendar className="w-5 h-5 text-secondary" />
            <span className="font-medium text-text">Entries</span>
          </div>
          <div className="text-2xl font-bold text-secondary">
            {analytics.total_entries}
          </div>
          <div className="text-sm text-text/70">
            Last 7 days
          </div>
        </motion.div>
      </div>
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
            <Heart className="w-8 h-8 text-accent" />
            <h1 className="text-3xl font-bold font-serif text-primary" style={{ fontFamily: "'Playfair Display', serif" }}>Mood Tracker</h1>
          </div>
          <p className="text-text/70">
            Track your emotional wellbeing and discover patterns over time
          </p>
        </motion.div>

        {/* Quick stats */}
        <AnimatePresence>
          {analytics && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card-reflect p-6"
            >
              <AnalyticsSummary />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mood logging */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-reflect p-6"
        >
          <div className="flex items-center space-x-2 mb-6">
            <Plus className="w-5 h-5 text-accent" />
            <h2 className="text-xl font-semibold font-serif text-primary" style={{ fontFamily: "'Playfair Display', serif" }}>Log Your Mood</h2>
          </div>

          <MoodSelector />

          {/* Note input */}
          <div className="mt-6 space-y-3">
            <label className="block text-sm font-medium text-text">
              How are you feeling? (optional)
            </label>
            <textarea
              value={moodNote}
              onChange={(e) => setMoodNote(e.target.value)}
              placeholder="What's on your mind? Any specific reasons for your mood today?"
              className="input-reflect resize-none"
              rows={3}
            />
          </div>

          {/* Submit button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogMood}
            disabled={currentMood === null || isLogging}
            className={`
              w-full mt-6 py-3 px-6 rounded-xl font-medium transition-all duration-200
              ${currentMood !== null && !isLogging
                ? 'btn-reflect'
                : 'bg-text/20 text-text/40 cursor-not-allowed'
              }
              focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
            `}
          >
            {isLogging ? 'Logging...' : 'Log Mood'}
          </motion.button>
        </motion.div>

        {/* Recent entries */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card-reflect p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold font-serif text-primary" style={{ fontFamily: "'Playfair Display', serif" }}>Recent Entries</h2>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={loadAnalytics}
              disabled={isLoadingAnalytics}
              className="text-primary hover:text-primary/80 text-sm font-medium transition-colors"
            >
              {isLoadingAnalytics ? 'Loading...' : 'Refresh'}
            </motion.button>
          </div>

          <RecentEntries />
        </motion.div>

        {/* Insights */}
        <AnimatePresence>
          {analytics && analytics.insights && analytics.insights.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="card-reflect p-6"
            >
              <div className="flex items-center space-x-2 mb-4">
                <Sparkles className="w-5 h-5 text-accent" />
                <h2 className="text-xl font-semibold font-serif text-primary" style={{ fontFamily: "'Playfair Display', serif" }}>Insights</h2>
              </div>

              <div className="space-y-3">
                {analytics.insights.map((insight, index) => (
                  <motion.div 
                    key={index} 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 glass-card border border-accent/20"
                  >
                    <p className="text-text">{insight}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recommendations */}
        <AnimatePresence>
          {analytics && analytics.recommendations && analytics.recommendations.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="card-reflect p-6"
            >
              <h2 className="text-xl font-semibold font-serif text-primary mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Recommendations</h2>

              <div className="space-y-3">
                {analytics.recommendations.map((recommendation, index) => (
                  <motion.div 
                    key={index} 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start space-x-3 p-3 glass-card"
                  >
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-text text-sm">{recommendation}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Helpful tips */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card-reflect p-6 gradient-accent"
        >
          <h3 className="font-semibold font-serif text-primary mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>💡 Mood Tracking Tips</h3>
          <div className="space-y-2 text-sm text-white/90">
            <p>• Log your mood at the same time each day for better patterns</p>
            <p>• Include notes about what influenced your mood</p>
            <p>• Look for patterns in your weekly summaries</p>
            <p>• Remember that mood fluctuations are completely normal</p>
            <p>• Use insights to identify your wellness strategies</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default MoodTracker;
