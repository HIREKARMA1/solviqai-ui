'use client';

import { RefObject, type LegacyRef } from 'react';
import { AlertCircle, Loader2, Video, VideoOff } from 'lucide-react';
import type { ExamCameraStatus } from '@/hooks/useExamCamera';

interface ExamCameraPanelProps {
    videoRef: RefObject<HTMLVideoElement | null> | LegacyRef<HTMLVideoElement>;
    status: ExamCameraStatus;
    onEnableCamera: () => void | Promise<void | boolean>;
    variant?: 'setup' | 'floating';
    className?: string;
}

function statusLabel(status: ExamCameraStatus): string {
    switch (status) {
        case 'active':
            return 'Camera on';
        case 'requesting':
            return 'Starting camera…';
        case 'denied':
            return 'Camera blocked';
        case 'unavailable':
            return 'No camera found';
        case 'lost':
            return 'Camera disconnected';
        default:
            return 'Camera off';
    }
}

export function ExamCameraPanel({
    videoRef,
    status,
    onEnableCamera,
    variant = 'floating',
    className = '',
}: ExamCameraPanelProps) {
    const isSetup = variant === 'setup';
    const isActive = status === 'active';

    if (isSetup) {
        return (
            <div
                className={`rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/10 p-5 ${className}`}
            >
                <div className="flex flex-col md:flex-row gap-5 items-start">
                    <div className="relative w-full md:w-72 aspect-video bg-gray-900 rounded-lg overflow-hidden shrink-0 border border-gray-700">
                        <video
                            ref={videoRef as LegacyRef<HTMLVideoElement>}
                            autoPlay
                            playsInline
                            muted
                            className={`w-full h-full object-cover scale-x-[-1] ${isActive ? 'opacity-100' : 'opacity-0'}`}
                        />
                        {!isActive && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 gap-2 p-4 text-center">
                                <VideoOff className="w-10 h-10" />
                                <p className="text-sm">Camera preview will appear here</p>
                            </div>
                        )}
                        {isActive && (
                            <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-red-600/90 text-white text-xs font-bold px-2 py-1 rounded-full">
                                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                LIVE
                            </div>
                        )}
                    </div>
                    <div className="flex-1 space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-lg shrink-0">
                                <Video className="w-6 h-6 text-amber-700 dark:text-amber-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                                    Camera required
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                    Your webcam must stay on for the entire assessment. Enable the camera
                                    before you begin; it will remain active through every round.
                                </p>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Status: <span className="font-semibold">{statusLabel(status)}</span>
                        </p>
                        {!isActive && (
                            <button
                                type="button"
                                onClick={() => void onEnableCamera()}
                                disabled={status === 'requesting'}
                                className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition disabled:opacity-60"
                            >
                                {status === 'requesting' ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Enabling camera…
                                    </>
                                ) : (
                                    <>
                                        <Video className="w-4 h-4" />
                                        Enable camera
                                    </>
                                )}
                            </button>
                        )}
                        {(status === 'denied' || status === 'unavailable' || status === 'lost') && (
                            <p className="text-sm text-red-600 dark:text-red-400 flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                Check browser site permissions and ensure no other app is using the camera.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`fixed bottom-4 left-4 z-[10001] w-44 sm:w-52 shadow-2xl rounded-xl overflow-hidden border-2 border-gray-800 bg-gray-900 ${className}`}
            aria-label="Exam camera preview"
        >
            <div className="relative aspect-video bg-black">
                <video
                    ref={videoRef as LegacyRef<HTMLVideoElement>}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover scale-x-[-1] ${isActive ? 'opacity-100' : 'opacity-30'}`}
                />
                {!isActive && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <VideoOff className="w-8 h-8 text-gray-500" />
                    </div>
                )}
                <div
                    className={`absolute top-1.5 left-1.5 flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isActive ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300'
                    }`}
                >
                    {isActive && <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
                    {isActive ? 'REC' : 'OFF'}
                </div>
            </div>
            {!isActive && (
                <button
                    type="button"
                    onClick={() => void onEnableCamera()}
                    disabled={status === 'requesting'}
                    className="w-full text-xs font-semibold py-2 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60"
                >
                    {status === 'requesting' ? 'Starting…' : 'Turn camera on'}
                </button>
            )}
        </div>
    );
}
