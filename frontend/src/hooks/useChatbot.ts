import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { chatbotService } from '../services/chatbot';
import { ChatMessage, ChatbotContext } from '../types/api';

export const useChatbot = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: "Hi! I'm your SplitWise assistant. I can help you with questions about your expenses, balances, and groups. Try asking me something like 'Show me all group balances' or 'Who owes money in [group name]?'",
      role: 'assistant',
      timestamp: new Date()
    }
  ]);

  const chatMutation = useMutation({
    mutationFn: async ({ query, context, userId }: { query: string; context: ChatbotContext; userId?: number }) => {
      return await chatbotService.processQuery(query, context, userId);
    },
    onSuccess: (response, variables) => {
      // Add user message
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        content: variables.query,
        role: 'user',
        timestamp: new Date()
      };

      // Add assistant response
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: response,
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, userMessage, assistantMessage]);
    },
    onError: (error) => {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        content: "I'm sorry, I encountered an error processing your request. Please try again.",
        role: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  });

  const sendMessage = (query: string, context: ChatbotContext, userId?: number) => {
    if (query.trim()) {
      chatMutation.mutate({ query: query.trim(), context, userId });
    }
  };

  const clearMessages = () => {
    setMessages([
      {
        id: '1',
        content: "Hi! I'm your SplitWise assistant. I can help you with questions about your expenses, balances, and groups. Try asking me something like 'Show me all group balances' or 'Who owes money in [group name]?'",
        role: 'assistant',
        timestamp: new Date()
      }
    ]);
  };

  return {
    messages,
    sendMessage,
    clearMessages,
    isLoading: chatMutation.isPending
  };
};