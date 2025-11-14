"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import {
  Play,
  ExternalLink,
  Youtube,
  GraduationCap,
  Clock,
  TrendingUp,
  Filter,
  Sparkles,
  AlertCircle,
  BookOpen,
  Target,
  Video,
} from "lucide-react";

interface Video {
  id?: string;
  title: string;
  url: string;
  thumbnail?: string;
  duration?: string;
  channel?: string;
  views?: string;
  platform: string;
  quality_score?: number;
  rating?: string;
  price?: string;
}

interface PlaylistItem {
  topic: string;
  videos: Video[];
}

interface PlaylistTabProps {
  assessmentId: string;
}

export default function PlaylistTab({ assessmentId }: PlaylistTabProps) {
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [platformFilter, setPlatformFilter] = useState<string>("all");

  // Fetch playlist on mount
  React.useEffect(() => {
    loadPlaylist();
  }, [assessmentId]);

  const loadPlaylist = async () => {
    setLoading(true);
    setError(null);
    try {
      const { apiClient } = await import("@/lib/api");
      const data = await apiClient.getAssessmentPlaylist(assessmentId);
      setPlaylist(data.playlist || []);

      // Auto-select first topic
      if (data.playlist && data.playlist.length > 0) {
        setActiveTopic(data.playlist[0].topic);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load playlist");
    } finally {
      setLoading(false);
    }
  };

  const generatePlaylist = async () => {
    setGenerating(true);
    setError(null);
    try {
      const { apiClient } = await import("@/lib/api");
      const toast = (await import("react-hot-toast")).default;

      // Call complete assessment endpoint to trigger playlist generation
      toast.loading("Generating your personalized playlist...", {
        duration: 2000,
      });

      try {
        await apiClient.completeAssessment(assessmentId);
      } catch (err: any) {
        // If already completed, that's okay - just proceed to load
        if (!err.message?.includes("already completed")) {
          throw err;
        }
      }

      // Poll for playlist with exponential backoff
      const maxAttempts = 5;
      let attempt = 0;
      let playlistData: any = null;

      while (attempt < maxAttempts) {
        attempt++;
        const waitTime = Math.min(2000 * attempt, 8000); // 2s, 4s, 6s, 8s, 8s

        await new Promise((resolve) => setTimeout(resolve, waitTime));

        try {
          playlistData = await apiClient.getAssessmentPlaylist(assessmentId);

          if (playlistData.playlist && playlistData.playlist.length > 0) {
            // Success! Playlist generated
            setPlaylist(playlistData.playlist);
            if (playlistData.playlist[0]?.topic) {
              setActiveTopic(playlistData.playlist[0].topic);
            }
            toast.success("🎉 Playlist generated successfully!");
            return;
          }
        } catch (err) {
          console.error(`Attempt ${attempt} failed:`, err);
        }

        if (attempt < maxAttempts) {
          toast.loading(`Generating playlist... (${attempt}/${maxAttempts})`, {
            duration: waitTime,
          });
        }
      }

      // If we get here, generation didn't complete in time
      toast.error(
        "Playlist is taking longer than expected. Please refresh the page in a moment.",
      );
      setError(
        "Playlist generation is in progress. Please refresh in 30 seconds.",
      );
    } catch (err) {
      const toast = (await import("react-hot-toast")).default;
      console.error("Failed to generate playlist:", err);
      toast.error("Failed to generate playlist. Please try again.");
      setError(
        err instanceof Error ? err.message : "Failed to generate playlist",
      );
    } finally {
      setGenerating(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "youtube":
        return Youtube;
      case "udemy":
        return GraduationCap;
      default:
        return ExternalLink;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case "youtube":
        return "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/20 dark:text-red-400";
      case "udemy":
        return "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/20 dark:text-purple-400";
      default:
        return "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/20 dark:text-blue-400";
    }
  };

  const getQualityBadgeColor = (score?: number) => {
    if (!score) return "bg-gray-100 text-gray-600";
    if (score >= 0.9) return "bg-green-100 text-green-700";
    if (score >= 0.8) return "bg-yellow-100 text-yellow-700";
    return "bg-orange-100 text-orange-700";
  };

  const filteredPlaylist = playlist
    .map((item) => ({
      ...item,
      videos: item.videos.filter(
        (v) => platformFilter === "all" || v.platform === platformFilter,
      ),
    }))
    .filter((item) => item.videos.length > 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader size="lg" />
        <p className="text-gray-600 dark:text-gray-400 animate-pulse">
          Loading your personalized learning playlist...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-2 border-red-200 bg-red-50 dark:bg-red-900/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (playlist.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950">
          <CardContent className="pt-16 pb-16">
            <div className="flex flex-col items-center justify-center text-center space-y-6 max-w-2xl mx-auto">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-2xl opacity-20 animate-pulse" />
                <div className="relative p-6 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full">
                  <BookOpen className="h-16 w-16 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  No Learning Resources Yet
                </h3>
                <p className="text-base text-gray-600 dark:text-gray-400">
                  Your personalized learning playlist will be generated
                  automatically after completing your assessment. We'll curate
                  the best videos to help you improve in areas that need
                  attention.
                </p>
              </div>
              <div className="pt-2">
                <Button
                  onClick={generatePlaylist}
                  disabled={generating || loading}
                  size="lg"
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {generating ? (
                    <>
                      <Loader className="mr-2 h-5 w-5 animate-spin" />
                      Generating Playlist...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Generate My Playlist Now
                    </>
                  )}
                </Button>
              </div>
              <div className="flex items-center gap-8 pt-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Target className="h-5 w-5 text-blue-500" />
                  <span>Targeted Topics</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Video className="h-5 w-5 text-purple-500" />
                  <span>Quality Content</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Sparkles className="h-5 w-5 text-yellow-500" />
                  <span>AI-Curated</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group">
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-blue-400/20 to-cyan-400/10 blur-3xl group-hover:blur-[50px] transition-all duration-500" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-gradient-to-br from-blue-300/15 to-teal-300/10 blur-2xl group-hover:blur-3xl transition-all duration-500" />
            <CardContent className="relative z-10 pt-6 pb-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                  <GraduationCap className="h-7 w-7 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Learning Topics
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {playlist.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group">
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-purple-400/20 to-pink-400/10 blur-3xl group-hover:blur-[50px] transition-all duration-500" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-gradient-to-br from-purple-300/15 to-fuchsia-300/10 blur-2xl group-hover:blur-3xl transition-all duration-500" />
            <CardContent className="relative z-10 pt-6 pb-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
                  <Play className="h-7 w-7 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Total Videos
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {playlist.reduce(
                      (sum, item) => sum + item.videos.length,
                      0,
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group">
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-green-400/20 to-emerald-400/10 blur-3xl group-hover:blur-[50px] transition-all duration-500" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-gradient-to-br from-green-300/15 to-teal-300/10 blur-2xl group-hover:blur-3xl transition-all duration-500" />
            <CardContent className="relative z-10 pt-6 pb-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
                  <TrendingUp className="h-7 w-7 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Platforms
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {
                      new Set(
                        playlist.flatMap((item) =>
                          item.videos.map((v) => v.platform),
                        ),
                      ).size
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950 dark:via-purple-950 dark:to-pink-950">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg shadow-md">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  AI-Curated Learning Resources
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  These videos are personalized based on your assessment
                  performance to help you improve in specific areas.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card className="relative overflow-hidden border-0 shadow-md bg-gradient-to-br from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br from-blue-200/10 to-purple-200/10 blur-2xl" />
          <CardContent className="relative z-10 pt-5 pb-5">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Filter by Platform:
                </span>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant={platformFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPlatformFilter("all")}
                  className={
                    platformFilter === "all"
                      ? "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-md border-0"
                      : "hover:border-blue-300 dark:hover:border-blue-700"
                  }
                >
                  All Platforms
                </Button>
                <Button
                  variant={platformFilter === "youtube" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPlatformFilter("youtube")}
                  className={
                    platformFilter === "youtube"
                      ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-md border-0"
                      : "hover:border-red-300 dark:hover:border-red-700"
                  }
                >
                  <Youtube className="h-4 w-4 mr-2" />
                  YouTube
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Topics Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
          {filteredPlaylist.map((item, idx) => (
            <Button
              key={idx}
              variant={activeTopic === item.topic ? "default" : "outline"}
              onClick={() => setActiveTopic(item.topic)}
              className={`whitespace-nowrap transition-all duration-300 min-w-fit ${
                activeTopic === item.topic
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg scale-105 border-0"
                  : "hover:border-blue-300 dark:hover:border-blue-700 hover:scale-105"
              }`}
            >
              <div className="flex items-center gap-2 px-2">
                <span className="font-medium">{item.topic}</span>
                <Badge
                  variant="secondary"
                  className={
                    activeTopic === item.topic
                      ? "bg-white/25 text-white border-0"
                      : "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                  }
                >
                  {item.videos.length}
                </Badge>
              </div>
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Videos Grid */}
      {activeTopic &&
        (() => {
          const activeItem = filteredPlaylist.find(
            (item) => item.topic === activeTopic,
          );
          if (!activeItem || activeItem.videos.length === 0) {
            return (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card className="border-2 border-dashed border-gray-300 dark:border-gray-700">
                  <CardContent className="pt-16 pb-16 text-center">
                    <div className="flex flex-col items-center space-y-3">
                      <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full">
                        <AlertCircle className="h-10 w-10 text-gray-400" />
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 text-lg">
                        No videos found for this topic with the selected
                        filters.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          }

          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {activeItem.videos.map((video, idx) => {
                const PlatformIcon = getPlatformIcon(video.platform);

                return (
                  <motion.div
                    key={video.id || idx}
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      duration: 0.4,
                      delay: idx * 0.08,
                      type: "spring",
                      stiffness: 100,
                    }}
                  >
                    <Card
                      className="relative overflow-hidden group hover:shadow-2xl transition-all duration-500 cursor-pointer border-0 shadow-lg hover:scale-[1.03] h-full flex flex-col"
                      onClick={() => window.open(video.url, "_blank")}
                    >
                      {/* Background decorative shapes */}
                      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br from-blue-300/20 to-purple-300/20 blur-3xl group-hover:blur-[40px] group-hover:scale-150 transition-all duration-700" />
                      <div className="absolute -bottom-10 -left-10 w-28 h-28 rounded-full bg-gradient-to-br from-pink-300/15 to-purple-300/15 blur-2xl group-hover:blur-3xl group-hover:scale-150 transition-all duration-700" />

                      {/* Thumbnail */}
                      <div className="relative z-10 w-full h-52 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-900 overflow-hidden">
                        {video.thumbnail ? (
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <Play className="h-20 w-20 text-gray-400" />
                          </div>
                        )}

                        {/* Duration Badge */}
                        {video.duration && (
                          <div className="absolute bottom-3 right-3 bg-black/90 text-white px-3 py-1.5 rounded-md text-sm flex items-center gap-1.5 font-medium shadow-lg backdrop-blur-sm">
                            <Clock className="h-3.5 w-3.5" />
                            {video.duration}
                          </div>
                        )}

                        {/* Quality Badge */}
                        {video.quality_score && video.quality_score >= 0.9 && (
                          <div className="absolute top-3 left-3">
                            <Badge
                              className={`${getQualityBadgeColor(video.quality_score)} border-0 shadow-lg`}
                            >
                              ⭐ Top Rated
                            </Badge>
                          </div>
                        )}

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm p-4 rounded-full transform scale-0 group-hover:scale-100 transition-transform duration-500">
                            <Play className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                          </div>
                        </div>
                      </div>

                      <CardContent className="relative z-10 p-5 flex-1 flex flex-col">
                        {/* Platform Badge */}
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          <Badge
                            variant="outline"
                            className={`${getPlatformColor(video.platform)} text-xs font-medium border-2`}
                          >
                            <PlatformIcon className="h-3.5 w-3.5 mr-1.5" />
                            {video.platform}
                          </Badge>
                          {video.rating && (
                            <Badge
                              variant="secondary"
                              className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 border-0"
                            >
                              ⭐ {video.rating}
                            </Badge>
                          )}
                          {video.price && (
                            <Badge
                              variant="secondary"
                              className="text-xs bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-0"
                            >
                              ₹{video.price}
                            </Badge>
                          )}
                        </div>

                        {/* Title */}
                        <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-3 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 text-base leading-snug flex-grow">
                          {video.title}
                        </h4>

                        {/* Meta Info */}
                        <div className="flex flex-col gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                          {video.channel && (
                            <p className="flex items-center gap-2 font-medium truncate">
                              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                              <span className="truncate">{video.channel}</span>
                            </p>
                          )}
                          {video.views && (
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              {video.views}
                            </p>
                          )}
                        </div>

                        {/* Action Button */}
                        <Button
                          size="sm"
                          className="w-full mt-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 group/btn"
                          variant="outline"
                        >
                          <div className="flex items-center justify-center gap-2 py-1">
                            <Play className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />
                            <span className="font-semibold">Watch Now</span>
                            <ExternalLink className="h-3.5 w-3.5 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                          </div>
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          );
        })()}
    </div>
  );
}
