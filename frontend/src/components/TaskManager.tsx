import React, { useState, useEffect } from 'react';
import { CheckCircle, Plus, Calendar, Tag, Trash2, Edit3, Clock, Star } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// API and utilities
import { apiService } from '../utils/api';
import { Task, TaskCategory } from '../types';
import { 
  getTaskPriorityColor, 
  getTaskCategoryIcon, 
  getTaskStatusColor, 
  isTaskOverdue,
  formatRelativeTime 
} from '../utils/helpers';

const TaskManager: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as const,
    category: 'personal' as TaskCategory,
    due_date: '',
    wellness_impact: 'neutral' as const,
  });

  // Load tasks on mount
  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setIsLoading(true);
    try {
      const data = await apiService.getTasks();
      setTasks(data);
    } catch (error) {
      toast.error('Failed to load tasks');
      console.error('Error loading tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle task creation
  const handleCreateTask = async () => {
    if (!newTask.title.trim()) {
      toast.error('Please enter a task title');
      return;
    }

    try {
      const task = await apiService.createTask(newTask);
      setTasks(prev => [task, ...prev]);
      setNewTask({
        title: '',
        description: '',
        priority: 'medium',
        category: 'personal',
        due_date: '',
        wellness_impact: 'neutral',
      });
      setShowAddForm(false);
      toast.success('Task created successfully! 🎯');
    } catch (error) {
      toast.error('Failed to create task');
      console.error('Error creating task:', error);
    }
  };

  // Handle task completion toggle
  const handleToggleComplete = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    
    try {
      const updatedTask = await apiService.updateTask(taskId, { status: newStatus });
      setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
      
      if (newStatus === 'completed') {
        toast.success('Task completed! Great job! 🎉');
      } else {
        toast.success('Task moved back to pending');
      }
    } catch (error) {
      toast.error('Failed to update task');
      console.error('Error updating task:', error);
    }
  };

  // Handle task deletion
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      await apiService.deleteTask(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
      toast.success('Task deleted');
    } catch (error) {
      toast.error('Failed to delete task');
      console.error('Error deleting task:', error);
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    return task.status === filter;
  });

  // Task categories for form
  const taskCategories: { value: TaskCategory; label: string; icon: string }[] = [
    { value: 'self_care', label: 'Self Care', icon: '🌸' },
    { value: 'mindfulness', label: 'Mindfulness', icon: '🧘‍♀️' },
    { value: 'exercise', label: 'Exercise', icon: '💪' },
    { value: 'social', label: 'Social', icon: '👥' },
    { value: 'work', label: 'Work', icon: '💼' },
    { value: 'personal', label: 'Personal', icon: '👤' },
    { value: 'health', label: 'Health', icon: '❤️' },
    { value: 'learning', label: 'Learning', icon: '📚' },
    { value: 'creative', label: 'Creative', icon: '🎨' },
    { value: 'household', label: 'Household', icon: '🏠' },
  ];

  // Add task form
  const AddTaskForm = () => (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="card-reflect p-6 mb-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold font-serif text-primary">Add New Task</h3>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowAddForm(false)}
          className="text-text/60 hover:text-text"
        >
          ✕
        </motion.button>
      </div>

      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-text mb-2">
            Task Title *
          </label>
          <input
            type="text"
            value={newTask.title}
            onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
            placeholder="What would you like to accomplish?"
            className="input-reflect"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-text mb-2">
            Description
          </label>
          <textarea
            value={newTask.description}
            onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Add more details about this task..."
            className="input-reflect resize-none"
            rows={3}
          />
        </div>

        {/* Category and Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              Category
            </label>
            <select
              value={newTask.category}
              onChange={(e) => setNewTask(prev => ({ ...prev, category: e.target.value as TaskCategory }))}
              className="input-reflect"
            >
              {taskCategories.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">
              Priority
            </label>
            <select
              value={newTask.priority}
              onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value as any }))}
              className="input-reflect"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        {/* Due Date and Wellness Impact */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              Due Date (optional)
            </label>
            <input
              type="date"
              value={newTask.due_date}
              onChange={(e) => setNewTask(prev => ({ ...prev, due_date: e.target.value }))}
              className="input-reflect"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">
              Wellness Impact
            </label>
            <select
              value={newTask.wellness_impact}
              onChange={(e) => setNewTask(prev => ({ ...prev, wellness_impact: e.target.value as any }))}
              className="input-reflect"
            >
              <option value="positive">Positive - Improves wellbeing</option>
              <option value="neutral">Neutral - Routine task</option>
              <option value="challenging">Challenging - May be stressful</option>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3 pt-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCreateTask}
            className="btn-reflect flex-1"
          >
            Create Task
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAddForm(false)}
            className="btn-reflect-secondary"
          >
            Cancel
          </motion.button>
        </div>
      </div>
    </motion.div>
  );

  // Task card component
  const TaskCard: React.FC<{ task: Task }> = ({ task }) => {
    const overdue = isTaskOverdue(task);

    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`
          task-card task-priority-${task.priority}
          ${task.status === 'completed' ? 'opacity-75' : ''}
          ${overdue ? 'border-red-400/30 bg-red-400/10' : ''}
        `}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            {/* Complete button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleToggleComplete(task.id, task.status)}
              className={`
                mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
                ${task.status === 'completed'
                  ? 'bg-green-400 border-green-400'
                  : 'border-text/30 hover:border-green-400'
                }
              `}
            >
              {task.status === 'completed' && (
                <CheckCircle className="w-3 h-3 text-white" />
              )}
            </motion.button>

            {/* Task content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className={`
                  font-medium text-text
                  ${task.status === 'completed' ? 'line-through text-text/50' : ''}
                `}>
                  {task.title}
                </h3>
                <span className="text-lg">{getTaskCategoryIcon(task.category)}</span>
              </div>

              {task.description && (
                <p className="text-sm text-text/70 mb-2">{task.description}</p>
              )}

              {/* Tags */}
              <div className="flex items-center space-x-2 mb-2">
                <span className={`text-xs px-2 py-1 rounded-full ${getTaskPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>
                
                <span className={`text-xs px-2 py-1 rounded-full ${getTaskStatusColor(task.status)}`}>
                  {task.status}
                </span>

                {task.wellness_impact !== 'neutral' && (
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    task.wellness_impact === 'positive' ? 'text-green-400 bg-green-400/20' : 'text-orange-400 bg-orange-400/20'
                  }`}>
                    {task.wellness_impact}
                  </span>
                )}

                {overdue && (
                  <span className="text-xs px-2 py-1 rounded-full text-red-400 bg-red-400/20">
                    Overdue
                  </span>
                )}
              </div>

              {/* Meta info */}
              <div className="flex items-center space-x-4 text-xs text-text/50">
                {task.due_date && (
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(task.due_date).toLocaleDateString()}</span>
                  </div>
                )}
                
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatRelativeTime(task.created_at)}</span>
                </div>

                <div className="flex items-center space-x-1">
                  <Tag className="w-3 h-3" />
                  <span>{task.category.replace('_', ' ')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-1 ml-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleDeleteTask(task.id)}
              className="p-1 text-text/40 hover:text-red-400 rounded transition-colors"
              title="Delete task"
            >
              <Trash2 className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        {/* Wellness suggestions */}
        {task.wellness_suggestions && task.wellness_suggestions.length > 0 && (
          <div className="mt-3 pt-3 border-t border-white/20">
            <div className="flex items-center space-x-1 mb-2">
              <Star className="w-3 h-3 text-accent" />
              <span className="text-xs font-medium text-text/70">Wellness Tips:</span>
            </div>
            <div className="text-xs text-text/60">
              {task.wellness_suggestions[0]}
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
            <CheckCircle className="w-8 h-8 text-accent" />
            <h1 className="text-3xl font-bold font-serif text-primary" style={{ fontFamily: "'Playfair Display', serif" }}>
              Task Manager
            </h1>
          </div>
          <p className="text-text/70">
            Manage your wellness-focused goals and daily tasks
          </p>
        </motion.div>

        {/* Controls */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                filter === 'all' ? 'gradient-primary text-white' : 'glass-card hover:bg-white/10 text-text'
              }`}
            >
              All Tasks ({tasks.length})
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                filter === 'pending' ? 'gradient-primary text-white' : 'glass-card hover:bg-white/10 text-text'
              }`}
            >
              Pending ({tasks.filter(t => t.status === 'pending').length})
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                filter === 'completed' ? 'gradient-primary text-white' : 'glass-card hover:bg-white/10 text-text'
              }`}
            >
              Completed ({tasks.filter(t => t.status === 'completed').length})
            </motion.button>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-reflect flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </motion.button>
        </motion.div>

        {/* Add task form */}
        <AnimatePresence>
          {showAddForm && <AddTaskForm />}
        </AnimatePresence>

        {/* Tasks list */}
        <div className="space-y-4">
          {isLoading ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-text/60 mt-2">Loading tasks...</p>
            </motion.div>
          ) : filteredTasks.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-8"
            >
              <CheckCircle className="w-12 h-12 text-text/30 mx-auto mb-4" />
              <p className="text-text/60">
                {filter === 'all' 
                  ? 'No tasks yet. Create your first wellness goal!'
                  : `No ${filter} tasks found.`
                }
              </p>
            </motion.div>
          ) : (
            filteredTasks.map((task, index) => (
              <TaskCard key={task.id} task={task} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskManager;
