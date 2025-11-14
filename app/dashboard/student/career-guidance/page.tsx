"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Sparkles, Target, Brain, Lightbulb, Rocket, 
  Trophy, TrendingUp, CheckCircle, MessageCircle, Loader2,
  Mic, MicOff, Volume2, VolumeX, PlayCircle, Workflow, Calendar
} from 'lucide-react';
import { MarkerType } from 'reactflow';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api';
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
  const [isTyping, setIsTyping] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [currentStage, setCurrentStage] = useState('introduction');
  const [activeTab, setActiveTab] = useState('playlist'); // Default to playlist view
  
  // Flowchart state
  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);
  
  // WebSocket
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Sound toggle
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Scroll to bottom of messages - improved version
  const scrollToBottom = useCallback((force = false) => {
    // Use requestAnimationFrame to ensure DOM is updated
    requestAnimationFrame(() => {
      setTimeout(() => {
        if (messagesEndRef.current) {
          // Get the messages container (parent of messagesEndRef)
          const messagesContainer = messagesEndRef.current.parentElement;
          if (messagesContainer) {
            // Check if user is near bottom (within 100px) or force scroll
            const isNearBottom = messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight < 100;
            
            if (force || isNearBottom) {
              // Scroll to the very bottom
              messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
          } else {
            // Fallback to scrollIntoView
            messagesEndRef.current.scrollIntoView({ behavior: force ? 'auto' : 'smooth', block: 'end' });
          }
        }
      }, force ? 0 : 150);
    });
  }, []);

  useEffect(() => {
    // Always scroll to bottom when messages change or typing indicator appears
    scrollToBottom(true);
  }, [messages, isTyping, scrollToBottom]);

  // Start session on component mount
  useEffect(() => {
    startSession();
    return () => {
      // Cleanup WebSocket on unmount
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const [showHistory, setShowHistory] = useState(false);

  const loadSession = async (id: string) => {
    try {
      const data = await api.careerGuidance.getSession(id);
      setSessionId(data.session_id);
      setMessages(data.conversation_history || []);
      setNodes(data.flowchart_nodes || []);
      setEdges(data.flowchart_edges || []);
      setCompletionPercentage(data.completion_percentage || 0);
      setCurrentStage(data.current_stage || 'introduction');

      // Reconnect websocket for loaded session
      if (wsRef.current) {
        wsRef.current.close();
      }
      const wsUrl = `ws://localhost:8000/api/v1/career-guidance/ws/${data.session_id}`;
      const ws = new WebSocket(wsUrl);
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.type === 'typing') setIsTyping(msg.data.is_typing);
          if (msg.type === 'message') setMessages(prev => [...prev, { role: 'ai', content: msg.data.content, timestamp: new Date().toISOString() }]);
          if (msg.type === 'update_flowchart') {
            setNodes(msg.data.nodes || []);
            setEdges(msg.data.edges || []);
          }
        } catch (e) {
          console.warn('WS parse error', e);
        }
      };
      wsRef.current = ws;
    } catch (e) {
      console.error('Failed to load session', e);
      toast.error('Failed to load session');
    }
  };

  const startSession = async () => {
    setIsLoading(true);
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

      // Set initial flowchart
      if (response.initial_nodes && response.initial_nodes.length > 0) {
        setNodes(response.initial_nodes);
      }
      if (response.initial_edges && response.initial_edges.length > 0) {
        setEdges(response.initial_edges);
      }

      // Connect to WebSocket
      connectWebSocket(response.session_id);
      
      toast.success('Career guidance session started!');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to start session');
    } finally {
      setIsLoading(false);
    }
  };

  const connectWebSocket = (sessionId: string) => {
    const wsUrl = `ws://localhost:8000/api/v1/career-guidance/ws/${sessionId}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      // WebSocket connected successfully
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'typing') {
        setIsTyping(data.data.is_typing);
      } else if (data.type === 'update_flowchart') {
        // Update flowchart with animation
        setNodes(data.data.nodes || []);
        setEdges(data.data.edges || []);
      }
    };

    ws.onerror = (error) => {
      // WebSocket error - silently handle or show user-friendly message
      toast.error('Connection issue. Please refresh if problems persist.');
    };

    ws.onclose = () => {
      // WebSocket disconnected - connection closed
    };

    wsRef.current = ws;
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !sessionId || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await api.careerGuidance.sendMessage({
        session_id: sessionId,
        message: inputMessage
      });

      const aiMessage: Message = {
        role: 'ai',
        content: response.ai_response,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // Force scroll to bottom after new message
      setTimeout(() => scrollToBottom(true), 200);
      
      // Check if stage changed
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

      // Update flowchart
      if (response.updated_nodes && response.updated_nodes.length > 0) {
        // Count new nodes
        const previousNodeCount = nodes.length;
        const newNodeCount = response.updated_nodes.length - previousNodeCount;
        
        if (newNodeCount > 0) {
          toast.info(`✨ ${newNodeCount} new ${newNodeCount === 1 ? 'node' : 'nodes'} added to your career map!`, {
            duration: 3000
          });
        }
        
        // Add nodes with staggered animation
        const newNodes = response.updated_nodes.map((node: any, index: number) => ({
          id: node.id,
          type: 'custom',
          position: node.position,
          data: {
            ...node.data,
            animationDelay: index * 0.1 // Stagger each node by 100ms
          }
        }));
        
        // Animate nodes in one by one
        setTimeout(() => setNodes(newNodes), 100);
      }
      if (response.updated_edges && response.updated_edges.length > 0) {
        const newEdges = response.updated_edges.map((edge: any, index: number) => ({
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
            color: '#ffffff80',
          },
          style: {
            strokeWidth: 3,
            stroke: '#ffffff60',
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
        
        // Add edges after nodes with slight delay
        setTimeout(() => setEdges(newEdges), 300);
      }

      // Play success sound
      if (soundEnabled) {
        playNotificationSound();
      }

    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const playNotificationSound = () => {
    const audio = new Audio('/sounds/notification.mp3');
    audio.volume = 0.3;
    audio.play().catch(() => {
      // Silently handle audio play failures
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getStageInfo = (stage: string) => {
    const stageMap: Record<string, { label: string; icon: any; color: string; description: string; number: number }> = {
      introduction: { label: 'Getting Started', icon: Rocket, color: 'text-blue-500', description: 'Tell me about yourself', number: 1 },
      exploration: { label: 'Deep Exploration', icon: Lightbulb, color: 'text-yellow-500', description: 'Discovering your profile', number: 2 },
      recommendations: { label: '🎯 Career Recommendations', icon: Target, color: 'text-green-500', description: 'Your perfect career paths!', number: 3 },
      roadmap: { label: '📚 Learning Roadmap', icon: TrendingUp, color: 'text-indigo-500', description: 'Your step-by-step plan', number: 4 },
    };
    return stageMap[stage] || stageMap.introduction;
  };

  const StageIcon = getStageInfo(currentStage).icon;

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 overflow-hidden">
      {/* Header - Responsive */}
      <div className="bg-gradient-to-r from-slate-800/90 via-blue-900/90 to-indigo-900/90 backdrop-blur-xl border-b border-white/10 shadow-2xl flex-shrink-0">
        <div className="px-3 lg:px-6 py-3 lg:py-4">
          <div className="flex items-center justify-between gap-3 lg:gap-0">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg lg:text-2xl font-bold bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent truncate">
                🎯 AI Career Guidance
              </h1>
              <p className="text-xs lg:text-sm text-slate-300 mt-0.5 lg:mt-1 truncate">Discover your perfect career path</p>
            </div>
            
            {/* Progress - Responsive */}
            <div className="flex items-center gap-2 lg:gap-6">
              {/* Stage Info - Hidden on small mobile */}
              <div className="hidden sm:flex items-center gap-2 lg:gap-3">
                <div className={`p-1.5 lg:p-2 rounded-lg bg-gradient-to-br ${getStageInfo(currentStage).color.replace('text-', 'from-')} to-indigo-500 shadow-lg`}>
                  <StageIcon className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                </div>
                <div className="hidden lg:block">
                  <div className="text-xs text-slate-400">Stage {getStageInfo(currentStage).number} of 4</div>
                  <div className="text-sm font-medium text-white">{getStageInfo(currentStage).label}</div>
                  <div className="text-xs text-slate-400 italic">{getStageInfo(currentStage).description}</div>
                </div>
                <div className="lg:hidden">
                  <div className="text-xs text-slate-300 font-medium">{getStageInfo(currentStage).number}/4</div>
                </div>
              </div>
              
              <div className="hidden lg:block w-px h-10 bg-white/20" />
              
              {/* Progress Bar - Compact on mobile */}
              <div className="w-24 lg:w-48">
                <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                  <span className="hidden lg:inline">Overall Progress</span>
                  <span className="lg:hidden">Progress</span>
                  <span className="font-medium text-white">{completionPercentage}%</span>
                </div>
                <Progress value={completionPercentage} className="h-1.5 lg:h-2" />
                {currentStage === 'exploration' && (
                  <div className="text-[10px] lg:text-xs text-yellow-400 font-medium mt-1 hidden lg:block">
                    💡 Learning about you...
                  </div>
                )}
                {currentStage === 'recommendations' && (
                  <div className="text-[10px] lg:text-xs text-green-400 font-medium mt-1 animate-pulse hidden lg:block">
                    🎯 Generating your career recommendations...
                  </div>
                )}
                {currentStage === 'roadmap' && (
                  <div className="text-[10px] lg:text-xs text-indigo-400 font-medium mt-1 animate-pulse hidden lg:block">
                    📚 Creating your learning roadmap...
                  </div>
                )}
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="text-white/70 hover:text-white hover:bg-white/10 h-8 w-8 lg:h-10 lg:w-10"
              >
                {soundEnabled ? (
                  <Volume2 className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowHistory(true)}
                className="text-white/70 hover:text-white hover:bg-white/10 h-8 w-8 lg:h-10 lg:w-10 ml-2"
                aria-label="Session history"
              >
                {/* simple icon: Workflow */}
                <Workflow className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Responsive Layout */}
      <div className="flex-1 relative overflow-hidden min-h-0 max-h-full">
        {/* Background: Career Tree Visualization - Dimmed & Blurred (Hidden on Mobile) */}
        <div className="hidden lg:block absolute inset-0 z-0 opacity-20 blur-[2px] pointer-events-none">
          <CareerTreeVisualization nodes={nodes} edges={edges} />
        </div>

        {/* Overlay gradient for better contrast */}
        <div className="absolute inset-0 z-[1] bg-gradient-to-br from-slate-900/70 via-blue-900/60 to-indigo-900/70 pointer-events-none" />

        {/* Main Content - Responsive Grid */}
        <div className="relative z-10 h-full max-h-full grid grid-cols-1 lg:grid-cols-12 gap-2 lg:gap-4 p-2 lg:p-6" style={{ gridAutoRows: 'minmax(0, 1fr)' }}>
          {/* Chat Interface - Full width on mobile, 7 cols on desktop */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-7 flex flex-col bg-white/95 backdrop-blur-xl rounded-xl lg:rounded-2xl shadow-2xl border border-white/20 overflow-hidden h-full max-h-full min-h-0"
          >
            {/* Chat Header */}
            <div className="flex-shrink-0 px-3 lg:px-6 py-3 lg:py-4 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-b border-slate-200/50">
              <div className="flex items-center gap-2 lg:gap-3">
                <div className="p-1.5 lg:p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg lg:rounded-xl shadow-lg">
                  <MessageCircle className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base lg:text-lg font-bold text-slate-800 truncate">AI Career Counselor</h2>
                  <p className="text-xs text-slate-600 truncate">Ask me anything about your career journey</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 lg:p-6 space-y-3 lg:space-y-4 min-h-0" style={{ WebkitOverflowScrolling: 'touch' }}>
              <AnimatePresence mode="popLayout">
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`
                        max-w-[85%] lg:max-w-[85%] rounded-xl lg:rounded-2xl px-3 lg:px-5 py-2 lg:py-3 shadow-md
                        ${message.role === 'user'
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
                          : 'bg-white border border-slate-200 text-slate-800'
                        }
                      `}
                    >
                      {message.role === 'ai' && (
                        <div className="flex items-center gap-2 mb-1.5 lg:mb-2">
                          <Sparkles className="w-3 h-3 lg:w-4 lg:h-4 text-blue-500" />
                          <span className="text-xs font-semibold text-slate-700">AI Counselor</span>
                        </div>
                      )}
                      <p className="text-xs lg:text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Typing Indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-white border border-slate-200 rounded-xl lg:rounded-2xl px-3 lg:px-5 py-2 lg:py-3 shadow-md">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-3 h-3 lg:w-4 lg:h-4 animate-spin text-blue-500" />
                      <span className="text-xs lg:text-sm text-slate-600">AI is thinking...</span>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input - Fixed at bottom */}
            <div className="flex-shrink-0 border-t border-slate-200/50 p-2 lg:p-4 bg-gradient-to-r from-slate-50/50 to-blue-50/50 backdrop-blur-sm">
              <div className="flex gap-2 lg:gap-3 items-end">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Share your thoughts, interests, and goals..."
                  className="flex-1 resize-none rounded-lg lg:rounded-xl border border-slate-300 px-3 lg:px-4 py-2 lg:py-3 text-xs lg:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/90 backdrop-blur-sm"
                  rows={2}
                  disabled={isLoading}
                  style={{ maxHeight: '80px' }}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="self-end bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-lg h-auto px-3 lg:px-4 py-2 lg:py-3"
                  size="sm"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 lg:w-5 lg:h-5 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 lg:w-5 lg:h-5" />
                  )}
                </Button>
              </div>
              <p className="text-[10px] lg:text-xs text-slate-500 mt-1.5 lg:mt-2">Press Enter to send, Shift+Enter for new line</p>
            </div>
          </motion.div>

          {/* Playlist & Tree Toggle - Hidden on mobile, shown as modal or separate view */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="hidden lg:flex lg:col-span-5 flex-col gap-4 h-full max-h-full min-h-0"
          >
            {/* Tabs for Playlist and Full Tree View */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 h-full max-h-full overflow-hidden">
              {/* Tab Navigation */}
              <div className="flex-shrink-0 mb-4">
                <TabsList className="grid grid-cols-3 bg-white/95 backdrop-blur-xl p-1.5 rounded-xl shadow-lg border border-gray-200/50 w-full">
                  <TabsTrigger 
                    value="playlist" 
                    className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md flex items-center justify-center gap-2 py-3 transition-all font-semibold text-sm data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-gray-900"
                  >
                    <PlayCircle className="w-4 h-4" />
                    <span className="hidden lg:inline">Playlist</span>
                    <span className="lg:hidden">List</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="calendar" 
                    className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md flex items-center justify-center gap-2 py-3 transition-all font-semibold text-sm data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-gray-900"
                  >
                    <Calendar className="w-4 h-4" />
                    <span className="hidden lg:inline">Calendar</span>
                    <span className="lg:hidden">Cal</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="flowchart" 
                    className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md flex items-center justify-center gap-2 py-3 transition-all font-semibold text-sm data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-gray-900"
                  >
                    <Workflow className="w-4 h-4" />
                    <span className="hidden lg:inline">Tree</span>
                    <span className="lg:hidden">Tree</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Tab Content */}
              <TabsContent value="playlist" className="flex-1 m-0 data-[state=inactive]:hidden min-h-0 h-full max-h-full overflow-hidden">
                <div className="h-full max-h-full bg-white rounded-2xl shadow-2xl border border-gray-200/50 overflow-hidden">
                  {sessionId ? (
                    <CareerPlaylistTab sessionId={sessionId} />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gradient-to-br from-slate-50 to-blue-50/30">
                      <div className="text-center space-y-4">
                        <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto" />
                        <p className="text-gray-600 font-medium">Loading your learning playlist...</p>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="calendar" className="flex-1 m-0 data-[state=inactive]:hidden min-h-0 h-full max-h-full overflow-hidden">
                <div className="h-full max-h-full bg-white rounded-2xl shadow-2xl border border-gray-200/50 overflow-hidden">
                  {sessionId ? (
                    <CareerCalendarTab sessionId={sessionId} />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gradient-to-br from-slate-50 to-blue-50/30">
                      <div className="text-center space-y-4">
                        <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto" />
                        <p className="text-gray-600 font-medium">Loading your learning calendar...</p>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="flowchart" className="flex-1 m-0 data-[state=inactive]:hidden">
                <div className="h-full bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 rounded-2xl shadow-2xl border border-white/20 overflow-hidden relative">
                  {nodes.length > 0 || edges.length > 0 ? (
                    <CareerTreeVisualization nodes={nodes} edges={edges} />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center space-y-4">
                        <Workflow className="w-16 h-16 text-white/40 mx-auto" />
                        <div>
                          <p className="text-white/80 font-medium mb-1">Career Tree Visualization</p>
                          <p className="text-white/60 text-sm">Your career journey map will appear here as you progress</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>

        {/* Mobile Bottom Navigation - Shows Playlist, Calendar & Tree buttons */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-xl border-t border-slate-200/50 shadow-2xl">
          <div className="grid grid-cols-3 gap-2 p-2">
            <Button
              onClick={() => setActiveTab('playlist')}
              className={`flex items-center justify-center gap-1 py-3 ${
                activeTab === 'playlist'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              <PlayCircle className="w-4 h-4" />
              <span className="text-xs font-semibold">List</span>
            </Button>
            <Button
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center justify-center gap-1 py-3 ${
                activeTab === 'calendar'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span className="text-xs font-semibold">Cal</span>
            </Button>
            <Button
              onClick={() => setActiveTab('flowchart')}
              className={`flex items-center justify-center gap-1 py-3 ${
                activeTab === 'flowchart'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              <Workflow className="w-4 h-4" />
              <span className="text-xs font-semibold">Tree</span>
            </Button>
          </div>
        </div>

        {/* Mobile Full-Screen Modal for Playlist/Calendar/Tree */}
        {(activeTab === 'playlist' || activeTab === 'calendar' || activeTab === 'flowchart') && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-30 bg-slate-900/95 backdrop-blur-sm"
          >
            <div className="h-full flex flex-col">
              {/* Modal Header */}
              <div className="flex-shrink-0 bg-gradient-to-r from-slate-800/90 via-blue-900/90 to-indigo-900/90 backdrop-blur-xl border-b border-white/10 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    {activeTab === 'playlist' ? (
                      <>
                        <PlayCircle className="w-5 h-5" />
                        Learning Playlist
                      </>
                    ) : activeTab === 'calendar' ? (
                      <>
                        <Calendar className="w-5 h-5" />
                        Learning Calendar
                      </>
                    ) : (
                      <>
                        <Workflow className="w-5 h-5" />
                        Career Tree
                      </>
                    )}
                  </h3>
                  <Button
                    onClick={() => setActiveTab('playlist')}
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/10"
                  >
                    Close
                  </Button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-hidden">
                {activeTab === 'playlist' && sessionId ? (
                  <CareerPlaylistTab sessionId={sessionId} />
                ) : activeTab === 'calendar' && sessionId ? (
                  <CareerCalendarTab sessionId={sessionId} />
                ) : activeTab === 'flowchart' ? (
                  <div className="h-full bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
                    {nodes.length > 0 || edges.length > 0 ? (
                      <CareerTreeVisualization nodes={nodes} edges={edges} />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center space-y-4">
                          <Workflow className="w-16 h-16 text-white/40 mx-auto" />
                          <div>
                            <p className="text-white/80 font-medium mb-1">Career Tree Visualization</p>
                            <p className="text-white/60 text-sm">Your career journey map will appear here as you progress</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </motion.div>
        )}
      </div>
      <SessionHistoryModal open={showHistory} onClose={() => setShowHistory(false)} onLoadSession={loadSession} />
    </div>
  );
}
