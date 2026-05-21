'use client';

import { useCallback, useRef, useState, type RefCallback } from 'react';
import toast from 'react-hot-toast';

export type ExamCameraStatus =
    | 'idle'
    | 'requesting'
    | 'active'
    | 'denied'
    | 'unavailable'
    | 'lost';

export function useExamCamera() {
    const videoElementRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [status, setStatus] = useState<ExamCameraStatus>('idle');

    const bindStreamToVideo = useCallback(async (video: HTMLVideoElement | null) => {
        if (!video) return;
        const stream = streamRef.current;
        if (!stream) {
            video.srcObject = null;
            return;
        }
        if (video.srcObject !== stream) {
            video.srcObject = stream;
        }
        video.muted = true;
        try {
            await video.play();
        } catch {
            /* autoplay policy — preview may need user gesture */
        }
    }, []);

    /** Re-attaches when the <video> node mounts (e.g. setup → exam sidebar). */
    const videoRef: RefCallback<HTMLVideoElement> = useCallback(
        (node) => {
            videoElementRef.current = node;
            void bindStreamToVideo(node);
        },
        [bindStreamToVideo]
    );

    const attachStreamToVideo = useCallback(async () => {
        await bindStreamToVideo(videoElementRef.current);
    }, [bindStreamToVideo]);

    const stopCamera = useCallback(() => {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        if (videoElementRef.current) {
            videoElementRef.current.srcObject = null;
        }
        setStatus('idle');
    }, []);

    const startCamera = useCallback(async (): Promise<boolean> => {
        if (status === 'active' && streamRef.current?.active) {
            await attachStreamToVideo();
            return true;
        }

        setStatus('requesting');

        if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
            setStatus('unavailable');
            toast.error('Camera is not supported in this browser.');
            return false;
        }

        try {
            streamRef.current?.getTracks().forEach((track) => track.stop());

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user',
                    width: { ideal: 640, max: 1280 },
                    height: { ideal: 480, max: 720 },
                },
                audio: false,
            });

            streamRef.current = stream;
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.onended = () => setStatus('lost');
            }

            setStatus('active');
            await attachStreamToVideo();
            return true;
        } catch (err: unknown) {
            const name = (err as { name?: string })?.name ?? '';
            if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
                setStatus('unavailable');
                toast.error('No camera found. Please connect a webcam and try again.');
            } else if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
                setStatus('denied');
                toast.error('Camera access is required to take this assessment.');
            } else {
                setStatus('denied');
                toast.error('Could not access the camera. Please allow access and try again.');
            }
            return false;
        }
    }, [status, attachStreamToVideo]);

    return {
        videoRef,
        status,
        startCamera,
        stopCamera,
        isCameraActive: status === 'active',
        isCameraPending: status === 'requesting',
    };
}
