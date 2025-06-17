import { ChatbotContext } from '../types/api';

const API_BASE_URL = 'http://localhost:8000'; // Update this to match your backend URL

export class ChatbotService {
  async processQuery(query: string, context: ChatbotContext, userId: number = 1): Promise<string> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          messages: [
            {
              role: 'user',
              content: query
            }
          ]
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.message || "I'm sorry, I couldn't process your request.";
    } catch (error) {
      console.error('Chatbot API error:', error);
      return "I'm experiencing some technical difficulties. Please try again later.";
    }
  }
}

export const chatbotService = new ChatbotService();