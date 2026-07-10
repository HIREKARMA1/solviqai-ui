"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Sparkles, Target, Brain, Lightbulb, Rocket,
  Trophy, TrendingUp, CheckCircle, MessageCircle, Loader2,
  Mic, MicOff, Volume2, VolumeX, PlayCircle, Workflow, Calendar,
  AlertCircle, RefreshCw, Wifi, WifiOff, Users, Paperclip,
  ThumbsUp, ThumbsDown, Reply, Copy, Lock, RotateCcw
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
import CareerGPSTab from '@/components/career-guidance/CareerGPSTab';
import AICareerTwinTab from '@/components/career-guidance/AICareerTwinTab';
import SessionHistoryModal from '@/components/career-guidance/SessionHistoryModal';
import CareerModuleLocked from '@/components/career-guidance/CareerModuleLocked';
import CareerCounselorChat from '@/components/career-guidance/CareerCounselorChat';
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
  const [activeTab, setActiveTab] = useState('counselor');
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [subscriptionFeature, setSubscriptionFeature] = useState('this feature');
  const [isLimitReached, setIsLimitReached] = useState(false);
  const [careerProgress, setCareerProgress] = useState<any>(null);
  const [needsCounselorStart, setNeedsCounselorStart] = useState(false);

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

  const loadSession = async (
    id: string,
    options?: { silent?: boolean; readOnly?: boolean },
  ) => {
    try {
      if (!options?.silent) {
        setIsInitializing(true);
      }
      if (!options?.readOnly) {
        setError(null);
      }
      setIsLimitReached(false);
      const data = await api.careerGuidance.getSession(id);
      setSessionId(data.session_id);
      setMessages(data.conversation_history || []);
      setNodes(data.flowchart_nodes || []);
      setEdges(data.flowchart_edges || []);
      setCompletionPercentage(data.completion_percentage || 0);
      setCurrentStage(data.current_stage || 'introduction');

      const sessionComplete = data.is_completed === 'completed';
      if (!sessionComplete && !options?.readOnly) {
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }
        connectSSE(data.session_id);
      }
      if (!options?.silent && !sessionComplete) {
        toast.success('Session loaded successfully!');
      }
    } catch (e: any) {
      console.error('Failed to load session', e);
      if (options?.readOnly) {
        setSessionId(id);
        return;
      }
      const errorMessage = e.response?.data?.detail || 'Failed to load session';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      if (!options?.silent) {
        setIsInitializing(false);
      }
    }
  };

  const hydrateFromProgress = async () => {
    try {
      setIsInitializing(true);
      setError(null);
      const progress = await api.careerGuidance.getProgress();
      setCareerProgress(progress);
      const counselingComplete = progress.counselor_status === 'completed';

      if (progress.active_session_id) {
        setNeedsCounselorStart(false);
        await loadSession(progress.active_session_id, { silent: true });
        return;
      }

      if (progress.counselor_session_id) {
        setNeedsCounselorStart(false);
        setSessionId(progress.counselor_session_id);
        await loadSession(progress.counselor_session_id, {
          silent: true,
          readOnly: counselingComplete,
        });
        if (counselingComplete) {
          setIsLimitReached(!progress.can_restart_counselor);
        }
        return;
      }

      if (!progress.can_start_new_counselor) {
        setIsLimitReached(!progress.can_restart_counselor && counselingComplete);
        if (progress.counselor_blocked_reason && !counselingComplete) {
          setError(progress.counselor_blocked_reason);
        }
      }
      setNeedsCounselorStart(progress.can_start_new_counselor);
    } catch (e: any) {
      console.error('Failed to load career guidance progress', e);
      setError(e.response?.data?.detail || 'Failed to load career guidance');
      setNeedsCounselorStart(true);
    } finally {
      setIsInitializing(false);
    }
  };

  const startSession = async (forceNew = false) => {
    setIsInitializing(true);
    setIsLoading(true);
    setLoadingPercentage(0);
    setError(null);
    setIsLimitReached(false);
    setNeedsCounselorStart(false);

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
        preferred_language: 'en',
        force_new: forceNew,
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

      setLoadingPercentage(100);
      setNeedsCounselorStart(false);

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
        setIsLimitReached(true);
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

      try {
        const progress = await api.careerGuidance.getProgress();
        setCareerProgress(progress);
        setNeedsCounselorStart(false);
        if (progress.counselor_status === 'completed') {
          setIsLimitReached(!progress.can_restart_counselor);
        }
      } catch {
        if (response.counselor_status === 'completed') {
          setIsLimitReached(true);
        }
      }

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
        setIsLimitReached(true);
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

  // Load saved progress on mount — do not auto-start a new counselor session
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      if (mounted) {
        await hydrateFromProgress();
      }
    };
    void init();

    return () => {
      mounted = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const StageIcon = getStageInfo(currentStage).icon;
  const stageInfo = getStageInfo(currentStage);
  const moduleAccess = careerProgress?.module_access ?? { counselor: true };
  const counselorComplete = careerProgress?.counselor_status === 'completed';
  const counselorSessionId = careerProgress?.counselor_session_id ?? sessionId;

  const handleRetry = () => {
    if (counselorComplete) {
      void hydrateFromProgress();
      return;
    }
    if (sessionId) {
      connectSSE(sessionId);
    } else {
      void startSession();
    }
  };

  const isTabLocked = (tab: string) => tab !== 'counselor' && !moduleAccess[tab];

  const handleTabChange = (tab: string) => {
    if (isTabLocked(tab)) {
      toast.error('Complete your counseling session first to unlock this module.');
      return;
    }
    setActiveTab(tab);
  };

  const goToCounselor = () => setActiveTab('counselor');

  const openUpgrade = () => {
    setSubscriptionFeature('AI Career Guidance');
    setShowSubscriptionModal(true);
  };

  const startFreshCounseling = async () => {
    if (careerProgress?.can_restart_counselor) {
      await startSession(true);
      return;
    }
    openUpgrade();
  };

  const renderTabTrigger = (
    value: string,
    icon: React.ReactNode,
    label: string,
  ) => {
    const locked = isTabLocked(value);
    return (
      <TabsTrigger
        value={value}
        disabled={locked}
        className="rounded-md sm:rounded-lg bg-transparent data-[state=active]:!bg-[#0068FC] data-[state=active]:text-white flex items-center justify-center gap-1 sm:gap-2 h-full px-1.5 sm:px-3 py-1 sm:py-2 max-sm:px-1 max-sm:py-1 transition-all font-semibold text-[10px] sm:text-sm data-[state=inactive]:text-gray-600 dark:data-[state=inactive]:text-gray-400 data-[state=inactive]:!bg-transparent data-[state=inactive]:hover:bg-gray-100 dark:data-[state=inactive]:hover:bg-white/10 w-full border-0 outline-none focus-visible:ring-0 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {locked ? <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> : icon}
        <span className="whitespace-nowrap truncate max-sm:sr-only sm:inline">{label}</span>
      </TabsTrigger>
    );
  };

  if (isInitializing && !sessionId) {
    return (
      <DashboardLayout requiredUserType="student">
        <div className="flex items-center justify-center min-h-[600px] px-4">
          <ProgressLoader
            progress={loadingPercentage}
            message="Loading your career guidance..."
            subtitle="Restoring your profile and session"
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
      <div className="relative min-h-screen bg-brand-hero dark:bg-brand-hero-dark -mx-6 -mb-6 -mt-20 lg:-mt-24 p-4 sm:p-6 pt-20 lg:pt-24 pb-10 w-auto">
        <div className="mx-auto max-w-7xl space-y-3 sm:space-y-6">
          {/* Header - Custom Orange & Blue Premium Gradient Banner with Features Highlight & AI Twin Status */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden w-full rounded-2xl border border-[#e2e7f4] bg-brand-hero-2 shadow-[0_4px_28px_rgba(61,79,138,0.08)] dark:border-gray-800/60 dark:bg-brand-hero-dark-2 py-4 px-4 sm:px-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all duration-300"
            style={{
              boxShadow: isDark
                ? '0 8px 32px 0 rgba(0, 0, 0, 0.3), inset 0 1px 1px 0 rgba(255, 255, 255, 0.05)'
                : '0 8px 32px 0 rgba(104, 152, 255, 0.04), inset 0 1px 1.5px 0 rgba(255, 255, 255, 0.9)',
            }}
          >
            {/* Decorative glowing blobs */}
            <div className="absolute top-[-30px] left-[-30px] w-36 h-36 rounded-full bg-[#f58020]/20 blur-[50px] pointer-events-none" />
            <div className="absolute bottom-[-30px] right-[-30px] w-40 h-40 rounded-full bg-[#0068FC]/20 blur-[60px] pointer-events-none" />

            {/* Grid Pattern Overlay */}
            <div
              className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(#000 1px, transparent 1px), radial-gradient(#000 1px, transparent 1px)',
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0, 10px 10px',
              }}
            />

            <div className="flex flex-col gap-1.5 max-w-4xl relative z-10 w-full">
              <div className="flex items-center gap-2 flex-wrap">
                {/* <div className="flex items-center justify-center p-1.5 rounded-lg bg-orange-500 text-white shadow-sm">
                  <Sparkles className="h-4 w-4 animate-pulse" />
                </div> */}
                <Badge variant="outline" className="border-orange-500/20 text-orange-200 bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full">
                  AI Counseling & Mentorship
                </Badge>
                {counselorComplete && (
                  <Badge variant="outline" className="border-emerald-500/20 text-emerald-300 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full">
                    AI Twin Active
                  </Badge>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold leading-tight tracking-tight text-white dark:text-white mt-1">
                AI Career Guidance
              </h1>

              <p className="text-xs sm:text-sm text-blue-50/90 dark:text-gray-200 leading-relaxed max-w-3xl">
                Discover your perfect career path with custom industry roadmap routes, career graphs, playlist recommendations, a daily learning calendar with tracking, and your personalized AI Twin.
              </p>

              {/* Feature Pills */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="flex items-center gap-1 text-[10px] sm:text-xs font-semibold px-2 py-1 rounded-md bg-white/10 border border-white/10 text-white shadow-sm">
                  <Target className="w-3 h-3 text-orange-300 shrink-0" />
                  <span>GPS Routes</span>
                </span>
                <span className="flex items-center gap-1 text-[10px] sm:text-xs font-semibold px-2 py-1 rounded-md bg-white/10 border border-white/10 text-white shadow-sm">
                  <Workflow className="w-3 h-3 text-orange-300 shrink-0" />
                  <span>Career Tree</span>
                </span>
                <span className="flex items-center gap-1 text-[10px] sm:text-xs font-semibold px-2 py-1 rounded-md bg-white/10 border border-white/10 text-white shadow-sm">
                  <PlayCircle className="w-3 h-3 text-orange-300 shrink-0" />
                  <span>Playlists</span>
                </span>
                <span className="flex items-center gap-1 text-[10px] sm:text-xs font-semibold px-2 py-1 rounded-md bg-white/10 border border-white/10 text-white shadow-sm">
                  <Calendar className="w-3 h-3 text-orange-300 shrink-0" />
                  <span>Daily Calendar</span>
                </span>
                <span className="flex items-center gap-1 text-[10px] sm:text-xs font-semibold px-2 py-1 rounded-md bg-white/10 border border-white/10 text-white shadow-sm">
                  <Users className="w-3 h-3 text-orange-300 shrink-0" />
                  <span>AI Twin</span>
                </span>
              </div>
            </div>

            {/* Right side - Super Compact Counseling Status */}
            {/* <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center relative z-10 shrink-0 w-full md:w-auto p-3 rounded-xl bg-white/10 dark:bg-black/20 border border-white/10 shadow-sm backdrop-blur-md gap-3 md:gap-1.5">
              <div className="flex items-center gap-2">
                <div className="relative w-7 h-7 rounded-full bg-gradient-to-tr from-[#f58020] to-[#0068FC] flex items-center justify-center text-white font-bold text-xs shrink-0">
                  {careerProgress?.profile?.desired_role ? careerProgress.profile.desired_role.substring(0, 2).toUpperCase() : 'AI'}
                </div>
                <div className="text-left md:text-right">
                  <p className="text-[11px] font-bold text-white max-w-[140px] truncate">
                    {careerProgress?.profile?.desired_role || 'No Target Yet'}
                  </p>
                  <p className="text-[9px] font-medium text-orange-200">
                    {counselorComplete ? 'AI Twin Active' : `Counseling: ${completionPercentage}%`}
                  </p>
                </div>
              </div>
              <div className="w-24 md:w-32 bg-white/20 h-1 rounded-full overflow-hidden shrink-0">
                <div
                  className="bg-orange-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div> */}
          </motion.div>

          {/* Stats Cards - Figma: Vertical flow, Fill width, Hug height (122px), 10px gap, white cards with shadow */}
          {/* <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
        >

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
        </motion.div> */}

          {/* Error Alert — hide after counseling is complete (modules work without live session) */}
          {error && !counselorComplete && (
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

          {/* Main Content - Full width layout for unified tabs */}
          <div className="w-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className={`w-full flex flex-col gap-2 sm:gap-4 ${activeTab === 'counselor'
                ? "min-h-[min(720px,calc(100vh-200px))] max-h-[calc(100vh-200px)]"
                : "h-auto"
                }`}
            >
              <Tabs value={activeTab} onValueChange={handleTabChange} className={`flex-1 flex flex-col ${activeTab === 'counselor' ? "min-h-0" : "h-auto"}`}>
                {/* Tab Navigation - icon-only on small screens to avoid truncation; full labels on sm+ */}
                <div className="flex-shrink-0 mb-2 sm:mb-4">
                  <TabsList
                    className="grid grid-cols-6 w-full h-[40px] sm:h-[57px] rounded-lg p-1.5 sm:p-[10px] gap-1 sm:gap-4 lg:gap-6 border bg-[#FDFDFD] dark:bg-[#1C2938] border-[#C0C0C0] dark:border-[#4F5764]"
                  >
                    {renderTabTrigger('counselor', <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 max-sm:w-3.5 max-sm:h-3.5 shrink-0" />, 'Counselor')}
                    {renderTabTrigger('gps', <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 max-sm:w-3.5 max-sm:h-3.5 shrink-0" />, 'GPS')}
                    {renderTabTrigger('flowchart', <Workflow className="w-3.5 h-3.5 sm:w-4 sm:h-4 max-sm:w-3.5 max-sm:h-3.5 shrink-0" />, 'Tree')}
                    {renderTabTrigger('playlist', <PlayCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 max-sm:w-3.5 max-sm:h-3.5 shrink-0" />, 'Playlist')}
                    {renderTabTrigger('calendar', <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 max-sm:w-3.5 max-sm:h-3.5 shrink-0" />, 'Calendar')}
                    {renderTabTrigger('twin', <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 max-sm:w-3.5 max-sm:h-3.5 shrink-0" />, 'Twin')}
                  </TabsList>
                </div>

                {/* Tab Content */}
                <TabsContent value="counselor" className="flex-1 m-0 min-h-0 flex flex-col data-[state=inactive]:hidden overflow-hidden">
                  <CareerCounselorChat
                    messages={messages}
                    isTyping={isTyping}
                    inputMessage={inputMessage}
                    onInputChange={setInputMessage}
                    onSend={sendMessage}
                    onKeyDown={handleKeyPress}
                    counselorComplete={counselorComplete}
                    needsCounselorStart={needsCounselorStart}
                    isLimitReached={isLimitReached}
                    isLoading={isLoading}
                    connectionStatus={connectionStatus}
                    sessionId={sessionId}
                    careerProgress={careerProgress}
                    counselorBlockedReason={careerProgress?.counselor_blocked_reason}
                    onStartSession={() => void startSession()}
                    onStartFresh={() => void startFreshCounseling()}
                    onUpgrade={openUpgrade}
                    messagesEndRef={messagesEndRef}
                    isDark={isDark}
                  />
                </TabsContent>

                <TabsContent value="playlist" className="flex-1 m-0 data-[state=inactive]:hidden h-auto overflow-visible">
                  <Card className="h-auto border border-gray-200 dark:border-[#4F5764] dark:bg-[#1C2938]">
                    <CardContent className="p-0 h-auto">
                      {isTabLocked('playlist') ? (
                        <CareerModuleLocked title="Learn & Playlist Locked" onGoToCounselor={goToCounselor} />
                      ) : counselorSessionId ? (
                        <CareerPlaylistTab sessionId={counselorSessionId} />
                      ) : (
                        <div className="flex items-center justify-center min-h-[320px] bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 px-4 py-12">
                          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                            Complete counseling to generate your learning playlist.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="calendar" className="flex-1 m-0 data-[state=inactive]:hidden h-auto overflow-visible">
                  <Card className="h-auto border border-gray-200 dark:border-gray-700">
                    <CardContent className="p-0 h-auto">
                      {isTabLocked('calendar') ? (
                        <CareerModuleLocked title="Calendar Plan Locked" onGoToCounselor={goToCounselor} />
                      ) : counselorSessionId ? (
                        <CareerCalendarTab sessionId={counselorSessionId} />
                      ) : (
                        <div className="flex items-center justify-center min-h-[320px] bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 px-4 py-12">
                          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                            Complete counseling to unlock your learning calendar.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="flowchart" className="flex-1 m-0 data-[state=inactive]:hidden h-auto overflow-visible">
                  {isTabLocked('flowchart') ? (
                    <CareerModuleLocked
                      title="Career Tree Locked"
                      description="Your career journey map will appear here after counseling."
                      onGoToCounselor={goToCounselor}
                    />
                  ) : nodes.length > 0 || edges.length > 0 ? (
                    <div
                      className="min-h-[560px] h-[70vh] w-full rounded-lg border overflow-auto dark:border-[#4F5764]"
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

                <TabsContent value="gps" className="flex-1 m-0 data-[state=inactive]:hidden h-auto overflow-visible">
                  <Card className="h-auto border border-gray-200 dark:border-gray-700">
                    <CardContent className="p-0 h-auto">
                      {isTabLocked('gps') ? (
                        <CareerModuleLocked title="Career GPS Locked" onGoToCounselor={goToCounselor} />
                      ) : (
                        <CareerGPSTab />
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="twin" className="flex-1 m-0 data-[state=inactive]:hidden h-auto overflow-visible">
                  <Card className="h-auto border border-gray-200 dark:border-gray-700">
                    <CardContent className="p-0 h-auto">
                      {isTabLocked('twin') ? (
                        <CareerModuleLocked
                          title="AI Career Twin Locked"
                          description="Complete counseling to unlock your personalized AI Career Twin."
                          onGoToCounselor={goToCounselor}
                        />
                      ) : (
                        <AICareerTwinTab />
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>
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
