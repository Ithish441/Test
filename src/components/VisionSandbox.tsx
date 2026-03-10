'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Camera, 
  Play, 
  Pause, 
  RotateCcw, 
  Maximize2,
  Minimize2,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { FilesetResolver, HandLandmarker, HandLandmarkerResult } from '@mediapipe/tasks-vision';

interface VisionSandboxProps {
  patientId?: string;
  onSessionComplete?: (stats: VisionStats) => void;
}

interface VisionStats {
  duration: number;
  handDetections: number;
  avgConfidence: number;
  milestones: string[];
  rawData: HandLandmarkerResult | null;
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#0a0f1a',
    borderRadius: '12px',
    overflow: 'hidden',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    backgroundColor: '#111827',
    borderBottom: '1px solid #1f2937',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  title: {
    color: '#f9fafb',
    fontSize: '18px',
    fontWeight: 600,
    margin: 0,
  },
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 500,
  },
  controls: {
    display: 'flex',
    gap: '8px',
  },
  controlButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  videoContainer: {
    position: 'relative',
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  canvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  },
  overlay: {
    position: 'absolute',
    top: '16px',
    left: '16px',
    right: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    pointerEvents: 'none',
  },
  statsPanel: {
    backgroundColor: 'rgba(17, 24, 39, 0.85)',
    backdropFilter: 'blur(8px)',
    borderRadius: '10px',
    padding: '14px 18px',
    border: '1px solid #1f2937',
  },
  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#9ca3af',
    fontSize: '13px',
    marginBottom: '6px',
  },
  statValue: {
    color: '#f9fafb',
    fontWeight: 600,
    fontSize: '14px',
  },
  milestonePanel: {
    backgroundColor: 'rgba(17, 24, 39, 0.85)',
    backdropFilter: 'blur(8px)',
    borderRadius: '10px',
    padding: '14px 18px',
    border: '1px solid #1f2937',
    maxWidth: '280px',
  },
  milestoneTitle: {
    color: '#f9fafb',
    fontSize: '14px',
    fontWeight: 600,
    marginBottom: '10px',
  },
  milestoneItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#10b981',
    fontSize: '12px',
    marginBottom: '4px',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 20px',
    backgroundColor: '#111827',
    borderTop: '1px solid #1f2937',
  },
  sessionInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  sessionStat: {
    color: '#9ca3af',
    fontSize: '13px',
  },
  sessionStatValue: {
    color: '#f9fafb',
    fontWeight: 600,
  },
  permissionsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10, 15, 26, 0.95)',
    gap: '16px',
  },
  permissionText: {
    color: '#f9fafb',
    fontSize: '16px',
    textAlign: 'center',
    maxWidth: '300px',
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '8px',
    color: '#fca5a5',
    fontSize: '13px',
  },
};

