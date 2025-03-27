# Voice AI Assistant

A modern voice assistant application built with Next.js that leverages Vapi (Voice API) for creating interactive, AI-powered voice conversations with a visually appealing 3D robot interface.

![Voice AI Assistant Screenshot](https://example.com/screenshot.png)

## Features

- 🤖 Interactive 3D robot visualization using Spline
- 🎙️ Voice conversations powered by Vapi and OpenAI
- 🔥 Beautiful gradient UI with spotlight effects
- 📊 End-of-call reports with transcripts and recordings
- 📱 Responsive design that works on desktop and mobile

## Tech Stack

- **Frontend**: Next.js 15, React, TailwindCSS
- **3D Visualization**: Spline
- **Voice AI**: Vapi SDK
- **Video/Audio**: Daily.co integration
- **Styling**: TailwindCSS with custom animations
- **Deployment**: Vercel (recommended)

## Architecture Overview

The application consists of several key components:

1. **Voice AI Integration**: Uses Vapi SDK to handle voice conversations
2. **3D Visualization**: Renders an interactive robot using Spline
3. **UI Components**: Custom gradient buttons, spotlight effects, and responsive layout
4. **Webhook Handler**: Processes end-of-call reports and event notifications
5. **Error Handling**: Gracefully handles call endings and errors

## Prerequisites

- Node.js 18.x or higher
- NPM or Yarn
- Vapi account with an assistant configured
- Environment variables properly set up

## Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/voice-ai-app.git
   cd voice-ai-app
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables
   Create a `.env.local` file in the root directory with the following variables:
   ```
   NEXT_PUBLIC_VAPI_API_KEY=your_vapi_api_key
   NEXT_PUBLIC_VAPI_ASSISTANT_ID=your_assistant_id
   VAPI_WEBHOOK_SECRET=your_webhook_secret
   ```

4. Start the development server
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) to view the application

## Key Components

### Voice Integration (Vapi SDK)

The voice assistant uses Vapi SDK to create and manage voice conversations. The integration is handled in `src/app/page.tsx` where:

- A Vapi instance is created using the API key
- Event listeners are set up for various call states
- The assistant is initialized with the assistant ID from environment variables
- Error handling is implemented to distinguish between normal call endings and errors

```typescript
// Initializing Vapi instance
const vapiInstance = new Vapi(process.env.NEXT_PUBLIC_VAPI_API_KEY!);

// Starting a conversation with default assistant
vapiInstance.start(process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID!);

// Or with custom configuration
vapiInstance.start({
  model: {
    provider: "openai",
    model: "gpt-4o-mini",
    temperature: 0.5,
    messages: [
      {
        role: "system",
        content: "Your system prompt here"
      }
    ]
  },
  voice: {
    provider: "vapi",
    voiceId: "Cole"
  },
  transcriber: {
    provider: "deepgram",
    model: "nova-3",
    language: "en",
    endpointing: 300
  },
  firstMessage: "Hello, I'm here to help you!",
  endCallMessage: "Thank you for the conversation. Have a great day!",
  startSpeakingPlan: {
    waitSeconds: 1.2,
    smartEndpointingEnabled: "livekit"
  }
});

// Event Listeners
vapiInstance.on('call-start', () => {
  console.log('Call started');
});

vapiInstance.on('call-end', () => {
  console.log('Call ended');
});

vapiInstance.on('speech-start', () => {
  // Update UI to show assistant is speaking
});

vapiInstance.on('speech-end', () => {
  // Update UI to show assistant finished speaking
});

vapiInstance.on('message', (message) => {
  // Handle transcripts and assistant responses
  console.log('Message:', message);
});

vapiInstance.on('error', (error) => {
  console.error('Error:', error);
});
```

### Assistant Configuration

The application uses a configured Vapi assistant with the following settings:

- **Model**: GPT-4o-mini with temperature 0.5
- **Voice**: Cole (provided by Vapi)
- **Transcription**: Deepgram Nova-3 with English language support
- **Smart Endpointing**: Enabled using Livekit
- **Features**:
  - HIPAA Compliance: Disabled
  - Backchanneling: Disabled
  - Background Denoising: Disabled
  - Smart Endpointing: Enabled

The assistant includes configurable messages for:
- First Message: Initial greeting
- Voicemail Message: Used when calls are missed
- End Call Message: Farewell message when ending conversations

### 3D Robot Visualization

The application features a 3D robot visualization using Spline. The implementation can be found in:

- `src/components/ui/splite.tsx` - Spline scene component
- `src/components/demo.tsx` - Integration of the 3D scene with the UI

The 3D scene responds to mouse movements with eye-tracking and spotlight effects.

### Gradient Button

The application uses a custom gradient button component with advanced CSS properties and transitions:

- Defined in `src/components/ui/gradient-button.tsx`
- Styled using custom CSS properties in `src/app/globals.css`
- Features hover effects, size variants, and microphone icon integration

### Spotlight Effect

The spotlight effect creates an interactive lighting effect that follows the user's cursor:

- Implemented in `src/components/ui/spotlight.tsx`
- Integrated with the 3D scene in `src/components/demo.tsx`
- Uses spring physics for smooth animation

### Webhook Handler

The application processes webhooks from Vapi to receive end-of-call reports:

- Implemented in `src/app/api/webhook/route.ts`
- Securely verifies webhook payloads
- Processes different event types, including `end-of-call-report`

```typescript
// Example of webhook handling
export async function POST(req: Request) {
  const body = await req.json();
  
  // Verify webhook signature
  const signature = req.headers.get('x-vapi-signature');
  
  // Process webhook data based on event type
  if (body.type === 'end-of-call-report') {
    // Handle end-of-call report
  }
}
```

### Error Handling

The application implements sophisticated error handling, particularly for Daily.co meeting endings:

- Uses helper function `isNormalCallEnding()` to differentiate between errors and normal call endings
- Handles "Meeting has ended" messages appropriately
- Provides useful debug logging

## End-of-Call Reports

When a conversation ends, Vapi sends an end-of-call report via webhook, which includes:

- Transcription of the conversation
- Recording URLs (audio only)
- Call duration and cost
- Analysis and summary of the conversation

The UI displays this information with an audio player for recordings when available.

## Styling

The application uses TailwindCSS with:

- Custom CSS properties for gradient effects
- Animation utilities from tailwindcss-animate
- Responsive design for all screen sizes
- Dark mode by default

## Common Issues and Troubleshooting

### "Meeting has ended" Messages

This is a normal part of the Daily.co integration and not an actual error. The application handles this gracefully by:

1. Detecting this message pattern
2. Not displaying it as an error to the user
3. Using it as a trigger to prepare for the end-of-call report

### Webhook Delays

End-of-call reports may be delayed by a few seconds after the call ends. The application handles this by:

1. Setting a "waiting for summary" state when a call ends
2. Implementing a polling mechanism to check for updates
3. Displaying a loading state while waiting for the report

## Deployment

The application can be deployed to Vercel:

```bash
npm run build
vercel deploy
```

For production deployments, ensure all environment variables are properly configured in your deployment platform.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT](LICENSE)
