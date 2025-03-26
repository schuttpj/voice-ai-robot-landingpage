import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { debugWebhook, debugOpenAI } from '@/utils/debug';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    debugWebhook('Received webhook: %O', {
      type: body.message?.type,
      timestamp: new Date().toISOString(),
      body: body,
    });

    if (body.message?.type === 'end-of-call-report') {
      const transcript = body.message.transcript;
      debugWebhook('Processing end-of-call report with transcript length: %d', transcript.length);

      debugOpenAI('Sending request to OpenAI for summary generation');
      const completion = await openai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that summarizes conversations. Keep summaries concise but informative.',
          },
          {
            role: 'user',
            content: `Please summarize this conversation transcript:\n\n${transcript}`,
          },
        ],
        model: 'gpt-4',
      });

      const summary = completion.choices[0]?.message?.content || 'No summary generated';
      debugOpenAI('Received summary from OpenAI: %s', summary);

      debugWebhook('Successfully processed webhook, returning summary');
      return NextResponse.json({ status: 'success', summary });
    }

    debugWebhook('Received non-end-of-call report, skipping processing');
    return NextResponse.json({ status: 'success' });
  } catch (error) {
    debugWebhook('Error processing webhook: %O', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
    
    if (error instanceof Error) {
      debugOpenAI('OpenAI API error: %O', {
        message: error.message,
        name: error.name,
        stack: error.stack,
      });
    }

    return NextResponse.json(
      { status: 'error', message: 'Failed to process webhook' },
      { status: 500 }
    );
  }
} 