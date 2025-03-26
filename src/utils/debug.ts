import debug from 'debug';

// Create namespace for different types of logs
export const debugWebhook = debug('voice-ai:webhook');
export const debugOpenAI = debug('voice-ai:openai');
export const debugVapi = debug('voice-ai:vapi');

// Enable all debugging in development
if (process.env.NODE_ENV === 'development') {
  debug.enable('voice-ai:*');
}

// Add timestamps to debug output
debug.formatters.t = () => {
  return new Date().toISOString();
} 