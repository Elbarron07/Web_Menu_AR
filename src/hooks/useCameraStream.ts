import { useState, useEffect, useRef } from 'react';
import { logger } from '../lib/logger';

interface UseCameraStreamReturn {
  stream: MediaStream | null;
  error: string | null;
  isLoading: boolean;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
}

export const useCameraStream = (): UseCameraStreamReturn => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      streamRef.current = mediaStream;
      setStream(mediaStream);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur camera';
      setError(errorMessage);
      logger.error('[useCameraStream] Erreur');
    } finally {
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setStream(null);
    }
  };

  // Nettoyer le flux au démontage
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return {
    stream,
    error,
    isLoading,
    startCamera,
    stopCamera
  };
};
