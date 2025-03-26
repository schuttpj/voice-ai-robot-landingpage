import { POST } from '../route';
import OpenAI from 'openai';
import { debugWebhook, debugOpenAI } from '@/utils/debug';

// Mock debug functions
jest.mock('@/utils/debug', () => ({
  debugWebhook: jest.fn(),
  debugOpenAI: jest.fn(),
}));

// Mock next/server
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data) => ({
      json: async () => data
    }))
  }
}));

// Mock OpenAI
jest.mock('openai', () => {
  const create = jest.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content: 'Test summary',
        },
      },
    ],
  });

  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      apiKey: 'test-key',
      organization: 'test-org',
      _options: {},
      chat: {
        completions: {
          create,
        },
      },
    })),
    mockCreate: create, // Export for test access
  };
});

// Get the mock for testing
const { mockCreate } = jest.requireMock('openai');

describe('Webhook Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('processes end-of-call reports correctly', async () => {
    const mockRequest = {
      json: async () => ({
        message: {
          type: 'end-of-call-report',
          transcript: 'Test conversation transcript',
        },
      }),
    };

    const response = await POST(mockRequest as any);
    const data = await response.json();

    expect(data.status).toBe('success');
    expect(data.summary).toBe('Test summary');

    // Verify debug logs
    expect(debugWebhook).toHaveBeenCalledWith(
      'Received webhook: %O',
      expect.objectContaining({
        type: 'end-of-call-report',
        timestamp: expect.any(String),
      })
    );

    expect(debugWebhook).toHaveBeenCalledWith(
      'Processing end-of-call report with transcript length: %d',
      expect.any(Number)
    );

    expect(debugOpenAI).toHaveBeenCalledWith(
      'Sending request to OpenAI for summary generation'
    );

    expect(debugOpenAI).toHaveBeenCalledWith(
      'Received summary from OpenAI: %s',
      'Test summary'
    );

    expect(debugWebhook).toHaveBeenCalledWith(
      'Successfully processed webhook, returning summary'
    );
  });

  it('handles non-end-of-call reports', async () => {
    const mockRequest = {
      json: async () => ({
        message: {
          type: 'other-type',
        },
      }),
    };

    const response = await POST(mockRequest as any);
    const data = await response.json();

    expect(data.status).toBe('success');
    expect(data.summary).toBeUndefined();

    // Verify debug logs
    expect(debugWebhook).toHaveBeenCalledWith(
      'Received webhook: %O',
      expect.objectContaining({
        type: 'other-type',
        timestamp: expect.any(String),
      })
    );

    expect(debugWebhook).toHaveBeenCalledWith(
      'Received non-end-of-call report, skipping processing'
    );
  });

  it('handles errors gracefully', async () => {
    // Mock OpenAI to throw an error
    mockCreate.mockRejectedValueOnce(new Error('Test error'));

    const mockRequest = {
      json: async () => ({
        message: {
          type: 'end-of-call-report',
          transcript: 'Test conversation transcript',
        },
      }),
    };

    const response = await POST(mockRequest as any);
    const data = await response.json();

    expect(data.status).toBe('error');
    expect(data.message).toBe('Failed to process webhook');

    // Verify debug logs
    expect(debugWebhook).toHaveBeenCalledWith(
      'Error processing webhook: %O',
      expect.objectContaining({
        error: 'Test error',
        timestamp: expect.any(String),
      })
    );

    expect(debugOpenAI).toHaveBeenCalledWith(
      'OpenAI API error: %O',
      expect.objectContaining({
        message: 'Test error',
        name: 'Error',
        stack: expect.any(String),
      })
    );
  });
}); 