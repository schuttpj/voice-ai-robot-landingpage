import { render, screen, fireEvent } from '@testing-library/react';
import Home from '../page';
import { useChat } from 'ai/react';

// Mock the useChat hook
jest.mock('ai/react', () => ({
  useChat: jest.fn(() => ({
    messages: [],
    setMessages: jest.fn(),
  })),
}));

// Mock the VapiClient
jest.mock('@vapi-ai/web', () => {
  return jest.fn().mockImplementation(() => ({
    createCall: jest.fn().mockResolvedValue({
      onEnded: jest.fn(),
      start: jest.fn(),
    }),
  }));
});

describe('Home Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('renders the main title', () => {
    render(<Home />);
    expect(screen.getByText('Voice AI Assistant')).toBeInTheDocument();
  });

  it('renders the start call button', () => {
    render(<Home />);
    expect(screen.getByText('Start Call')).toBeInTheDocument();
  });

  it('disables the button during an active call', async () => {
    render(<Home />);
    const button = screen.getByText('Start Call');
    
    fireEvent.click(button);
    
    expect(button).toBeDisabled();
    expect(screen.getByText('Call in Progress...')).toBeInTheDocument();
  });
}); 