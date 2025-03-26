'use client';

import { useState, useEffect } from 'react';
import Vapi from '@vapi-ai/web';
import { useChat, Message } from 'ai/react';
import { debugVapi } from '@/utils/debug';
import { SplineSceneBasic } from '@/components/demo';

interface VapiMessage {
  type: string;
  text?: string;
  messageId?: string;
  speaker?: 'assistant' | 'user';
  message?: {
    type: string;
    analysis?: {
      summary: string;
    };
    durationSeconds?: number;
    cost?: number;
    recordingUrl?: string;
    stereoRecordingUrl?: string;
    transcript?: string;
  };
}

interface VapiError {
  message?: string;
  code?: string;
  status?: number;
  action?: string;
  errorMsg?: string;
  error?: {
    type?: string;
    msg?: string;
  };
  callClientId?: string;
}

export default function Home() {
  const [isCallActive, setIsCallActive] = useState(false);
  const [summary, setSummary] = useState<string>('');
  const [callDuration, setCallDuration] = useState<number | null>(null);
  const [callCost, setCallCost] = useState<number | null>(null);
  const [vapi, setVapi] = useState<Vapi | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [waitingForSummary, setWaitingForSummary] = useState(false);
  
  const { messages, setMessages } = useChat();

  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;

    if (waitingForSummary) {
      pollInterval = setInterval(() => {
        debugVapi('Polling for end-of-call report...');
        // The webhook will update the state when it receives the report
      }, 2000); // Poll every 2 seconds

      // Stop polling after 30 seconds if no summary received
      setTimeout(() => {
        if (pollInterval) {
          clearInterval(pollInterval);
          setWaitingForSummary(false);
          if (!summary) {
            debugVapi('No summary received after timeout');
          }
        }
      }, 30000);
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [waitingForSummary, summary]);

  useEffect(() => {
    // Validate environment variables on component mount
    if (!process.env.NEXT_PUBLIC_VAPI_API_KEY) {
      setError('Missing Vapi API Key. Please check your .env.local file.');
      debugVapi('Error: Missing Vapi API Key');
      return;
    }
    if (!process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID) {
      setError('Missing Vapi Assistant ID. Please check your .env.local file.');
      debugVapi('Error: Missing Vapi Assistant ID');
      return;
    }
  }, []);

  const handleCallEnd = (reason?: string) => {
    debugVapi('Call ended', reason ? `Reason: ${reason}` : '');
    setIsCallActive(false);
    setVapi(null);
    setWaitingForSummary(true); // Start waiting for summary
    
    // Don't show errors for normal call endings
    if (reason && !isNormalCallEnding(reason)) {
      setError(`Call ended: ${reason}`);
    }
  };

  // Helper function to determine if a call ending is normal or an error
  const isNormalCallEnding = (reason: string): boolean => {
    const normalEndingPhrases = [
      'Meeting has ended',
      'Call ended by user',
      'no-room',
      'room was deleted'
    ];
    
    return normalEndingPhrases.some(phrase => reason.includes(phrase));
  };

  const startCall = async () => {
    setError(null);
    setSummary(''); // Clear previous summary
    setCallDuration(null);
    setCallCost(null);
    setRecordingUrl(null);
    setWaitingForSummary(false);
    debugVapi('Starting call with Vapi');
    
    try {
      const vapiInstance = new Vapi(process.env.NEXT_PUBLIC_VAPI_API_KEY!);
      setVapi(vapiInstance);
      debugVapi('Vapi instance created');

      // Set up event listeners
      vapiInstance.on('call-start', () => {
        debugVapi('Call has started.');
        setIsCallActive(true);
        setError(null); // Clear any previous errors
      });

      vapiInstance.on('call-end', () => {
        debugVapi('Call has ended normally.');
        handleCallEnd();
      });

      vapiInstance.on('error', (error: VapiError) => {
        // Check if this is a normal ending from Daily.co
        if (error.errorMsg === 'Meeting has ended' || 
           (error.error?.type === 'no-room' && error.error?.msg?.includes('room was deleted'))) {
          debugVapi('Call ended normally via Daily.co');
          handleCallEnd('Call completed');
          return;
        }

        // This is a real error
        const errorMessage = error?.message || error?.errorMsg || 'An unknown error occurred';
        debugVapi('Call error:', errorMessage);
        console.error('Call error:', error);
        handleCallEnd(errorMessage);
      });

      vapiInstance.on('message', (message: VapiMessage) => {
        debugVapi('Received message:', message);
        if (message.type === 'transcript' && message.text) {
          debugVapi('Received transcript: %s', message.text);
          const newMessage: Message = {
            id: message.messageId || Date.now().toString(),
            role: message.speaker === 'assistant' ? 'assistant' : 'user',
            content: message.text
          };
          setMessages((prevMessages) => [...prevMessages, newMessage]);
        } else if (message.type === 'end-of-call-report' && message.message) {
          debugVapi('Received end-of-call report');
          // Update the summary and call details using the correct nested structure
          setSummary(message.message.analysis?.summary || 'No summary available');
          setCallDuration(message.message.durationSeconds || null);
          setCallCost(message.message.cost || null);
          setRecordingUrl(message.message.recordingUrl || null);
          setWaitingForSummary(false); // Stop waiting for summary
        }
      });

      // Optional: Listen for speech events
      vapiInstance.on('speech-start', () => {
        debugVapi('Assistant speech has started.');
      });

      vapiInstance.on('speech-end', () => {
        debugVapi('Assistant speech has ended.');
      });

      // Optional: Listen for volume levels
      vapiInstance.on('volume-level', (volume: number) => {
        debugVapi(`Assistant volume level: ${volume}`);
      });

      debugVapi('Starting call...');
      const call = await vapiInstance.start(process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID!);
      debugVapi('Call started successfully', call);
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to start call';
      debugVapi('Error starting call:', errorMessage);
      console.error('Error starting call:', error);
      handleCallEnd(errorMessage);
    }
  };

  const stopCall = () => {
    if (vapi) {
      debugVapi('Stopping call');
      try {
        vapi.stop();
        handleCallEnd('Call ended by user');
      } catch (error: any) {
        const errorMessage = error?.message || 'Error stopping call';
        debugVapi('Error stopping call:', errorMessage);
        console.error('Error stopping call:', error);
        handleCallEnd(errorMessage);
      }
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black relative overflow-hidden">
      {/* Spline Scene Background */}
      <div className="absolute inset-0 w-full h-full">
        <SplineSceneBasic />
      </div>

      {/* Main call button */}
      <div 
        className={`
          absolute
          z-50
          transition-all
          duration-500
          ease-in-out
          ${isCallActive ? 'scale-110' : 'hover:scale-105'}
        `}
      >
        <button
          onClick={isCallActive ? stopCall : startCall}
          className={`
            w-16
            h-16
            md:w-24
            md:h-24
            rounded-full
            flex
            items-center
            justify-center
            transition-all
            duration-500
            ease-in-out
            shadow-lg
            ${isCallActive 
              ? 'bg-red-500 hover:bg-red-600 rotate-45' 
              : 'bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200'
            }
          `}
          aria-label={isCallActive ? 'End Call' : 'Start Call'}
        >
          <span className={`
            transform
            transition-all
            duration-500
            ${isCallActive ? 'rotate-45' : ''}
          `}>
            {isCallActive ? (
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-white dark:text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
          </span>
        </button>
      </div>

      {/* Subtle loading indicator */}
      {waitingForSummary && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 dark:border-gray-400"></div>
            <span>Processing...</span>
          </div>
        </div>
      )}

      {/* Minimalist call summary */}
      {(summary || callDuration || callCost || recordingUrl) && (
        <div className={`
          fixed
          bottom-0
          left-0
          right-0
          bg-white/80
          dark:bg-black/80
          backdrop-blur-md
          p-6
          transform
          transition-all
          duration-500
          ease-in-out
          ${summary ? 'translate-y-0' : 'translate-y-full'}
        `}>
          <div className="max-w-3xl mx-auto space-y-4">
            {summary && (
              <p className="text-sm text-gray-600 dark:text-gray-300">{summary}</p>
            )}
            {recordingUrl && (
              <div className="w-full">
                <audio 
                  className="w-full h-8" 
                  controls 
                  src={recordingUrl}
                  style={{
                    filter: 'grayscale(1)',
                    opacity: '0.8'
                  }}
                ></audio>
              </div>
            )}
            {(callDuration || callCost) && (
              <div className="flex justify-end space-x-4 text-xs text-gray-500 dark:text-gray-400">
                {callDuration && (
                  <span>{callDuration.toFixed(1)}s</span>
                )}
                {callCost && (
                  <span>${callCost.toFixed(4)}</span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
