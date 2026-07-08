'use client';

import { type RefCallback, useState, useRef } from 'react';
import { AlertCircle, Loader2, Video, VideoOff } from 'lucide-react';
import type { ExamCameraStatus } from '@/hooks/useExamCamera';

interface ExamCameraPanelProps {
    videoRef: RefCallback<HTMLVideoElement>;
    status: ExamCameraStatus;
    onEnableCamera: () => void | Promise<void | boolean>;
    variant?: 'setup' | 'floating' | 'sidebar' | 'header';
    className?: string;
}

function CameraVideo({
    videoRef,
    isActive,
    inactiveClassName = 'opacity-0',
    className = '',
}: {
    videoRef: RefCallback<HTMLVideoElement>;
    isActive: boolean;
    inactiveClassName?: string;
    className?: string;
}) {
    return (
        <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover scale-x-[-1] ${isActive ? 'opacity-100' : inactiveClassName} ${className}`}
        />
    );
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
    const isSidebar = variant === 'sidebar';
    const isHeader = variant === 'header';
    const isActive = status === 'active';

    const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
    const draggingRef = useRef(false);
    const offsetRef = useRef({ x: 0, y: 0 });

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;
        if (target.closest('button')) return;

        draggingRef.current = true;
        const rect = e.currentTarget.getBoundingClientRect();
        offsetRef.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!draggingRef.current) return;
        const newX = e.clientX - offsetRef.current.x;
        const newY = e.clientY - offsetRef.current.y;

        const clampedX = Math.max(8, Math.min(newX, window.innerWidth - 180));
        const clampedY = Math.max(8, Math.min(newY, window.innerHeight - 120));

        setPos({ x: clampedX, y: clampedY });
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        draggingRef.current = false;
        e.currentTarget.releasePointerCapture(e.pointerId);
    };

    if (isHeader) {
        return (
            <div
                className={`relative w-28 h-11 bg-gray-900 rounded-lg overflow-hidden border border-white/20 shrink-0 ${className}`}
                aria-label="Exam camera preview"
            >
                <CameraVideo videoRef={videoRef} isActive={isActive} />
                {!isActive && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                        <VideoOff className="w-4 h-4" />
                    </div>
                )}
                {isActive && (
                    <div className="absolute top-1 left-1 flex items-center gap-1 bg-red-600/90 text-white text-[8px] font-bold px-1 py-0.5 rounded">
                        <span className="w-1 h-1 bg-white rounded-full animate-pulse" />
                        REC
                    </div>
                )}
            </div>
        );
    }

    if (isSidebar) {
        return (
            <div
                className={`relative w-32 h-24 bg-gray-900 rounded-xl overflow-hidden shadow-sm flex-shrink-0 border border-gray-700 ${className}`}
                aria-label="Exam camera preview"
            >
                <CameraVideo videoRef={videoRef} isActive={isActive} />
                {!isActive && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 gap-1 p-1 text-center">
                        <VideoOff className="w-6 h-6" />
                    </div>
                )}
                {!isActive && (
                    <button
                        type="button"
                        onClick={() => void onEnableCamera()}
                        disabled={status === 'requesting'}
                        title={status === 'requesting' ? 'Starting camera…' : 'Turn camera on'}
                        className="absolute inset-0 flex items-center justify-center bg-black/40 text-white text-[10px] font-semibold disabled:opacity-60"
                    >
                        {status === 'requesting' ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            'Enable'
                        )}
                    </button>
                )}
            </div>
        );
    }

    if (isSetup) {
        return (
            <div
                className={`rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/10 p-5 ${className}`}
            >
                <div className="flex flex-col gap-4">
                    <div className="relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden shrink-0 border border-gray-700 mx-auto max-w-[280px]">
                        <CameraVideo videoRef={videoRef} isActive={isActive} />
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
                    <div className="space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-lg shrink-0">
                                <Video className="w-5 h-5 text-amber-700 dark:text-amber-400" />
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
                        <div className="flex items-center justify-between pt-1">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Status: <span className="font-semibold">{statusLabel(status)}</span>
                            </p>
                            {!isActive && (
                                <button
                                    type="button"
                                    onClick={() => void onEnableCamera()}
                                    disabled={status === 'requesting'}
                                    className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition disabled:opacity-60"
                                >
                                    {status === 'requesting' ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Enabling…
                                        </>
                                    ) : (
                                        <>
                                            <Video className="w-4 h-4" />
                                            Enable camera
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                        {(status === 'denied' || status === 'unavailable' || status === 'lost') && (
                            <p className="text-sm text-red-600 dark:text-red-400 flex items-start gap-2 pt-2 border-t border-red-100 dark:border-red-950">
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                Check site permissions and ensure no other app is using the camera.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            style={pos ? { left: `${pos.x}px`, top: `${pos.y}px`, bottom: 'auto', right: 'auto' } : undefined}
            className={`fixed bottom-4 left-4 z-[10001] w-44 sm:w-52 shadow-2xl rounded-xl overflow-hidden border-2 border-gray-800 bg-gray-900 cursor-grab active:cursor-grabbing touch-none select-none ${className}`}
            aria-label="Exam camera preview"
        >
            <div className="relative aspect-video bg-black">
                <CameraVideo videoRef={videoRef} isActive={isActive} inactiveClassName="opacity-30" />
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
