import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Trash2, Bot, User, Users } from 'lucide-react';
import { useChatbot } from '../hooks/useChatbot';
import { useUsers } from '../hooks/useUserApi';
import { useGroups } from '../hooks/useGroupApi';
import { ChatbotContext } from '../types/api';

const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [showUserSelection, setShowUserSelection] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { messages, sendMessage, clearMessages, isLoading } = useChatbot();
  const { data: users = [] } = useUsers();
  const { data: groups = [] } = useGroups();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Reset user selection when chat is opened
    if (isOpen && !selectedUserId) {
      setShowUserSelection(true);
    }
  }, [isOpen, selectedUserId]);

  const buildContext = (): ChatbotContext => {
    return {
      users,
      groups,
      groupBalances: {},
      userBalances: {}
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading && selectedUserId) {
      const context = buildContext();
      sendMessage(inputValue, context, selectedUserId);
      setInputValue('');
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleQuickAction = (suggestion: string) => {
    if (selectedUserId) {
      setInputValue(suggestion);
      const context = buildContext();
      sendMessage(suggestion, context, selectedUserId);
    }
  };

  const handleUserSelect = (userId: number) => {
    setSelectedUserId(userId);
    setShowUserSelection(false);
  };

  const handleChangeUser = () => {
    setShowUserSelection(true);
    setSelectedUserId(null);
    clearMessages();
  };

  const getSelectedUser = () => {
    return users.find(user => user.id === selectedUserId);
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 z-50"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col z-40 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="bg-white/20 p-1 rounded-full">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">SplitWise Assistant</h3>
                  {selectedUserId ? (
                    <div className="flex items-center space-x-1">
                      <p className="text-xs opacity-90">Chatting as:</p>
                      <span className="text-xs font-medium bg-white/20 px-2 py-0.5 rounded-full">
                        {getSelectedUser()?.name}
                      </span>
                      <button
                        onClick={handleChangeUser}
                        className="text-xs opacity-75 hover:opacity-100 underline ml-1"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs opacity-90">Select a user to start</p>
                  )}
                </div>
              </div>
              <button
                onClick={clearMessages}
                className="p-1 hover:bg-white/20 rounded transition-colors"
                title="Clear chat"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* User Selection Screen */}
          {showUserSelection && (
            <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
              <div className="text-center w-full">
                <div className="bg-purple-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Choose Your Identity</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Select which user you are to get personalized expense information
                </p>
                
                {users.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {users.map(user => (
                      <button
                        key={user.id}
                        onClick={() => handleUserSelect(user.id)}
                        className="w-full p-3 bg-white border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 text-left group"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="bg-purple-100 group-hover:bg-purple-200 p-2 rounded-full transition-colors">
                            <User className="h-4 w-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{user.name}</p>
                            <p className="text-sm text-gray-600">{user.email}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">No users found</p>
                    <p className="text-sm text-gray-500">
                      Create some users first to start chatting
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Chat Interface */}
          {!showUserSelection && selectedUserId && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                          : 'bg-white border border-gray-200 text-gray-800'
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        {message.role === 'assistant' && (
                          <div className="bg-purple-100 p-1 rounded-full mt-1">
                            <Bot className="h-3 w-3 text-purple-600" />
                          </div>
                        )}
                        {message.role === 'user' && (
                          <div className="bg-white/20 p-1 rounded-full mt-1">
                            <User className="h-3 w-3 text-white" />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            message.role === 'user' ? 'text-white/70' : 'text-gray-500'
                          }`}>
                            {formatTime(message.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-200 rounded-lg p-3 max-w-[80%]">
                      <div className="flex items-center space-x-2">
                        <div className="bg-purple-100 p-1 rounded-full">
                          <Bot className="h-3 w-3 text-purple-600" />
                        </div>
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-gray-200 bg-white">
                <form onSubmit={handleSubmit} className="flex space-x-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask me about balances, groups, or expenses..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={!inputValue.trim() || isLoading}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-2 rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
                
                {/* Quick Actions */}
                <div className="mt-2 flex flex-wrap gap-1">
                  {[
                    "How much do I owe in total?",
                    "Show me my latest expenses",
                    "What groups am I in?",
                    "Who owes me money?"
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handleQuickAction(suggestion)}
                      disabled={isLoading}
                      className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors disabled:opacity-50"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default Chatbot;