export default function VisionSandbox({ patientId, onSessionComplete }: VisionSandboxProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const animationFrameRef = useRef<number>(0);
  const sessionStartRef = useRef<number>(0);
  
  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [stats, setStats] = useState<VisionStats>({
    duration: 0,
    handDetections: 0,
    avgConfidence: 0,
    milestones: [],
    rawData: null,
  });

  const detectHands = useCallback(async () => {
    if (!handLandmarkerRef.current || !videoRef.current || !canvasRef.current || !isRunning) return;

    const now = performance.now();
    const results = handLandmarkerRef.current.detectForVideo(videoRef.current, now);
    
    if (results.landmarks && results.landmarks.length > 0) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        results.landmarks.forEach((landmarks) => {
          ctx.strokeStyle = '#10b981';
          ctx.fillStyle = '#10b981';
          ctx.lineWidth = 2;
          
          const connections = [
            [0, 1], [1, 2], [2, 3], [3, 4],
            [0, 5], [5, 6], [6, 7], [7, 8],
            [0, 9], [9, 10], [10, 11], [11, 12],
            [0, 13], [13, 14], [14, 15], [15, 16],
            [0, 17], [17, 18], [18, 19], [19, 20],
          ];
          
          connections.forEach(([start, end]) => {
            const startPoint = landmarks[start];
            const endPoint = landmarks[end];
            ctx.beginPath();
            ctx.moveTo(startPoint.x * canvas.width, startPoint.y * canvas.height);
            ctx.lineTo(endPoint.x * canvas.width, endPoint.y * canvas.height);
            ctx.stroke();
          });
          
          landmarks.forEach((point) => {
            ctx.beginPath();
            ctx.arc(point.x * canvas.width, point.y * canvas.height, 4, 0, 2 * Math.PI);
            ctx.fill();
          });
        });
        
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 3;
        ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
      }
      
      setStats(prev => {
        const confidences = results.landmarks.flatMap(() => 
          results.worldLandmarks?.flatMap(wl => wl.map(l => l.x)) || []
        );
        const avgConf = confidences.length > 0 
          ? confidences.reduce((a, b) => a + Math.abs(b), 0) / confidences.length * 100 
          : 0;
        
        const duration = Math.floor((now - sessionStartRef.current) / 1000);
        const milestones = [...prev.milestones];
        
        if (duration >= 5 && !milestones.includes('5s milestone')) {
          milestones.push('5s milestone');
        }
        if (duration >= 30 && !milestones.includes('30s milestone')) {
          milestones.push('30s milestone');
        }
        if (results.landmarks.length >= 2 && !milestones.includes('both hands detected')) {
          milestones.push('both hands detected');
        }
        
        return {
          ...prev,
          duration,
          handDetections: prev.handDetections + results.landmarks.length,
          avgConfidence: (prev.avgConfidence * (prev.handDetections) + avgConf) / (prev.handDetections + results.landmarks.length),
          milestones,
          rawData: results,
        };
      });
    }
    
    animationFrameRef.current = requestAnimationFrame(detectHands);
  }, [isRunning]);

  const initializeVision = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );
      
      const handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: 2,
      });
      
      handLandmarkerRef.current = handLandmarker;
      setIsLoading(false);
    } catch (err) {
      setError('Failed to initialize vision model');
      setIsLoading(false);
    }
  }, []);

  const requestCameraPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
      });
      
      streamRef.current = stream;
      setHasPermission(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      setError('Camera access denied');
      setHasPermission(false);
    }
  }, []);

  const startSession = useCallback(() => {
    if (!handLandmarkerRef.current || !videoRef.current || !canvasRef.current) return;
    
    sessionStartRef.current = performance.now();
    setStats({
      duration: 0,
      handDetections: 0,
      avgConfidence: 0,
      milestones: [],
      rawData: null,
    });
    setIsRunning(true);
    
    if (videoRef.current && canvasRef.current) {
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
    }
  }, []);

  const stopSession = useCallback(() => {
    setIsRunning(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    if (onSessionComplete) {
      onSessionComplete(stats);
    }
  }, [stats, onSessionComplete]);

  const resetSession = useCallback(() => {
    setIsRunning(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    
    setStats({
      duration: 0,
      handDetections: 0,
      avgConfidence: 0,
      milestones: [],
      rawData: null,
    });
    sessionStartRef.current = 0;
  }, []);

  const toggleFullscreen = useCallback(() => {
    const container = document.getElementById('vision-sandbox-container');
    if (!container) return;
    
    if (!isFullscreen) {
      container.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, [isFullscreen]);

  useEffect(() => {
    initializeVision();
    
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [initializeVision]);

  useEffect(() => {
    if (isRunning) {
      animationFrameRef.current = requestAnimationFrame(detectHands);
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRunning, detectHands]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const getStatusColor = () => {
    if (isLoading) return { bg: 'rgba(59, 130, 246, 0.2)', text: '#60a5fa' };
    if (error) return { bg: 'rgba(239, 68, 68, 0.2)', text: '#fca5a5' };
    if (isRunning) return { bg: 'rgba(16, 185, 129, 0.2)', text: '#34d399' };
    return { bg: 'rgba(107, 114, 128, 0.2)', text: '#9ca3af' };
  };

  const statusColors = getStatusColor();

  return (
    <div id="vision-sandbox-container" style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <Activity color="#10b981" size={22} />
          <h2 style={styles.title}>Vision Sandbox</h2>
          <div style={{ ...styles.statusBadge, backgroundColor: statusColors.bg, color: statusColors.text }}>
            {isLoading ? <Loader2 size={12} className="spin" /> : error ? <AlertCircle size={12} /> : isRunning ? <Activity size={12} /> : <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: statusColors.text }} />}
            <span>{isLoading ? 'Loading' : error ? 'Error' : isRunning ? 'Recording' : 'Ready'}</span>
          </div>
        </div>
        
        <div style={styles.controls}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{ ...styles.controlButton, backgroundColor: '#1f2937' }}
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={18} color="#9ca3af" /> : <Maximize2 size={18} color="#9ca3af" />}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{ ...styles.controlButton, backgroundColor: '#1f2937' }}
            onClick={resetSession}
            title="Reset"
          >
            <RotateCcw size={18} color="#9ca3af" />
          </motion.button>
        </div>
      </div>

      <div style={styles.videoContainer}>
        {hasPermission === null && !isLoading && (
          <div style={styles.permissionsOverlay}>
            <Camera size={48} color="#6b7280" />
            <p style={styles.permissionText}>Allow camera access to begin clinical vision analysis</p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={requestCameraPermission}
              style={{
                padding: '12px 24px',
                backgroundColor: '#10b981',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Enable Camera
            </motion.button>
          </div>
        )}
        
        <video
          ref={videoRef}
          style={{ ...styles.video, display: hasPermission ? 'block' : 'none' }}
          playsInline
          muted
        />
        <canvas ref={canvasRef} style={styles.canvas} />
        
        <div style={styles.overlay}>
          <div style={styles.statsPanel}>
            <div style={styles.statItem}>
              <Activity size={14} />
              <span>FPS:</span>
              <span style={styles.statValue}>{isRunning ? '60' : '--'}</span>
            </div>
            <div style={styles.statItem}>
              <Camera size={14} />
              <span>Hands:</span>
              <span style={styles.statValue}>{stats.handDetections > 0 ? 'Detected' : '--'}</span>
            </div>
            <div style={styles.statItem}>
              <CheckCircle2 size={14} />
              <span>Confidence:</span>
              <span style={styles.statValue}>{stats.avgConfidence > 0 ? `${stats.avgConfidence.toFixed(1)}%` : '--'}</span>
            </div>
          </div>
          
          <AnimatePresence>
            {stats.milestones.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={styles.milestonePanel}
              >
                <div style={styles.milestoneTitle}>Milestones Achieved</div>
                {stats.milestones.map((milestone, idx) => (
                  <div key={idx} style={styles.milestoneItem}>
                    <CheckCircle2 size={14} />
                    <span>{milestone}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {error && (
          <div style={{ position: 'absolute', bottom: 80, left: 16, right: 16 }}>
            <div style={styles.errorAlert}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          </div>
        )}
      </div>

      <div style={styles.footer}>
        <div style={styles.sessionInfo}>
          <div style={styles.sessionStat}>
            Duration: <span style={styles.sessionStatValue}>{Math.floor(stats.duration / 60)}:{(stats.duration % 60).toString().padStart(2, '0')}</span>
          </div>
          <div style={styles.sessionStat}>
            Patient: <span style={styles.sessionStatValue}>{patientId ? patientId.slice(0, 8) : 'Not assigned'}</span>
          </div>
        </div>
        
        <div style={styles.controls}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={isRunning ? stopSession : startSession}
            disabled={!hasPermission || isLoading}
            style={{
              ...styles.controlButton,
              width: 'auto',
              padding: '0 20px',
              gap: '8px',
              backgroundColor: isRunning ? '#ef4444' : '#10b981',
              opacity: !hasPermission || isLoading ? 0.5 : 1,
            }}
          >
            {isRunning ? (
              <>
                <Pause size={18} color="#fff" />
                <span style={{ color: '#fff', fontSize: '14px', fontWeight: 500 }}>Stop</span>
              </>
            ) : (
              <>
                <Play size={18} color="#fff" />
                <span style={{ color: '#fff', fontSize: '14px', fontWeight: 500 }}>Start</span>
              </>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
