import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './SupportChat.css';

const SupportChat = ({ user }) => {
  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem('caregiver_chat_history');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    sessionStorage.setItem('caregiver_chat_history', JSON.stringify(messages));
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');

    const newUserMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newUserMessage]);
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          history: messages
            .filter(m => !m.isError)
            .map(m => ({ role: m.role, content: m.content }))
        })
      });

      const data = await response.json();

      if (data.success) {
        const aiMessage = {
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
          references: data.references || { posts: [], resources: [] }
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        const errorMessage = {
          role: 'assistant',
          content: `Error: ${data.message || 'Failed to get response'}`,
          timestamp: new Date(),
          isError: true
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'Failed to connect to chat service. Please try again later.',
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([]);
    sessionStorage.removeItem('caregiver_chat_history');
  };

  return (
    <div className="flex flex-col max-w-3xl mx-auto bg-white rounded-lg shadow-md overflow-hidden" style={{ height: 'calc(100svh - 155px)' }}>
      <div className="p-5 bg-brand-gradient text-white flex justify-between items-center flex-wrap gap-2.5">
        <h2 className="m-0 text-2xl font-semibold">Support Chat</h2>
        <p className="mt-1 mb-0 text-sm opacity-90 w-full">Ask questions and get AI-powered assistance</p>
        {messages.length > 0 && (
          <button className="bg-white/20 text-white border border-white/30 px-3 py-1.5 rounded text-xs cursor-pointer hover:bg-white/30 transition-colors" onClick={handleClear}>
            Clear Chat
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-5 bg-gray-100 flex flex-col gap-4 chat-messages">
        {messages.length === 0 ? (
          <div className="text-center py-10 px-5 text-gray-500">
            <p>👋 Welcome to Support Chat!</p>
            <p>I'm here to help you with any questions or concerns. Feel free to ask me anything!</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex flex-col max-w-[75%] animate-[fadeIn_0.3s_ease-in] ${message.role === 'user' ? 'self-end' : 'self-start'}`}
            >
              <div
                className={
                  message.isError
                    ? 'px-4 py-3 rounded-[18px] break-words leading-relaxed bg-red-50 text-red-700 border border-red-400'
                    : message.role === 'user'
                    ? 'px-4 py-3 rounded-[18px] rounded-br-[4px] break-words leading-relaxed bg-brand-gradient text-white'
                    : 'message-content px-4 py-3 rounded-[18px] rounded-bl-[4px] break-words leading-relaxed bg-white text-[#333] border border-gray-200 shadow-sm'
                }
              >
                {message.role === 'assistant' && !message.isError ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content}
                  </ReactMarkdown>
                ) : (
                  message.content
                )}
              </div>
              {message.references && (message.references.posts.length > 0 || message.references.resources.length > 0) && (
                <div className="mt-4 pt-3 border-t border-black/10">
                  {message.references.posts.length > 0 && (
                    <div className="mb-3">
                      <strong className="block text-xs text-gray-500 mb-2 font-semibold">Referenced Posts:</strong>
                      {message.references.posts.map((post, idx) => (
                        <div key={idx} className="flex gap-2.5 p-2.5 mb-2 last:mb-0 rounded border-l-[3px] border-l-green-500 bg-green-500/5 hover:bg-green-500/10 transition-colors">
                          <span className="text-lg flex-shrink-0 mt-0.5">💬</span>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-xs text-gray-800 mb-1">
                              Post by {post.authorName} in {post.topicName}
                            </div>
                            <div className="text-xs text-gray-500 leading-snug break-words">{post.content}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {message.references.resources.length > 0 && (
                    <div className="mb-3">
                      <strong className="block text-xs text-gray-500 mb-2 font-semibold">Referenced Resources:</strong>
                      {message.references.resources.map((resource, idx) => (
                        <div key={idx} className="flex gap-2.5 p-2.5 mb-2 last:mb-0 rounded border-l-[3px] border-l-blue-500 bg-blue-500/5 hover:bg-blue-500/10 transition-colors">
                          <span className="text-lg flex-shrink-0 mt-0.5">🔗</span>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-xs text-gray-800 mb-1">
                              <a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-[#667eea] no-underline hover:underline">
                                {resource.title}
                              </a>
                            </div>
                            <div className="text-xs text-gray-500 leading-snug break-words">{resource.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className={`text-[11px] text-gray-400 mt-1 px-1 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex flex-col max-w-[75%] self-start animate-[fadeIn_0.3s_ease-in]">
            <div className="message-content px-4 py-3 rounded-[18px] rounded-bl-[4px] bg-white border border-gray-200 shadow-sm">
              <span className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="flex p-4 bg-white border-t border-gray-200 gap-2.5" onSubmit={handleSend}>
        <input
          type="text"
          className="flex-1 px-4 py-3 border border-gray-200 rounded-[24px] text-sm outline-none focus:border-[#667eea] disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type your message here..."
          disabled={loading}
        />
        <button
          type="submit"
          className="px-6 py-3 bg-brand-gradient text-white border-0 rounded-[24px] text-sm font-semibold cursor-pointer hover:-translate-y-px transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
          disabled={!inputMessage.trim() || loading}
        >
          {loading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
};

export default SupportChat;
