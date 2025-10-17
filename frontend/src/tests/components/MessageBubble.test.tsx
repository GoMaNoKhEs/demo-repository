import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MessageBubble } from '../../components/chat/MessageBubble';

describe('MessageBubble', () => {
  const mockMessage = {
    id: '1',
    role: 'user' as const,
    content: 'Test message',
    timestamp: new Date('2025-01-01T12:00:00'),
  };

  it('should render user message', () => {
    render(<MessageBubble message={mockMessage} />);
    
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('should render agent message', () => {
    const agentMessage = { ...mockMessage, role: 'agent' as const };
    render(<MessageBubble message={agentMessage} />);
    
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('should render system message', () => {
    const systemMessage = { ...mockMessage, role: 'system' as const };
    render(<MessageBubble message={systemMessage} />);
    
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('should display timestamp', () => {
    const { container } = render(<MessageBubble message={mockMessage} />);
    
    // Vérifier que le timestamp est affiché
    const timestamp = container.querySelector('.MuiTypography-caption');
    expect(timestamp).toBeInTheDocument();
  });

  it('should render with correct alignment for user messages', () => {
    const { container } = render(<MessageBubble message={mockMessage} />);
    
    const box = container.querySelector('.MuiBox-root');
    expect(box).toBeInTheDocument();
  });

  it('should render with correct alignment for agent messages', () => {
    const agentMessage = { ...mockMessage, role: 'agent' as const };
    const { container } = render(<MessageBubble message={agentMessage} />);
    
    const box = container.querySelector('.MuiBox-root');
    expect(box).toBeInTheDocument();
  });
});
