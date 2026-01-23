'use client';

import { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';

export default function WebcamContainer({ onAnxietyUpdate, className = "w-full max-w-2xl mx-auto", showOverlay = true }) {
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [emotions, setEmotions] = useState(null);
    const [anxietyScore, setAnxietyScore] = useState(0);
    const detectionIntervalRef = useRef(null);

    // ... (rest of logic remains same until return)

    // Load face-api.js models - kept same
    useEffect(() => {
        const loadModels = async () => {
            // ...
            try {
                const MODEL_URL = '/models';
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
                ]);
                setModelsLoaded(true);
            } catch (error) {
                console.error('Error loading face-api.js models:', error);
            }
        };
        loadModels();
    }, []);

    // ... detection loop ... (kept same)
    useEffect(() => {
        if (!modelsLoaded) return;
        const detectEmotions = async () => {
            try {
                if (webcamRef.current?.video?.readyState === 4) {
                    const video = webcamRef.current.video;
                    const canvas = canvasRef.current;
                    const displaySize = { width: video.videoWidth, height: video.videoHeight };
                    faceapi.matchDimensions(canvas, displaySize);
                    const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceExpressions();

                    if (detections && detections.length > 0) {
                        const first = detections[0];
                        // Validate bounding box
                        if (first && first.detection && first.detection.box &&
                            first.detection.box.x != null && first.detection.box.y != null) {
                            const expressions = first.expressions;
                            setEmotions(expressions);
                            const fear = expressions.fear || 0;
                            const sad = expressions.sad || 0;
                            const anxietyLevel = (fear * 0.7 + sad * 0.3);
                            setAnxietyScore(anxietyLevel);
                            if (onAnxietyUpdate) onAnxietyUpdate(anxietyLevel);

                            const resizedDetections = faceapi.resizeResults(detections, displaySize);
                            const ctx = canvas.getContext('2d');
                            ctx.clearRect(0, 0, canvas.width, canvas.height);

                            // Safely draw detections
                            try {
                                faceapi.draw.drawDetections(canvas, resizedDetections);
                            } catch (drawError) {
                                // Silently ignore drawing errors (invalid bounding boxes)
                            }
                        }
                    }
                }
            } catch (error) {
                // Silently handle detection errors to avoid console spam
            }
        };
        detectionIntervalRef.current = setInterval(detectEmotions, 500);
        return () => clearInterval(detectionIntervalRef.current);
    }, [modelsLoaded, onAnxietyUpdate]);

    return (
        <div className={`relative ${className}`}>
            <div className={`relative overflow-hidden shadow-2xl ${className.includes('h-full') ? 'h-full rounded-none border-none' : 'rounded-xl border border-blue-500/30'}`}>
                <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    className="w-full h-full object-cover"
                    videoConstraints={{
                        width: 1280,
                        height: 720,
                        facingMode: 'user',
                    }}
                />
                <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 w-full h-full"
                />

                {/* Overlay with emotion data - conditional */}
                {showOverlay && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 z-10">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-gray-400 mb-1">Status</p>
                                <p className="text-sm font-medium text-white">
                                    {modelsLoaded ? '🟢 Detecting' : '🟡 Loading models...'}
                                </p>
                            </div>

                            {emotions && (
                                <div>
                                    <p className="text-xs text-gray-400 mb-1">Anxiety Level</p>
                                    <div className="flex items-center gap-2">
                                        <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-300 ${anxietyScore > 0.6
                                                    ? 'bg-red-500'
                                                    : anxietyScore > 0.3
                                                        ? 'bg-yellow-500'
                                                        : 'bg-green-500'
                                                    }`}
                                                style={{ width: `${anxietyScore * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-sm font-mono text-white">
                                            {(anxietyScore * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Emotion breakdown */}
                        {emotions && (
                            <div className="mt-3 grid grid-cols-4 gap-2">
                                {Object.entries(emotions).map(([emotion, value]) => (
                                    <div key={emotion} className="text-center">
                                        <p className="text-xs text-gray-400 capitalize">{emotion}</p>
                                        <p className="text-xs font-mono text-white">
                                            {(value * 100).toFixed(0)}%
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
