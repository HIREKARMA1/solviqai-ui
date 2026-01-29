"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Sparkles, Target, Brain, Lightbulb, Rocket,
  Trophy, TrendingUp, CheckCircle, MessageCircle, Loader2,
  Mic, MicOff, Volume2, VolumeX, PlayCircle, Workflow, Calendar,
  AlertCircle, RefreshCw, Wifi, WifiOff, Users, Paperclip,
  ThumbsUp, ThumbsDown, Reply, Copy
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
import SubscriptionRequiredModal from '@/components/subscription/SubscriptionRequiredModal';
import { AxiosError } from 'axios';
import { useTheme } from 'next-themes';

interface Message {
  role: 'ai' | 'user';
  content: string;
  timestamp: string;
}

export default function CareerGuidancePage() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
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
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [subscriptionFeature, setSubscriptionFeature] = useState('this feature');

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
      const axiosError = error as AxiosError<{ detail: string }>;
      const errorMessage = axiosError.response?.data?.detail || 'Failed to start session. Please try again.';
      
      // Check if it's a subscription error - be more specific with checks
      const isSubscriptionError = 
        axiosError.response?.status === 403 || 
        (errorMessage && (
          errorMessage.toLowerCase().includes('contact hirekarma') || 
          errorMessage.toLowerCase().includes('subscription') ||
          errorMessage.toLowerCase().includes('free plan')
        ));
      
      if (isSubscriptionError) {
        setSubscriptionFeature('AI Career Guidance');
        setShowSubscriptionModal(true);
        // Don't set error state or show toast for subscription errors
      } else {
        setError(errorMessage);
        toast.error(errorMessage);
      }
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
      const axiosError = error as AxiosError<{ detail: string }>;
      const errorMessage = axiosError.response?.data?.detail || 'Failed to send message. Please try again.';
      
      // Check if it's a subscription error - be more specific with checks
      const isSubscriptionError = 
        axiosError.response?.status === 403 || 
        (errorMessage && (
          errorMessage.toLowerCase().includes('contact hirekarma') || 
          errorMessage.toLowerCase().includes('subscription') ||
          errorMessage.toLowerCase().includes('free plan')
        ));
      
      if (isSubscriptionError) {
        setSubscriptionFeature('AI Career Guidance');
        setShowSubscriptionModal(true);
        // Don't set error state or show toast for subscription errors
      } else {
        setError(errorMessage);
        toast.error(errorMessage);
      }
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
      <div className="space-y-3 sm:space-y-6 px-3 sm:px-4 md:px-6 pt-24 sm:pt-28 lg:pt-0 pb-6 sm:pb-8">
        {/* Header - responsive: min-height on small, fixed on lg; padding scales */}
        <motion.div
          className="relative overflow-hidden w-full rounded-xl sm:rounded-[16px] text-gray-900 dark:text-white flex flex-col items-start justify-center text-left py-3 px-3 sm:py-[14px] sm:px-[10px] gap-2 sm:gap-4 min-h-[100px] sm:min-h-[120px] lg:h-[140px] lg:min-h-[140px]"
          style={{
            backgroundColor: isDark ? '#1C2938' : '#F6FBFF',
            boxShadow: 'inset 0 1px 1.5px 0 rgba(0,0,0,0.25)',
          }}
        >
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-[#0068FC] flex-shrink-0" />
            <h1
              className="text-xl sm:text-3xl md:text-[40px] font-bold leading-tight sm:leading-[40px] tracking-normal bg-clip-text text-transparent"
              style={{
                fontFamily: 'var(--font-poppins), sans-serif',
                fontWeight: 700,
                background: 'linear-gradient(90deg, #0068FC 0%, #8D5AFF 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
              }}
            >
              AI Career Guidance
            </h1>
          </div>
          <p className="text-xs sm:text-base text-gray-600 dark:text-gray-400 line-clamp-2 sm:line-clamp-none">
            Discover your perfect career path with personalized AI-powered guidance
          </p>
        </motion.div>

        {/* Stats Cards - Figma: Vertical flow, Fill width, Hug height (122px), 10px gap, white cards with shadow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
        >
          {/* Current Stage Card - Figma: light #FFF / dark #1C2938, border #CACACA / #666565 */}
          <Card
            className="rounded-2xl border bg-white shadow-sm hover:shadow-md transition-shadow w-full overflow-hidden border-[#CACACA] dark:border-[#666565] dark:bg-[#1C2938]"
          >
            <CardContent className="p-[10px] flex flex-col gap-[10px]">
              <div className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Current Stage</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Stage {stageInfo.number} of 4</div>
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="p-2 rounded-full flex-shrink-0 bg-[#E8F0FE] dark:bg-blue-900/30">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-[#0068FC]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate">{stageInfo.label}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{stageInfo.description}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* In Progress Card - Figma: light #FFF / dark #1C2938 */}
          <Card
            className="rounded-2xl border bg-white shadow-sm hover:shadow-md transition-shadow w-full overflow-hidden border-[#CACACA] dark:border-[#666565] dark:bg-[#1C2938]"
          >
            <CardContent className="p-[10px] flex flex-col gap-[10px]">
              <div className="flex items-center justify-between">
                <div className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">In Progress</div>
                <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{completionPercentage}%</div>
              </div>
              <Progress value={completionPercentage} className="h-2 sm:h-3" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full border-2 border-[#0068FC] dark:border-[#8EBDFF] flex items-center justify-center flex-shrink-0 bg-[#E8F0FE]/50 dark:bg-[#0068FC]/20">
                  <Target className="w-4 h-4 text-[#0068FC] dark:text-[#8EBDFF]" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-[#0068FC] dark:text-green-400">Your perfect career paths!</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Card - Figma: light #FFF / dark #1C2938 */}
          <Card
            className="rounded-2xl border bg-white shadow-sm hover:shadow-md transition-shadow w-full overflow-hidden border-[#CACACA] dark:border-[#666565] dark:bg-[#1C2938]"
          >
            <CardContent className="p-[10px] flex flex-col gap-[10px]">
              <div className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Quick Actions</div>
              <div className="flex items-center justify-center flex-1 min-h-[80px]">
                <Button
                  variant="outline"
                  onClick={() => setShowHistory(true)}
                  className="border-gray-300 dark:border-[#666565] rounded-lg h-10 px-4 bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-[#243447] text-gray-700 dark:text-gray-200"
                  aria-label="Session history"
                >
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  <span className="text-sm font-medium">View History</span>
                </Button>
              </div>
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

        {/* Main Content - Stack on mobile, two columns on lg */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-6">
          {/* Chat Console - responsive min/max height */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-5 flex flex-col rounded-lg overflow-hidden border border-gray-200 dark:border-[#4F5764] shadow-lg min-h-[320px] sm:min-h-[420px] lg:min-h-[640px] max-h-[calc(100vh-200px)] sm:max-h-[calc(100vh-200px)] lg:max-h-[calc(100vh-180px)]"
            style={{
              borderRadius: 8,
              backgroundColor: isDark ? 'rgba(28, 41, 56, 0.6)' : 'rgba(0, 105, 255, 0.05)',
              gap: 16,
            }}
          >
            {/* Chat Header - light #D6E1FF / dark #1C2938 or #1F2748 */}
            <div
              className="flex-shrink-0 flex items-center gap-1.5 sm:gap-2 border-b border-gray-200/50 dark:border-[#4F5764] px-2 py-2.5 sm:px-4 sm:py-4 min-h-[60px] sm:min-h-[86px]"
              style={{ backgroundColor: isDark ? '#1C2938' : '#D6E1FF' }}
            >
              <div className="p-1 sm:p-2 rounded-md sm:rounded-lg flex-shrink-0 bg-[#0068FC]/20 dark:bg-[#0068FC]/30">
                <MessageCircle className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-[#0068FC] dark:text-[#8EBDFF]" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xs sm:text-lg font-bold text-gray-900 dark:text-white truncate">AI Career Counselor</h2>
                <p className="text-[10px] sm:text-sm text-gray-600 dark:text-gray-400 truncate">Ask me anything about your career journey</p>
              </div>
            </div>

            {/* Messages - responsive padding and gap */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6" style={{ WebkitOverflowScrolling: 'touch' }}>
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
                          max-w-[92%] sm:max-w-[85%] lg:max-w-[80%] px-3 py-2.5 sm:px-5 sm:py-4 shadow-sm min-h-0 sm:min-h-[88px]
                          ${message.role === 'user' ? 'text-gray-900 dark:text-white' : 'text-gray-900 dark:text-white'}
                        `}
                        style={
                          message.role === 'user'
                            ? isDark
                              ? { backgroundColor: '#384370', border: '1px solid #4F5764', borderRadius: 12 }
                              : {
                                  backgroundColor: '#D6E1FF',
                                  border: '1px solid rgba(134, 146, 166, 0.2)',
                                  borderRadius: 12,
                                }
                            : isDark
                              ? { backgroundColor: '#2A2C38', border: '1px solid #4F5764', borderRadius: 16 }
                              : {
                                  backgroundColor: '#FFFFFF',
                                  border: '1px solid #8692A6',
                                  borderRadius: 16,
                                }
                        }
                      >
                        {message.role === 'ai' ? (
                          <>
                            <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-[#0068FC] flex-shrink-0" />
                            </div>
                            <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
                            <div className="flex items-center gap-0.5 sm:gap-3 mt-1 sm:mt-2 pt-1 sm:pt-2 border-t border-gray-200 max-sm:gap-1">
                              <button type="button" className="p-0.5 sm:p-1.5 rounded hover:bg-gray-100 text-gray-600 max-sm:p-0.5" aria-label="Like">
                                <ThumbsUp className="w-2.5 h-2.5 sm:w-4 sm:h-4 max-sm:w-2.5 max-sm:h-2.5" />
                              </button>
                              <button type="button" className="p-0.5 sm:p-1.5 rounded hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400 max-sm:p-0.5" aria-label="Dislike">
                                <ThumbsDown className="w-2.5 h-2.5 sm:w-4 sm:h-4 max-sm:w-2.5 max-sm:h-2.5" />
                              </button>
                              <button type="button" className="p-0.5 sm:p-1.5 rounded hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400 max-sm:p-0.5" aria-label="Copy">
                                <Copy className="w-2.5 h-2.5 sm:w-4 sm:h-4 max-sm:w-2.5 max-sm:h-2.5" />
                              </button>
                              <button type="button" className="p-0.5 sm:p-1.5 rounded hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400 max-sm:p-0.5" aria-label="Regenerate">
                                <RefreshCw className="w-2.5 h-2.5 sm:w-4 sm:h-4 max-sm:w-2.5 max-sm:h-2.5" />
                              </button>
                            </div>
                          </>
                        ) : (
                          <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
                        )}
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
                  <div
                    className="rounded-2xl px-4 py-3 shadow-sm border"
                    style={
                      isDark
                        ? { backgroundColor: '#2A2C38', borderColor: '#4F5764', borderRadius: 16 }
                        : { backgroundColor: '#FFFFFF', borderColor: '#8692A6', borderRadius: 16 }
                    }
                  >
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-[#0068FC] flex-shrink-0" />
                      <div className="flex gap-1">
                        <motion.span
                          className="inline-block w-1.5 h-1.5 bg-[#0068FC] rounded-full"
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                        />
                        <motion.span
                          className="inline-block w-1.5 h-1.5 bg-[#0068FC] rounded-full"
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                        />
                        <motion.span
                          className="inline-block w-1.5 h-1.5 bg-[#0068FC] rounded-full"
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input - compact on mobile; dark mode #1C2938 / #4F5764 */}
            <div className="flex-shrink-0 border-t border-gray-200 dark:border-[#4F5764] p-1 sm:p-4 bg-white dark:bg-[#1C2938]/80">
              <div
                className="flex gap-1 sm:gap-3 items-center border border-gray-200 dark:border-[#4F5764] px-1.5 sm:px-4 py-1.5 sm:py-4 max-sm:px-2 max-sm:py-2 bg-white dark:bg-[#2A2C38] rounded-md sm:rounded-lg min-h-[48px] sm:min-h-[96px] max-sm:min-h-[44px]"
              >
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Type your response or use voice input..."
                  className="flex-1 min-w-0 resize-none text-xs sm:text-sm bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 min-h-[36px] sm:min-h-[56px] max-sm:min-h-[32px] max-sm:text-[11px] max-sm:placeholder:text-[11px] focus:outline-none border-0 rounded-none"
                  rows={2}
                  disabled={isLoading || connectionStatus !== 'connected'}
                  style={{ maxHeight: '120px' }}
                  aria-label="Message input"
                />
                <div className="flex items-center gap-0.5 sm:gap-2 flex-shrink-0 max-sm:gap-1">
                  <Button
                    onClick={sendMessage}
                    disabled={!inputMessage.trim() || isLoading || connectionStatus !== 'connected'}
                    className="h-7 w-7 sm:h-10 sm:w-10 max-sm:h-7 max-sm:w-7 p-0 rounded-md sm:rounded-lg text-white disabled:opacity-50 flex-shrink-0 border-0 hover:opacity-90"
                    style={{ backgroundColor: '#8EBDFF' }}
                    size="sm"
                    aria-label="Send message"
                  >
                    <Send className="w-3 h-3 sm:w-5 sm:h-5 max-sm:w-3 max-sm:h-3" />
                  </Button>
                  <button
                    type="button"
                    className="p-1 sm:p-2 max-sm:p-1 rounded-md sm:rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                    aria-label="Attach file"
                  >
                    <Paperclip className="w-3 h-3 sm:w-5 sm:h-5 max-sm:w-3 max-sm:h-3" />
                  </button>
                  <button
                    type="button"
                    className="p-1 sm:p-2 max-sm:p-1 rounded-md sm:rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                    aria-label="Voice input"
                  >
                    <Mic className="w-3 h-3 sm:w-5 sm:h-5 max-sm:w-3 max-sm:h-3" />
                  </button>
                </div>
              </div>
              <p className="mt-1 sm:mt-2 text-[9px] sm:text-xs text-gray-500 dark:text-gray-400 hidden sm:block">Press Enter to send, Shift+Enter for new line</p>
              <div className="flex items-center justify-between mt-0.5 flex-wrap gap-1">
                {connectionStatus !== 'connected' && (
                  <p className="text-[10px] sm:text-xs text-red-500 dark:text-red-400">Connection lost. Please wait...</p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Right Column - Tabs; responsive height on small screens */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-7 flex flex-col gap-2 sm:gap-4 min-h-[320px] sm:min-h-[420px] lg:min-h-[640px] max-h-[calc(100vh-200px)] sm:max-h-[calc(100vh-200px)] lg:max-h-[calc(100vh-180px)]"
          >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Tab Navigation - icon-only on small screens to avoid truncation; full labels on sm+ */}
              <div className="flex-shrink-0 mb-2 sm:mb-4">
                <TabsList
                  className="grid grid-cols-3 w-full h-[40px] sm:h-[57px] rounded-lg p-1.5 sm:p-[10px] gap-1 sm:gap-4 lg:gap-6 border bg-[#FDFDFD] dark:bg-[#1C2938] border-[#C0C0C0] dark:border-[#4F5764]"
                >
                  <TabsTrigger
                    value="playlist"
                    className="rounded-md sm:rounded-lg bg-transparent data-[state=active]:!bg-[#0068FC] data-[state=active]:text-white flex items-center justify-center gap-1 sm:gap-2 h-full px-1.5 sm:px-3 py-1 sm:py-2 max-sm:px-1 max-sm:py-1 transition-all font-semibold text-[10px] sm:text-sm data-[state=inactive]:text-gray-600 dark:data-[state=inactive]:text-gray-400 data-[state=inactive]:!bg-transparent data-[state=inactive]:hover:bg-gray-100 dark:data-[state=inactive]:hover:bg-white/10 w-full border-0 outline-none focus-visible:ring-0"
                  >
                    <PlayCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 max-sm:w-3.5 max-sm:h-3.5 shrink-0" />
                    <span className="whitespace-nowrap truncate max-sm:sr-only sm:inline">Playlist</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="calendar"
                    className="rounded-md sm:rounded-lg bg-transparent data-[state=active]:!bg-[#0068FC] data-[state=active]:text-white flex items-center justify-center gap-1 sm:gap-2 h-full px-1.5 sm:px-3 py-1 sm:py-2 max-sm:px-1 max-sm:py-1 transition-all font-semibold text-[10px] sm:text-sm data-[state=inactive]:text-gray-600 dark:data-[state=inactive]:text-gray-400 data-[state=inactive]:!bg-transparent data-[state=inactive]:hover:bg-gray-100 dark:data-[state=inactive]:hover:bg-white/10 w-full border-0 outline-none focus-visible:ring-0"
                  >
                    <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 max-sm:w-3.5 max-sm:h-3.5 shrink-0" />
                    <span className="whitespace-nowrap truncate max-sm:sr-only sm:inline">Calendar</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="flowchart"
                    className="rounded-md sm:rounded-lg bg-transparent data-[state=active]:!bg-[#0068FC] data-[state=active]:text-white flex items-center justify-center gap-1 sm:gap-2 h-full px-1.5 sm:px-3 py-1 sm:py-2 max-sm:px-1 max-sm:py-1 transition-all font-semibold text-[10px] sm:text-sm data-[state=inactive]:text-gray-600 dark:data-[state=inactive]:text-gray-400 data-[state=inactive]:!bg-transparent data-[state=inactive]:hover:bg-gray-100 dark:data-[state=inactive]:hover:bg-white/10 w-full border-0 outline-none focus-visible:ring-0"
                  >
                    <Workflow className="w-3.5 h-3.5 sm:w-4 sm:h-4 max-sm:w-3.5 max-sm:h-3.5 shrink-0" />
                    <span className="whitespace-nowrap truncate max-sm:sr-only sm:inline">Tree</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Tab Content */}
              <TabsContent value="playlist" className="flex-1 m-0 data-[state=inactive]:hidden min-h-0 overflow-hidden">
                <Card className="h-full border border-gray-200 dark:border-[#4F5764] dark:bg-[#1C2938]">
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

              {/* Tree tab – Figma: empty state bg #FBFCFE, border #BDBDBD, 8px radius, padding 50px, purple icon + title */}
              <TabsContent value="flowchart" className="flex-1 m-0 data-[state=inactive]:hidden min-h-0 overflow-hidden">
                {nodes.length > 0 || edges.length > 0 ? (
                  <div
                    className="h-full w-full rounded-lg border overflow-hidden dark:border-[#4F5764]"
                    style={{
                      backgroundColor: isDark ? '#1C2938' : '#FBFCFE',
                      borderColor: isDark ? '#4F5764' : '#BDBDBD',
                      borderRadius: 8,
                    }}
                  >
                    <CareerTreeVisualization nodes={nodes} edges={edges} />
                  </div>
                ) : (
                  <div
                    className="h-full w-full flex flex-col items-center justify-center rounded-lg border min-h-[280px] sm:min-h-[360px] lg:min-h-[400px] p-6 sm:p-8 lg:p-[50px] gap-2 sm:gap-[10px] dark:border-[#4F5764]"
                    style={{
                      backgroundColor: isDark ? '#1C2938' : '#FBFCFE',
                      borderColor: isDark ? '#4F5764' : '#BDBDBD',
                      borderRadius: 8,
                    }}
                  >
                    <div className="flex justify-center">
                      <div className="p-3 sm:p-4 rounded-xl bg-[#E8E0F5] dark:bg-[#2A2C38]">
                        <Workflow className="h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 text-[#7F56D9] dark:text-[#8EBDFF]" />
                      </div>
                    </div>
                    <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white text-center">Career Tree Visualization</p>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-md text-center">Your career journey map will appear here as you progress</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </div>
      <SessionHistoryModal open={showHistory} onClose={() => setShowHistory(false)} onLoadSession={loadSession} />
      
      {/* Subscription Required Modal */}
      <SubscriptionRequiredModal 
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        feature={subscriptionFeature}
      />
    </DashboardLayout>
  );
}
