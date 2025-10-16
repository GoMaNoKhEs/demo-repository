import { Box, TextField, IconButton, Paper } from '@mui/material';
import { Send } from '@mui/icons-material';
import { useState, useRef, useEffect } from 'react';
import { MessageBubble } from './MessageBubble';
import { useAppStore } from '../../stores/useAppStore';

export const ChatInterface = () => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { chatMessages, addChatMessage, isAgentThinking } = useAppStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleSend = () => {
    if (!input.trim()) return;

    // Ajouter le message de l'utilisateur
    addChatMessage({
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    });

    setInput('');

    // TODO: Envoyer au backend
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'background.paper',
        borderRadius: 2,
      }}
    >
      {/* Messages */}
      <Box
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {chatMessages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        
        {isAgentThinking && (
          <MessageBubble
            message={{
              id: 'thinking',
              role: 'agent',
              content: 'L\'agent réfléchit...',
              timestamp: new Date(),
            }}
            isThinking
          />
        )}
        
        <div ref={messagesEndRef} />
      </Box>

      {/* Input */}
      <Paper
        elevation={3}
        sx={{
          p: 2,
          display: 'flex',
          gap: 1,
          borderRadius: 0,
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <TextField
          fullWidth
          multiline
          maxRows={4}
          placeholder="Décrivez votre situation..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <IconButton
          color="primary"
          onClick={handleSend}
          disabled={!input.trim()}
        >
          <Send />
        </IconButton>
      </Paper>
    </Box>
  );
};