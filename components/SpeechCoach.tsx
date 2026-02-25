'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2, Play, RefreshCw, AlertCircle, Volume2, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });

export default function SpeechCoach() {
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  const [liveTranscript, setLiveTranscript] = useState<{text: string, isFinal: boolean}[]>([]);
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const drawVisualizer = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;
        canvasCtx.fillStyle = `rgb(${barHeight + 100}, 99, 235)`;
        canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };
    draw();
  };

  const startRecording = async () => {
    try {
      setError(null);
      setFeedback(null);
      setAudioUrl(null);
      setRecordingDuration(0);
      setLiveTranscript([]);
      setInterimTranscript('');
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Setup Web Audio API for visualizer
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const audioContext = new AudioContextClass();
        audioContextRef.current = audioContext;
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        // We delay drawing slightly to ensure canvas is rendered
        setTimeout(drawVisualizer, 100);
      }

      // Setup Web Speech API for live transcription
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.onresult = (event: any) => {
          let interim = '';
          const finalTranscripts: {text: string, isFinal: boolean}[] = [];
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscripts.push({ text: event.results[i][0].transcript, isFinal: true });
            } else {
              interim += event.results[i][0].transcript;
            }
          }
          if (finalTranscripts.length > 0) {
            setLiveTranscript(prev => [...prev, ...finalTranscripts]);
          }
          setInterimTranscript(interim);
        };
        recognition.start();
        recognitionRef.current = recognition;
      }

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        await analyzeAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Could not access the microphone. Please ensure you have granted permission.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
      if (recognitionRef.current) recognitionRef.current.stop();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    }
  };

  const analyzeAudio = async (audioBlob: Blob) => {
    setIsAnalyzing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        const base64String = base64data.split(',')[1];
        const mimeType = audioBlob.type || 'audio/webm';

        const prompt = `
          You are an expert speech and communication coach. 
          Listen to the provided audio and provide a detailed analysis to help the speaker improve.
          
          Please structure your response exactly as follows using Markdown:
          
          ### Transcription
          [Provide a highly accurate transcription of what was said, including filler words like "um", "uh", "like", etc.]
          
          ### Overall Impression
          [A brief summary of the speaker's tone, clarity, and confidence.]
          
          ### Strengths
          [Highlight what the speaker did well.]
          
          ### Areas for Improvement
          [Provide constructive feedback on:
          - Pacing (too fast, too slow)
          - Filler words (count and impact)
          - Pronunciation and enunciation
          - Grammar and vocabulary usage]
          
          ### Targeted Exercises
          [Provide 2-3 specific, actionable exercises tailored to the speaker's needs. MUST include at least one Articulation Exercise (e.g., tongue twisters, vowel shaping) and one Pacing/Breathing exercise.]
        `;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            {
              inlineData: {
                data: base64String,
                mimeType: mimeType,
              },
            },
            { text: prompt }
          ],
        });

        setFeedback(response.text || 'No feedback provided.');
        setIsAnalyzing(false);
      };
    } catch (err) {
      console.error('Error analyzing audio:', err);
      setError('An error occurred while analyzing the audio. Please try again.');
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setFeedback(null);
    setAudioUrl(null);
    setError(null);
    setRecordingDuration(0);
    setLiveTranscript([]);
    setInterimTranscript('');
  };

  const highlightFillerWords = (text: string) => {
    if (!text) return null;
    const fillers = ['um', 'uh', 'like', 'you know', 'basically', 'literally', 'actually', 'right', 'so'];
    const regex = new RegExp(`\\b(${fillers.join('|')})\\b`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, i) => {
      if (fillers.includes(part.toLowerCase())) {
        return <span key={i} className="bg-yellow-200 text-yellow-900 px-1 rounded-md font-medium shadow-sm">{part}</span>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 flex flex-col items-center min-h-[80vh]">
      
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">
          Your Personal <span className="text-indigo-600 dark:text-indigo-400">Speech Coach</span>
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Record yourself speaking, presenting, or answering interview questions. 
          Get instant, AI-powered feedback on your clarity, pacing, and filler words.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {!feedback && !isAnalyzing && (
          <motion.div 
            key="recording-ui"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center justify-center w-full max-w-xl p-8 bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800"
          >
            <div className="relative flex items-center justify-center mb-8">
              {isRecording && (
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  className="absolute w-40 h-40 bg-red-100 dark:bg-red-900/30 rounded-full"
                />
              )}
              {isRecording && (
                <motion.div 
                  animate={{ scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                  className="absolute w-32 h-32 bg-red-200 dark:bg-red-800/40 rounded-full"
                />
              )}
              
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`relative z-10 flex items-center justify-center w-24 h-24 rounded-full shadow-lg transition-all duration-300 ${
                  isRecording 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {isRecording ? <Square className="w-8 h-8 fill-current" /> : <Mic className="w-10 h-10" />}
              </button>
            </div>

            <div className="text-center w-full">
              <div className={`text-3xl font-mono mb-2 ${isRecording ? 'text-red-500 font-semibold' : 'text-slate-700 dark:text-slate-300'}`}>
                {formatTime(recordingDuration)}
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-medium mb-6">
                {isRecording ? 'Recording in progress...' : 'Tap to start recording'}
              </p>
              
              {/* Visualizer & Live Transcript */}
              <AnimatePresence>
                {isRecording && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="w-full flex flex-col items-center gap-4 overflow-hidden"
                  >
                    <div className="w-full bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 flex flex-col items-center">
                      <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2 w-full">
                        <Activity className="w-4 h-4" />
                        <span>Audio Signal</span>
                      </div>
                      <canvas 
                        ref={canvasRef} 
                        width={400} 
                        height={80} 
                        className="w-full h-20 rounded-lg"
                      />
                    </div>

                    <div className="w-full bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 text-left min-h-[120px] max-h-[200px] overflow-y-auto">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        <span>Live Transcript</span>
                      </div>
                      <div className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                        {liveTranscript.map((t, i) => (
                          <span key={i}>{highlightFillerWords(t.text)} </span>
                        ))}
                        <span className="opacity-70">{highlightFillerWords(interimTranscript)}</span>
                        {!liveTranscript.length && !interimTranscript && (
                          <span className="text-slate-400 dark:text-slate-500 italic">Listening for speech...</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {error && (
              <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl flex items-start gap-3 w-full">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm">{error}</p>
              </div>
            )}
          </motion.div>
        )}

        {isAnalyzing && (
          <motion.div 
            key="analyzing-ui"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center w-full max-w-md p-12 bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800"
          >
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="mb-6 text-indigo-600 dark:text-indigo-400"
            >
              <Loader2 className="w-12 h-12" />
            </motion.div>
            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">Analyzing your speech</h3>
            <p className="text-slate-500 dark:text-slate-400 text-center">
              Our AI coach is reviewing your pronunciation, pacing, and filler words...
            </p>
          </motion.div>
        )}

        {feedback && (
          <motion.div 
            key="feedback-ui"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full flex flex-col gap-6"
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                  <Volume2 className="w-6 h-6" />
                </div>
                {audioUrl && (
                  <audio controls src={audioUrl} className="h-10 w-full sm:w-64 outline-none" />
                )}
              </div>
              <button 
                onClick={reset}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium transition-colors w-full sm:w-auto justify-center"
              >
                <RefreshCw className="w-4 h-4" />
                Record Again
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
              <div className="bg-indigo-600 dark:bg-indigo-700 px-8 py-6 text-white">
                <h2 className="text-2xl font-bold">Coach&apos;s Feedback</h2>
                <p className="text-indigo-100 mt-1">Here is a detailed breakdown of your performance.</p>
              </div>
              
              <div className="p-8 prose prose-slate dark:prose-invert prose-headings:text-slate-800 dark:prose-headings:text-slate-100 prose-headings:font-semibold prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4 prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-li:text-slate-600 dark:prose-li:text-slate-300 max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {feedback}
                </ReactMarkdown>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
