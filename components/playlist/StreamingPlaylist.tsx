'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Clock, 
  Eye, 
  CheckCircle2, 
  Loader2,
  Sparkles,
  TrendingUp,
  Youtube,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Video {
  id: string;
  topic: string;
  title: string;
  url: string;
  thumbnail: string;
  description: string;
  duration: string;
  channel: string;
  views: string;
  quality_score: number;
  order_priority: number;
}

interface Progress {
  current: number;
  total: number;
  percentage: number;
}

interface StreamingPlaylistProps {
  assessmentId: string;
  onComplete?: (videos: Video[]) => void;
}

export function StreamingPlaylist({ assessmentId, onComplete }: StreamingPlaylistProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentTopic, setCurrentTopic] = useState<string>('');
  const [status, setStatus] = useState<string>('idle');
  const [message, setMessage] = useState<string>('');
  const [progress, setProgress] = useState<Progress>({ current: 0, total: 0, percentage: 0 });
  const [error, setError] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const startStreaming = () => {
    if (isStreaming) return;
    
    setIsStreaming(true);
    setVideos([]);
    setError('');
    setStatus('connecting');
    setMessage('Connecting to server...');

    // Get token from localStorage (same key as apiClient uses)
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.error('No access token found');
      setError('Authentication token not found. Please login again.');
      setStatus('error');
      setIsStreaming(false);
      return;
    }

    // EventSource doesn't support custom headers, so pass token as query param
    const url = `http://localhost:8000/api/v1/assessments/${assessmentId}/playlist/stream?token=${encodeURIComponent(token)}`;
    console.log('Starting EventSource connection to:', url);
    
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = (event) => {
      console.log('EventSource connection opened:', event);
    };

    eventSource.onmessage = (event) => {
      console.log('Received SSE event:', event.data);
      try {
        const data = JSON.parse(event.data);
        console.log('Parsed data:', data);

        if (data.error) {
          console.error('Error from server:', data);
          setError(data.error);
          setStatus('error');
          eventSource.close();
          setIsStreaming(false);
          return;
        }

        setStatus(data.status);
        
        if (data.message) {
          setMessage(data.message);
        }

        if (data.topic) {
          setCurrentTopic(data.topic);
        }

        if (data.video) {
          setVideos(prev => [...prev, data.video]);
        }

        if (data.progress) {
          setProgress(data.progress);
        }

        if (data.status === 'completed') {
          console.log('Stream completed');
          eventSource.close();
          setIsStreaming(false);
          if (onComplete) {
            onComplete(videos);
          }
        }
      } catch (err) {
        console.error('Error parsing SSE data:', err, 'Raw data:', event.data);
      }
    };

    eventSource.onerror = (err) => {
      console.error('EventSource error:', err);
      console.log('EventSource readyState:', eventSource.readyState);
      setError('Connection error. Please try again.');
      setStatus('error');
      eventSource.close();
      setIsStreaming(false);
    };
  };

  const stopStreaming = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsStreaming(false);
    setStatus('stopped');
  };

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const getStatusIcon = () => {
    switch (status) {
      case 'started':
      case 'analyzing':
      case 'ai_processing':
      case 'topics_ready':
      case 'topic_started':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-600" />;
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'error':
        return <div className="h-5 w-5 text-red-600">❌</div>;
      default:
        return <Sparkles className="h-5 w-5 text-purple-600" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'started':
      case 'analyzing':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'ai_processing':
      case 'topics_ready':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'topic_started':
      case 'video_added':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'completed':
        return 'bg-emerald-100 text-emerald-700 border-emerald-300';
      case 'error':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  // Group videos by topic
  const videosByTopic = videos.reduce((acc, video) => {
    if (!acc[video.topic]) {
      acc[video.topic] = [];
    }
    acc[video.topic].push(video);
    return acc;
  }, {} as Record<string, Video[]>);

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-600 rounded-lg">
                <Youtube className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">AI-Powered Learning Playlist</CardTitle>
                <CardDescription>Personalized videos streaming in real-time</CardDescription>
              </div>
            </div>
            <div>
              {!isStreaming ? (
                <Button 
                  onClick={startStreaming}
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  <div className="flex items-center gap-2">
                    <Play className="h-5 w-5" />
                    <span>Generate Playlist</span>
                  </div>
                </Button>
              ) : (
                <Button 
                  onClick={stopStreaming}
                  variant="destructive"
                  size="lg"
                >
                  Stop Generation
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        {isStreaming && (
          <CardContent className="space-y-4">
            {/* Status Bar */}
            <div className={`p-4 rounded-lg border-2 ${getStatusColor()} flex items-center gap-3`}>
              {getStatusIcon()}
              <div className="flex-1">
                <p className="font-semibold">{message}</p>
                {currentTopic && (
                  <p className="text-sm opacity-75 mt-1">📚 Current Topic: {currentTopic}</p>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            {progress.total > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span>Progress: {progress.current} / {progress.total} videos</span>
                  <span>{progress.percentage}%</span>
                </div>
                <Progress value={progress.percentage} className="h-3" />
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-50 border-2 border-red-300 rounded-lg text-red-700"
        >
          <p className="font-semibold">❌ {error}</p>
        </motion.div>
      )}

      {/* Videos Display - Grouped by Topic */}
      <AnimatePresence>
        {Object.entries(videosByTopic).map(([topic, topicVideos], topicIdx) => (
          <motion.div
            key={topic}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: topicIdx * 0.1 }}
            className="space-y-3"
          >
            {/* Topic Header */}
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg border-2 border-purple-200">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <h3 className="font-bold text-lg text-purple-900">{topic}</h3>
              <Badge variant="secondary" className="ml-auto">
                {topicVideos.length} videos
              </Badge>
            </div>

            {/* Videos in Topic */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topicVideos.map((video, videoIdx) => (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ 
                    delay: videoIdx * 0.1,
                    type: "spring",
                    stiffness: 300,
                    damping: 20
                  }}
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-105 border-2 hover:border-purple-300">
                    {/* Thumbnail */}
                    <div className="relative aspect-video bg-gradient-to-br from-purple-100 to-blue-100">
                      {video.thumbnail ? (
                        <img 
                          src={video.thumbnail} 
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Youtube className="h-16 w-16 text-purple-400" />
                        </div>
                      )}
                      {video.duration && (
                        <Badge className="absolute bottom-2 right-2 bg-black/80 text-white">
                          <Clock className="h-3 w-3 mr-1" />
                          {video.duration}
                        </Badge>
                      )}
                    </div>

                    <CardContent className="p-4">
                      {/* Title */}
                      <h4 className="font-semibold text-sm line-clamp-2 mb-2 min-h-[40px]">
                        {video.title}
                      </h4>

                      {/* Channel & Views */}
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
                        <span className="truncate">{video.channel}</span>
                        {video.views && (
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {video.views}
                          </span>
                        )}
                      </div>

                      {/* Watch Button */}
                      <Button 
                        asChild 
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                        size="sm"
                      >
                        <a href={video.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                          <Play className="h-4 w-4" />
                          <span>Watch Now</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Completion Message */}
      {status === 'completed' && videos.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg text-center"
        >
          <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-3" />
          <h3 className="text-2xl font-bold text-green-900 mb-2">
            🎉 Playlist Generated Successfully!
          </h3>
          <p className="text-green-700">
            Found {videos.length} personalized videos across {Object.keys(videosByTopic).length} topics to help you improve
          </p>
        </motion.div>
      )}
    </div>
  );
}
