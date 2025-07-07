import React, { useState, useEffect } from 'react';
import { Settings, User, Brain, Globe, Shield, Download, Upload, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// API and utilities
import { apiService } from '../utils/api';
import { ChatSettings, PersonalityModes } from '../types';
import { saveToLocalStorage, loadFromLocalStorage } from '../utils/helpers';
import { generateWellnessPDF } from '../utils/pdfExport';

interface SettingsPanelProps {
  settings: ChatSettings;
  onUpdateSettings: (newSettings: Partial<ChatSettings>) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, onUpdateSettings }) => {
  const [personalityModes, setPersonalityModes] = useState<PersonalityModes>({});
  const [isLoadingModes, setIsLoadingModes] = useState(false);
  const [activeSection, setActiveSection] = useState<'personality' | 'language' | 'privacy' | 'data'>('personality');

  // Load personality modes
  useEffect(() => {
    loadPersonalityModes();
  }, []);

  const loadPersonalityModes = async () => {
    setIsLoadingModes(true);
    try {
      const response = await apiService.getPersonalityModes();
      setPersonalityModes(response.modes);
    } catch (error) {
      console.error('Error loading personality modes:', error);
    } finally {
      setIsLoadingModes(false);
    }
  };

  // Handle personality mode change
  const handlePersonalityChange = async (mode: string) => {
    try {
      await apiService.setPersonalityMode(mode);
      onUpdateSettings({ personality_mode: mode });
      toast.success(`Switched to ${personalityModes[mode]?.name} mode`);
    } catch (error) {
      toast.error('Failed to change personality mode');
      console.error('Error changing personality mode:', error);
    }
  };

  // Handle settings toggle
  const handleToggleSetting = (key: keyof ChatSettings) => {
    const newValue = !settings[key];
    onUpdateSettings({ [key]: newValue });
    toast.success(`${key.replace('_', ' ')} ${newValue ? 'enabled' : 'disabled'}`);
  };

  // Export data as beautiful PDF
  const handleExportData = async () => {
    try {
      const messages = loadFromLocalStorage('mental_wellness_chat_messages', []);
      
      const pdfData = {
        messages,
        settings,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };

      toast.loading('Generating beautiful PDF report...', { duration: 3000 });
      
      const pdfBlob = await generateWellnessPDF(pdfData);
      
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mental-wellness-report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Beautiful PDF report generated successfully! 📄✨');
    } catch (error) {
      toast.error('Failed to generate PDF report');
      console.error('Error generating PDF:', error);
    }
  };

  // Import data
  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        if (data.settings) {
          onUpdateSettings(data.settings);
        }
        
        if (data.messages) {
          saveToLocalStorage('mental_wellness_chat_messages', data.messages);
        }

        toast.success('Data imported successfully');
        setTimeout(() => window.location.reload(), 1000);
      } catch (error) {
        toast.error('Failed to import data - invalid file format');
        console.error('Error importing data:', error);
      }
    };
    reader.readAsText(file);
  };

  // Clear all data
  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      localStorage.clear();
      toast.success('All data cleared');
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  // Section navigation
  const sections = [
    { id: 'personality' as const, label: 'AI Personality', icon: Brain },
    { id: 'language' as const, label: 'Language & Features', icon: Globe },
    { id: 'privacy' as const, label: 'Privacy & Safety', icon: Shield },
    { id: 'data' as const, label: 'Data Management', icon: Download },
  ];

  // Personality settings section
  const PersonalitySection = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-lg font-semibold font-serif text-primary mb-2">AI Personality Modes</h3>
        <p className="text-text/70 mb-4">
          Choose how your AI companion communicates and supports you.
        </p>
      </div>

      {isLoadingModes ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8"
        >
          <RefreshCw className="w-6 h-6 animate-spin text-accent mx-auto mb-2" />
          <p className="text-text/60">Loading personality modes...</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(personalityModes).map(([modeId, mode], index) => (
            <motion.div
              key={modeId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => handlePersonalityChange(modeId)}
              className={`
                p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                ${settings.personality_mode === modeId
                  ? 'border-primary bg-primary/10 shadow-lg'
                  : 'border-white/20 glass-card hover:shadow-md hover:border-primary/30'
                }
              `}
            >
              <div className="flex items-start space-x-3">
                <span className="text-2xl">{mode.emoji}</span>
                <div className="flex-1">
                  <h4 className="font-medium text-text mb-1">{mode.name}</h4>
                  <p className="text-sm text-text/70 mb-2">{mode.description}</p>
                  
                  <div className="text-xs text-text/50">
                    <p><strong>Specialties:</strong> {mode.specialties.slice(0, 2).join(', ')}</p>
                  </div>

                  {settings.personality_mode === modeId && (
                    <div className="mt-2 text-xs text-primary font-medium">
                      ✓ Currently Active
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );

  // Language and features section
  const LanguageSection = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-lg font-semibold font-serif text-primary mb-2">Language & Features</h3>
        <p className="text-text/70 mb-4">
          Customize your experience and enable helpful features.
        </p>
      </div>

      {/* Language selection */}
      <div>
        <label className="block text-sm font-medium text-text mb-2">
          Language
        </label>
        <select
          value={settings.language}
          onChange={(e) => onUpdateSettings({ language: e.target.value as any })}
          className="input-reflect max-w-xs"
        >
          <option value="english">English</option>
          <option value="sinhala">Sinhala (සිංහල)</option>
          <option value="tamil">Tamil (தமிழ்)</option>
        </select>
      </div>

      {/* Feature toggles */}
      <div className="space-y-4">
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="flex items-center justify-between p-4 glass-card rounded-lg border border-white/20"
        >
          <div>
            <h4 className="font-medium text-text">Sentiment Analysis</h4>
            <p className="text-sm text-text/70">Show emotional insights for your messages</p>
          </div>
          <button
            onClick={() => handleToggleSetting('show_sentiment_analysis')}
            className={`
              relative inline-flex h-6 w-11 items-center rounded-full transition-colors
              ${settings.show_sentiment_analysis ? 'bg-primary' : 'bg-text/30'}
            `}
          >
            <span
              className={`
                inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                ${settings.show_sentiment_analysis ? 'translate-x-6' : 'translate-x-1'}
              `}
            />
          </button>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="flex items-center justify-between p-4 glass-card rounded-lg border border-white/20"
        >
          <div>
            <h4 className="font-medium text-text">Auto-save Reflections</h4>
            <p className="text-sm text-text/70">Automatically save your reflections to memory</p>
          </div>
          <button
            onClick={() => handleToggleSetting('auto_save_reflections')}
            className={`
              relative inline-flex h-6 w-11 items-center rounded-full transition-colors
              ${settings.auto_save_reflections ? 'bg-primary' : 'bg-text/30'}
            `}
          >
            <span
              className={`
                inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                ${settings.auto_save_reflections ? 'translate-x-6' : 'translate-x-1'}
              `}
            />
          </button>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="flex items-center justify-between p-4 glass-card rounded-lg border border-white/20"
        >
          <div>
            <h4 className="font-medium text-text">Mood Tracking</h4>
            <p className="text-sm text-text/70">Enable mood logging and analytics</p>
          </div>
          <button
            onClick={() => handleToggleSetting('enable_mood_tracking')}
            className={`
              relative inline-flex h-6 w-11 items-center rounded-full transition-colors
              ${settings.enable_mood_tracking ? 'bg-primary' : 'bg-text/30'}
            `}
          >
            <span
              className={`
                inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                ${settings.enable_mood_tracking ? 'translate-x-6' : 'translate-x-1'}
              `}
            />
          </button>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="flex items-center justify-between p-4 glass-card rounded-lg border border-tertiary/30 bg-tertiary/10"
        >
          <div>
            <h4 className="font-medium text-text">Crisis Detection</h4>
            <p className="text-sm text-text/70">Detect crisis situations and provide resources</p>
          </div>
          <button
            onClick={() => handleToggleSetting('crisis_detection')}
            className={`
              relative inline-flex h-6 w-11 items-center rounded-full transition-colors
              ${settings.crisis_detection ? 'bg-primary' : 'bg-text/30'}
            `}
          >
            <span
              className={`
                inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                ${settings.crisis_detection ? 'translate-x-6' : 'translate-x-1'}
              `}
            />
          </button>
        </motion.div>
      </div>
    </motion.div>
  );

  // Privacy section
  const PrivacySection = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-lg font-semibold font-serif text-primary mb-2">Privacy & Safety</h3>
        <p className="text-text/70 mb-4">
          Learn about how your data is handled and protected.
        </p>
      </div>

      <div className="space-y-4">
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="p-4 glass-card border border-secondary/30 rounded-lg bg-secondary/10"
        >
          <div className="flex items-center space-x-2 mb-2">
            <Shield className="w-5 h-5 text-secondary" />
            <h4 className="font-medium text-text">Local Storage</h4>
          </div>
          <p className="text-sm text-text/70">
            All your conversations and data are stored locally on your device. Nothing is sent to external servers 
            except for AI responses, which don't include your personal information.
          </p>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="p-4 glass-card border border-primary/30 rounded-lg bg-primary/10"
        >
          <div className="flex items-center space-x-2 mb-2">
            <Shield className="w-5 h-5 text-primary" />
            <h4 className="font-medium text-text">Data Encryption</h4>
          </div>
          <p className="text-sm text-text/70">
            Your data is encrypted in transit when communicating with AI services. 
            Local storage uses browser security features.
          </p>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="p-4 glass-card border border-accent/30 rounded-lg bg-accent/10"
        >
          <div className="flex items-center space-x-2 mb-2">
            <Shield className="w-5 h-5 text-accent" />
            <h4 className="font-medium text-text">No Personal Data Collection</h4>
          </div>
          <p className="text-sm text-text/70">
            We don't collect personal information, track your identity, or store your conversations 
            on our servers. Your privacy is our priority.
          </p>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="p-4 glass-card border border-red-400/30 rounded-lg bg-red-400/10"
        >
          <div className="flex items-center space-x-2 mb-2">
            <Shield className="w-5 h-5 text-red-400" />
            <h4 className="font-medium text-text">Crisis Support</h4>
          </div>
          <p className="text-sm text-text/70 mb-2">
            When crisis indicators are detected, we provide immediate resources but do not contact 
            anyone on your behalf unless you explicitly request it.
          </p>
          <div className="text-xs text-text/60 space-y-1">
            <p><strong>Crisis Text Line:</strong> Text HOME to 0741741257</p>
            <p><strong>1333 Suicide & Crisis Lifeline:</strong> Call 1333</p>
            
          </div>
        </motion.div>
      </div>
    </motion.div>
  );

  // Data management section
  const DataSection = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-lg font-semibold font-serif text-primary mb-2">Data Management</h3>
        <p className="text-text/70 mb-4">
          Export, import, or clear your personal data.
        </p>
      </div>

      <div className="space-y-4">
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="p-4 glass-card rounded-lg border border-white/20"
        >
          <h4 className="font-medium text-text mb-2">Export Your Wellness Report</h4>
          <p className="text-sm text-text/70 mb-3">
            Generate a beautiful, detailed PDF report with your conversations, sentiment analysis, and wellness insights.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExportData}
            className="btn-reflect-secondary flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Generate PDF Report</span>
          </motion.button>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="p-4 glass-card rounded-lg border border-white/20"
        >
          <h4 className="font-medium text-text mb-2">Import Data</h4>
          <p className="text-sm text-text/70 mb-3">
            Restore your data from a previously exported file.
          </p>
          <div className="flex items-center space-x-2">
            <input
              type="file"
              accept=".json"
              onChange={handleImportData}
              className="hidden"
              id="import-data"
            />
            <label
              htmlFor="import-data"
              className="btn-reflect-secondary flex items-center space-x-2 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Import Data</span>
            </label>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="p-4 glass-card border border-red-400/30 rounded-lg bg-red-400/10"
        >
          <h4 className="font-medium text-text mb-2">Clear All Data</h4>
          <p className="text-sm text-text/70 mb-3">
            Permanently delete all your data, including conversations, settings, and analytics. 
            This action cannot be undone.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleClearData}
            className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All Data</span>
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'personality':
        return <PersonalitySection />;
      case 'language':
        return <LanguageSection />;
      case 'privacy':
        return <PrivacySection />;
      case 'data':
        return <DataSection />;
      default:
        return <PersonalitySection />;
    }
  };

  return (
    <div className="h-full bg-background overflow-y-auto">
      <div className="container-wellness py-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2 mb-8"
        >
          <div className="flex items-center justify-center space-x-2">
            <Settings className="w-8 h-8 text-accent" />
            <h1 className="text-3xl font-bold font-serif text-primary" style={{ fontFamily: "'Playfair Display', serif" }}>Settings</h1>
          </div>
          <p className="text-text/70">
            Customize your mental wellness AI experience
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Navigation */}
          <div className="lg:col-span-1">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="card-reflect p-4 space-y-2"
            >
              {sections.map((section, index) => {
                const Icon = section.icon;
                return (
                  <motion.button
                    key={section.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveSection(section.id)}
                    className={`
                      w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-all duration-200
                      ${activeSection === section.id
                        ? 'gradient-primary text-white'
                        : 'text-text/70 hover:text-text hover:bg-white/10'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{section.label}</span>
                  </motion.button>
                );
              })}
            </motion.div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-reflect p-6"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSection}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {renderActiveSection()}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
