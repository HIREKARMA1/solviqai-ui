"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Sparkles, Target, Brain, Lightbulb, Rocket,
  Trophy, TrendingUp, CheckCircle, MessageCircle, Loader2,
  Mic, MicOff, Volume2, VolumeX, PlayCircle, Workflow, Calendar,
  AlertCircle, RefreshCw, Wifi, WifiOff
} from 'lucide-react';
import { MarkerType } from 'reactflow';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ProgressLoader } from '@/components/ui/progress-loader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { api } from '@/lib/api';
import { config } from '@/lib/config';
import { toast } from 'sonner';
import CareerTreeVisualization from '@/components/career-guidance/CareerTreeVisualization';
import CareerPlaylistTab from '@/components/career-guidance/CareerPlaylistTab';
import CareerCalendarTab from '@/components/career-guidance/CareerCalendarTab';
import SessionHistoryModal from '@/components/career-guidance/SessionHistoryModal';

interface Message {
  role: 'ai' | 'user';
  content: string;
  timestamp: string;
}

export default function CareerGuidancePage() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [loadingPercentage, setLoadingPercentage] = useState(0);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [currentStage, setCurrentStage] = useState('introduction');
  const [activeTab, setActiveTab] = useState('playlist');
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const [error, setError] = useState<string | null>(null);

  // Flowchart state
  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);

  // SSE (Server-Sent Events)
  const eventSourceRef = useRef<EventSource | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sound toggle
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Get SSE URL from config
  const getSSEUrl = useCallback((sessionId: string) => {
    const baseUrl = config.api.baseUrl.replace(/\/+$/, ''); // Remove trailing slash
    const token = localStorage.getItem('access_token');
    // Add token as query parameter for authentication
    const url = `${baseUrl}/api/v1/career-guidance/sse/${sessionId}`;
    return token ? `${url}?token=${encodeURIComponent(token)}` : url;
  }, []);

  // Scroll to bottom of messages
  const scrollToBottom = useCallback((force = false) => {
    requestAnimationFrame(() => {
      setTimeout(() => {
        if (messagesEndRef.current) {
          const messagesContainer = messagesEndRef.current.parentElement;
          if (messagesContainer) {
            const isNearBottom = messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight < 100;
            if (force || isNearBottom) {
              messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
          } else {
            messagesEndRef.current.scrollIntoView({ behavior: force ? 'auto' : 'smooth', block: 'end' });
          }
        }
      }, force ? 0 : 150);
    });
  }, []);

  useEffect(() => {
    scrollToBottom(true);
  }, [messages, isTyping, scrollToBottom]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  const [showHistory, setShowHistory] = useState(false);

  const loadSession = async (id: string) => {
    try {
      setIsInitializing(true);
      setError(null);
      const data = await api.careerGuidance.getSession(id);
      setSessionId(data.session_id);
      setMessages(data.conversation_history || []);
      setNodes(data.flowchart_nodes || []);
      setEdges(data.flowchart_edges || []);
      setCompletionPercentage(data.completion_percentage || 0);
      setCurrentStage(data.current_stage || 'introduction');

      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      connectSSE(data.session_id);
      toast.success('Session loaded successfully!');
    } catch (e: any) {
      console.error('Failed to load session', e);
      const errorMessage = e.response?.data?.detail || 'Failed to load session';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsInitializing(false);
    }
  };

  const startSession = async () => {
    setIsInitializing(true);
    setIsLoading(true);
    setLoadingPercentage(0);
    setError(null);

    // Animate progress during session initialization
    const initProgressInterval = setInterval(() => {
      setLoadingPercentage(prev => {
        if (prev >= 90) {
          return 90;
        }
        return prev + Math.random() * 20;
      });
    }, 150);

    try {
      const response = await api.careerGuidance.startSession({
        resume_included: false,
        preferred_language: 'en'
      });

      setSessionId(response.session_id);
      setMessages([{
        role: 'ai',
        content: response.welcome_message,
        timestamp: new Date().toISOString()
      }]);

      if (response.initial_nodes && response.initial_nodes.length > 0) {
        setNodes(response.initial_nodes);
      }
      if (response.initial_edges && response.initial_edges.length > 0) {
        setEdges(response.initial_edges);
      }

      connectSSE(response.session_id);

      // Complete to 100% when session starts
      clearInterval(initProgressInterval);
      setLoadingPercentage(100);

      toast.success('Career guidance session started!');

      // Reset progress after a short delay
      setTimeout(() => {
        setLoadingPercentage(0);
      }, 500);
    } catch (error: any) {
      clearInterval(initProgressInterval);
      setLoadingPercentage(0);
      const errorMessage = error.response?.data?.detail || 'Failed to start session. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Session start error:', error);
    } finally {
      setIsLoading(false);
      setIsInitializing(false);
    }
  };

  const connectSSE = useCallback((sessionId: string) => {
    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setConnectionStatus('connecting');

    try {
      const sseUrl = getSSEUrl(sessionId);
      const eventSource = new EventSource(sseUrl);

      eventSource.onopen = () => {
        setConnectionStatus('connected');
        console.log('SSE connected');
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Handle connection confirmation
          if (data.type === 'connected') {
            console.log('SSE connection confirmed');
            return;
          }

          if (data.type === 'typing') {
            setIsTyping(data.data.is_typing);
          } else if (data.type === 'message') {
            setMessages(prev => [...prev, {
              role: 'ai',
              content: data.data.content,
              timestamp: new Date().toISOString()
            }]);
            scrollToBottom(true);
          } else if (data.type === 'update_flowchart') {
            setNodes(data.data.nodes || []);
            setEdges(data.data.edges || []);
          } else if (data.type === 'error') {
            toast.error(data.message || 'An error occurred');
            setError(data.message || 'An error occurred');
          }
        } catch (e) {
          console.error('Error parsing SSE message:', e);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        setConnectionStatus('disconnected');
        // EventSource automatically reconnects, but we'll handle errors
        if (eventSource.readyState === EventSource.CLOSED) {
          toast.error('Connection lost. EventSource will attempt to reconnect.');
          setError('Connection lost. EventSource will attempt to reconnect.');
        }
      };

      eventSourceRef.current = eventSource;
    } catch (error) {
      console.error('Failed to create EventSource:', error);
      setConnectionStatus('disconnected');
      toast.error('Failed to establish connection. Please refresh the page.');
      setError('Failed to establish connection. Please refresh the page.');
    }
  }, [getSSEUrl, scrollToBottom]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || !sessionId || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageToSend = inputMessage;
    setInputMessage('');
    setIsLoading(true);
    setIsTyping(true);
    setLoadingPercentage(0);
    setError(null);

    // Animate progress from 0 to 90% during request
    let progressInterval: NodeJS.Timeout | null = setInterval(() => {
      setLoadingPercentage(prev => {
        if (prev >= 90) {
          if (progressInterval) {
            clearInterval(progressInterval);
            progressInterval = null;
          }
          return 90;
        }
        return prev + Math.random() * 15; // Increment by random amount for natural feel
      });
    }, 100);

    try {
      const response = await api.careerGuidance.sendMessage({
        session_id: sessionId,
        message: messageToSend
      });

      // Complete to 100% when response received
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }
      setLoadingPercentage(100);

      const aiMessage: Message = {
        role: 'ai',
        content: response.ai_response,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMessage]);
      setTimeout(() => scrollToBottom(true), 200);

      const stageChanged = response.current_stage !== currentStage;
      if (stageChanged) {
        const newStageInfo = getStageInfo(response.current_stage);
        toast.success(`🎯 Moving to Stage ${newStageInfo.number}: ${newStageInfo.label}`, {
          description: newStageInfo.description,
          duration: 4000
        });
      }

      setCompletionPercentage(response.completion_percentage);
      setCurrentStage(response.current_stage);

      if (response.updated_nodes && response.updated_nodes.length > 0) {
        const previousNodeCount = nodes.length;
        const newNodeCount = response.updated_nodes.length - previousNodeCount;

        if (newNodeCount > 0) {
          toast.info(`✨ ${newNodeCount} new ${newNodeCount === 1 ? 'node' : 'nodes'} added to your career map!`, {
            duration: 3000
          });
        }

        const newNodes = response.updated_nodes.map((node: any, index: number) => ({
          id: node.id,
          type: 'custom',
          position: node.position,
          data: {
            ...node.data,
            animationDelay: index * 0.1
          }
        }));

        setTimeout(() => setNodes(newNodes), 100);
      }
      if (response.updated_edges && response.updated_edges.length > 0) {
        const newEdges = response.updated_edges.map((edge: any) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          animated: true,
          type: 'smoothstep',
          label: edge.label,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
            color: '#6366f1',
          },
          style: {
            strokeWidth: 3,
            stroke: '#6366f1',
            strokeDasharray: '5,5',
            animation: `dash 20s linear infinite`,
          },
          labelStyle: {
            fill: '#fff',
            fontWeight: 700,
            fontSize: 12,
          },
          labelBgStyle: {
            fill: '#1e293b',
            fillOpacity: 0.8,
          },
          labelBgPadding: [8, 4] as [number, number],
          labelBgBorderRadius: 8,
        }));

        setTimeout(() => setEdges(newEdges), 300);
      }

      if (soundEnabled) {
        playNotificationSound();
      }

    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to send message. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Send message error:', error);
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }
      setLoadingPercentage(0);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
      // Reset progress after a short delay
      setTimeout(() => {
        setLoadingPercentage(0);
      }, 500);
    }
  };

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Silently handle audio play failures (user might have blocked audio)
      });
    } catch (error) {
      // Silently handle audio errors
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleRetry = () => {
    if (sessionId) {
      connectSSE(sessionId);
    } else {
      startSession();
    }
  };

  // Scroll when typing indicator appears
  useEffect(() => {
    if (isTyping) {
      setTimeout(() => scrollToBottom(true), 100);
    }
  }, [isTyping, scrollToBottom]);

  const getStageInfo = (stage: string) => {
    const stageMap: Record<string, { label: string; icon: any; color: string; bgColor: string; description: string; number: number }> = {
      introduction: { label: 'Getting Started', icon: Rocket, color: 'text-blue-600', bgColor: 'bg-blue-500', description: 'Tell me about yourself', number: 1 },
      exploration: { label: 'Deep Exploration', icon: Lightbulb, color: 'text-yellow-600', bgColor: 'bg-yellow-500', description: 'Discovering your profile', number: 2 },
      recommendations: { label: 'Career Recommendations', icon: Target, color: 'text-green-600', bgColor: 'bg-green-500', description: 'Your perfect career paths!', number: 3 },
      roadmap: { label: 'Learning Roadmap', icon: TrendingUp, color: 'text-indigo-600', bgColor: 'bg-indigo-500', description: 'Your step-by-step plan', number: 4 },
    };
    return stageMap[stage] || stageMap.introduction;
  };

  // Start session on mount - only once
  useEffect(() => {
    let mounted = true;
    const initSession = async () => {
      if (mounted && !sessionId) {
        await startSession();
      }
    };
    initSession();

    return () => {
      mounted = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const StageIcon = getStageInfo(currentStage).icon;
  const stageInfo = getStageInfo(currentStage);

  if (isInitializing && !sessionId) {
    return (
      <DashboardLayout requiredUserType="student">
        <div className="flex items-center justify-center min-h-[600px] px-4">
          <ProgressLoader
            progress={loadingPercentage}
            message="Starting your career guidance session..."
            subtitle="This may take a few moments"
            showPercentage={true}
            size="lg"
            className="w-full max-w-md"
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredUserType="student">
      <div className="space-y-4 sm:space-y-6 px-3 sm:px-4 md:px-6 pt-28 sm:pt-36 lg:pt-0">
        {/* Header - Simplified */}
        <motion.div
          className="relative overflow-hidden rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 text-gray-900 dark:text-white border bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800"
        >
          {/* Decorative corners */}
          <motion.div
            className="pointer-events-none absolute -top-12 -right-12 w-40 h-40 sm:w-56 sm:h-56 rotate-45 bg-gradient-to-br from-primary-100/40 to-secondary-100/30 dark:from-primary-900/30 dark:to-secondary-900/20"
            animate={{ rotate: [45, 50, 45] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="pointer-events-none absolute -bottom-14 -left-14 w-48 h-48 sm:w-64 sm:h-64 rounded-full bg-gradient-to-tr from-secondary-100/30 to-accent-100/20 dark:from-secondary-900/20 dark:to-accent-900/10"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="relative z-10">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <motion.div
                className="p-1.5 sm:p-2 rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400 flex-shrink-0"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
              </motion.div>
              <motion.h1
                className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold gradient-text"
                animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                transition={{ duration: 3, repeat: Infinity }}
                style={{ backgroundSize: '200% 200%' }}
              >
                <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">AI Career Guidance</span>
              </motion.h1>
            </div>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
              Discover your perfect career path with personalized AI-powered guidance
            </p>
          </div>
        </motion.div>

        {/* Stats Cards Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
        >
          {/* Stage Info Card */}
          <Card className="border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Current Stage</div>
              <div className="flex items-center gap-2 sm:gap-3 mt-3 sm:mt-4">
                <div className={`p-2 sm:p-3 rounded-lg bg-gradient-to-br ${stageInfo.bgColor} to-indigo-500 shadow-lg flex-shrink-0`}>
                  <StageIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mb-1">Stage {stageInfo.number} of 4</div>
                  <div className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate">{stageInfo.label}</div>
                  <div className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 italic mt-1 line-clamp-1">{stageInfo.description}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress Card */}
          <Card className="border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Progress</div>
                <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{completionPercentage}%</div>
              </div>
              <Progress value={completionPercentage} className="h-2 sm:h-3 mt-3 sm:mt-4" />
              {currentStage === 'exploration' && (
                <div className="flex items-center gap-2 text-[10px] sm:text-xs text-yellow-600 dark:text-yellow-400 font-medium mt-2 sm:mt-3">
                  <Lightbulb className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="truncate">Learning about you...</span>
                </div>
              )}
              {currentStage === 'recommendations' && (
                <div className="flex items-center gap-2 text-[10px] sm:text-xs text-green-600 dark:text-green-400 font-medium mt-2 sm:mt-3 animate-pulse">
                  <Target className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="truncate">Generating recommendations...</span>
                </div>
              )}
              {currentStage === 'roadmap' && (
                <div className="flex items-center gap-2 text-[10px] sm:text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-2 sm:mt-3 animate-pulse">
                  <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="truncate">Creating roadmap...</span>
                </div>
              )}
              {currentStage === 'introduction' && (
                <div className="flex items-center gap-2 text-[10px] sm:text-xs text-blue-600 dark:text-blue-400 font-medium mt-2 sm:mt-3">
                  <Rocket className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="truncate">Getting started...</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions Card */}
          <Card className="border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-3 sm:mb-4">Quick Actions</div>
              <Button
                variant="outline"
                onClick={() => setShowHistory(true)}
                className="w-full text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 border-gray-300 dark:border-gray-600 rounded-lg h-9 sm:h-10"
                aria-label="Session history"
              >
                <Workflow className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                <span className="text-xs sm:text-sm font-medium">View History</span>
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Error Alert */}
        {error && (
          <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
            <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
              <span className="text-sm sm:text-base text-red-800 dark:text-red-200 flex-1">{error}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                className="w-full sm:w-auto border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/40"
              >
                <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          {/* Chat Interface - Left Column */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-5 flex flex-col bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
            style={{ minHeight: '500px', maxHeight: 'calc(100vh - 300px)' }}
          >
            {/* Chat Header */}
            <div className="flex-shrink-0 px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-md flex-shrink-0">
                  <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate">AI Career Counselor</h2>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">Ask me anything about your career journey</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4" style={{ WebkitOverflowScrolling: 'touch' }}>
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center space-y-3 sm:space-y-4 px-4">
                    <MessageCircle className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 dark:text-gray-600 mx-auto" />
                    <div>
                      <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 font-medium">No messages yet</p>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500 mt-1">Start the conversation below</p>
                    </div>
                  </div>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {messages.map((message, index) => (
                    <motion.div
                      key={`${message.timestamp}-${index}`}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`
                          max-w-[85%] sm:max-w-[80%] rounded-xl sm:rounded-2xl px-3 sm:px-4 md:px-5 py-2 sm:py-3 shadow-md
                          ${message.role === 'user'
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
                            : 'bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white'
                          }
                        `}
                      >
                        {message.role === 'ai' && (
                          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" />
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300"></span>
                          </div>
                        )}
                        <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}

              {/* Typing Indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex justify-start"
                  onAnimationComplete={() => scrollToBottom(true)}
                >
                  <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl sm:rounded-2xl px-3 sm:px-4 md:px-5 py-2 sm:py-3 shadow-md">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" />
                      </div>
                      <div className="flex items-center gap-1 ml-1 sm:ml-2">
                        <div className="flex gap-1">
                          <motion.span
                            className="inline-block w-1 h-1 sm:w-1.5 sm:h-1.5 bg-blue-500 rounded-full"
                            animate={{ y: [0, -4, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                          />
                          <motion.span
                            className="inline-block w-1 h-1 sm:w-1.5 sm:h-1.5 bg-blue-500 rounded-full"
                            animate={{ y: [0, -4, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                          />
                          <motion.span
                            className="inline-block w-1 h-1 sm:w-1.5 sm:h-1.5 bg-blue-500 rounded-full"
                            animate={{ y: [0, -4, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input - Fixed at bottom */}
            <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 p-3 sm:p-4 bg-gray-50 dark:bg-gray-900/50">
              <div className="flex gap-2 sm:gap-3 items-end">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Share your thoughts, interests, and goals..."
                  className="flex-1 resize-none rounded-lg sm:rounded-xl border border-gray-300 dark:border-gray-600 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  rows={2}
                  disabled={isLoading || connectionStatus !== 'connected'}
                  style={{ maxHeight: '100px' }}
                  aria-label="Message input"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isLoading || connectionStatus !== 'connected'}
                  className="self-end bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-lg h-auto px-3 sm:px-4 py-2 sm:py-3 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  size="sm"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </div>
              <div className="flex items-center justify-between mt-1.5 sm:mt-2 flex-wrap gap-1">
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Press Enter to send, Shift+Enter for new line</p>
                {connectionStatus !== 'connected' && (
                  <p className="text-[10px] sm:text-xs text-red-500 dark:text-red-400">Connection lost. Please wait...</p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Right Column - Tabs */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-7 flex flex-col gap-3 sm:gap-4"
            style={{ minHeight: '500px', maxHeight: 'calc(100vh - 300px)' }}
          >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Tab Navigation */}
              <div className="flex-shrink-0 mb-3 sm:mb-4">
                <TabsList className="grid grid-cols-3 bg-white dark:bg-gray-800 p-1 sm:p-1.5 rounded-lg sm:rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 w-full gap-1 sm:gap-1.5 h-auto">
                  <TabsTrigger
                    value="playlist"
                    className="rounded-md sm:rounded-lg bg-transparent data-[state=active]:!bg-gradient-to-r data-[state=active]:!from-blue-600 data-[state=active]:!to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:border-0 flex items-center justify-center gap-1 sm:gap-2 h-full min-h-[2rem] sm:min-h-[2.5rem] px-2 sm:px-3 py-1.5 sm:py-2 transition-all font-semibold text-xs sm:text-sm data-[state=inactive]:text-gray-600 dark:data-[state=inactive]:text-gray-400 data-[state=inactive]:!bg-transparent data-[state=inactive]:hover:bg-gray-100 dark:data-[state=inactive]:hover:bg-gray-700 w-full border-0 outline-none focus-visible:outline-none focus-visible:ring-0 relative"
                  >
                    <PlayCircle className="w-3 h-3 sm:w-4 sm:h-4 shrink-0 relative z-10" />
                    <span className="hidden sm:inline whitespace-nowrap relative z-10">Playlist</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="calendar"
                    className="rounded-md sm:rounded-lg bg-transparent data-[state=active]:!bg-gradient-to-r data-[state=active]:!from-blue-600 data-[state=active]:!to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:border-0 flex items-center justify-center gap-1 sm:gap-2 h-full min-h-[2rem] sm:min-h-[2.5rem] px-2 sm:px-3 py-1.5 sm:py-2 transition-all font-semibold text-xs sm:text-sm data-[state=inactive]:text-gray-600 dark:data-[state=inactive]:text-gray-400 data-[state=inactive]:!bg-transparent data-[state=inactive]:hover:bg-gray-100 dark:data-[state=inactive]:hover:bg-gray-700 w-full border-0 outline-none focus-visible:outline-none focus-visible:ring-0 relative"
                  >
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4 shrink-0 relative z-10" />
                    <span className="hidden sm:inline whitespace-nowrap relative z-10">Calendar</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="flowchart"
                    className="rounded-md sm:rounded-lg bg-transparent data-[state=active]:!bg-gradient-to-r data-[state=active]:!from-blue-600 data-[state=active]:!to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:border-0 flex items-center justify-center gap-1 sm:gap-2 h-full min-h-[2rem] sm:min-h-[2.5rem] px-2 sm:px-3 py-1.5 sm:py-2 transition-all font-semibold text-xs sm:text-sm data-[state=inactive]:text-gray-600 dark:data-[state=inactive]:text-gray-400 data-[state=inactive]:!bg-transparent data-[state=inactive]:hover:bg-gray-100 dark:data-[state=inactive]:hover:bg-gray-700 w-full border-0 outline-none focus-visible:outline-none focus-visible:ring-0 relative"
                  >
                    <Workflow className="w-3 h-3 sm:w-4 sm:h-4 shrink-0 relative z-10" />
                    <span className="hidden sm:inline whitespace-nowrap relative z-10">Tree</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Tab Content */}
              <TabsContent value="playlist" className="flex-1 m-0 data-[state=inactive]:hidden min-h-0 overflow-hidden">
                <Card className="h-full border border-gray-200 dark:border-gray-700">
                  <CardContent className="p-0 h-full">
                    {sessionId ? (
                      <CareerPlaylistTab sessionId={sessionId} />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 px-4">
                        <ProgressLoader
                          message="Loading your learning playlist..."
                          showPercentage={true}
                          size="md"
                          autoIncrement={true}
                          duration={2000}
                          className="w-full max-w-md"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="calendar" className="flex-1 m-0 data-[state=inactive]:hidden min-h-0 overflow-hidden">
                <Card className="h-full border border-gray-200 dark:border-gray-700">
                  <CardContent className="p-0 h-full">
                    {sessionId ? (
                      <CareerCalendarTab sessionId={sessionId} />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 px-4">
                        <ProgressLoader
                          message="Loading your learning calendar..."
                          showPercentage={true}
                          size="md"
                          autoIncrement={true}
                          duration={2000}
                          className="w-full max-w-md"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="flowchart" className="flex-1 m-0 data-[state=inactive]:hidden min-h-0 overflow-hidden">
                <Card className="h-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
                  <CardContent className="p-0 h-full">
                    {nodes.length > 0 || edges.length > 0 ? (
                      <CareerTreeVisualization nodes={nodes} edges={edges} />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20">
                        <div className="text-center space-y-4">
                          <Workflow className="w-16 h-16 text-gray-300 dark:text-white/40 mx-auto" />
                          <div>
                            <p className="text-gray-700 dark:text-white/80 font-medium mb-1">Career Tree Visualization</p>
                            <p className="text-gray-500 dark:text-white/60 text-sm">Your career journey map will appear here as you progress</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </div>
      <SessionHistoryModal open={showHistory} onClose={() => setShowHistory(false)} onLoadSession={loadSession} />
    </DashboardLayout>
  );
}
