import { Box, TextField, IconButton, Paper } from '@mui/material';
import { Send } from '@mui/icons-material';
import { useState, useRef, useEffect } from 'react';
import { MessageBubble } from './MessageBubble';
import { QuickSuggestions } from './QuickSuggestions';
import { TypingIndicator } from './TypingIndicator';
import { useAppStore } from '../../stores/useAppStore';
import { useNotifications } from '../../hooks/useNotifications';

export const ChatInterface = () => {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { chatMessages, addChatMessage, isAgentThinking } = useAppStore();
  const notifications = useNotifications();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  useEffect(() => {
    // Afficher/masquer les suggestions en fonction du nombre de messages
    if (chatMessages.length > 0) {
      setShowSuggestions(false);
    } else {
      setShowSuggestions(true);
    }
  }, [chatMessages]);

  const handleSend = (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim()) return;

    // Ajouter le message de l'utilisateur
    addChatMessage({
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: new Date(),
    });

    setInput('');
    setShowSuggestions(false);

    // Notification de succès
    notifications.success('Message envoyé à l\'agent');

    // TODO: Envoyer au backend
  };

  const handleSuggestionSelect = (_value: string, text: string) => {
    handleSend(text);
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
          <TypingIndicator />
        )}
        
        <div ref={messagesEndRef} />
      </Box>

      {/* Quick Suggestions */}
      {showSuggestions && (
        <Box sx={{ px: 2 }}>
          <QuickSuggestions onSelect={handleSuggestionSelect} visible={showSuggestions} />
        </Box>
      )}

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
          maxRows={6}
          minRows={1}
          placeholder="Décrivez votre situation..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              alignItems: 'flex-end',
            },
          }}
          aria-label="Message à envoyer à l'agent SimplifIA"
          aria-describedby="chat-input-help"
        />
        <IconButton
          color="primary"
          onClick={() => handleSend()}
          disabled={!input.trim()}
          sx={{
            alignSelf: 'flex-end',
          }}
          aria-label="Envoyer le message"
        >
          <Send />
        </IconButton>
      </Paper>
    </Box>
  );
};