import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './SupportChat.css';

const SupportChat = ({ user }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    
    // Add user message to chat
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
        body: JSON.stringify({ message: userMessage })
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
  };

  return (
    <div className="support-chat-container">
      <div className="chat-header">
        <h2>Support Chat</h2>
        <p className="chat-subtitle">Ask questions and get AI-powered assistance</p>
        {messages.length > 0 && (
          <button className="clear-chat-btn" onClick={handleClear}>
            Clear Chat
          </button>
        )}
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-welcome">
            <p>👋 Welcome to Support Chat!</p>
            <p>I'm here to help you with any questions or concerns. Feel free to ask me anything!</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`message ${message.role} ${message.isError ? 'error' : ''}`}
            >
              <div className="message-content">
                {message.role === 'assistant' && !message.isError ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content}
                  </ReactMarkdown>
                ) : (
                  message.content
                )}
              </div>
              {message.references && (message.references.posts.length > 0 || message.references.resources.length > 0) && (
                <div className="message-references">
                  {message.references.posts.length > 0 && (
                    <div className="references-section">
                      <strong>Referenced Posts:</strong>
                      {message.references.posts.map((post, idx) => (
                        <div key={idx} className="reference-item post-reference">
                          <span className="reference-icon">💬</span>
                          <div className="reference-content">
                            <div className="reference-title">
                              Post by {post.authorName} in {post.topicName}
                            </div>
                            <div className="reference-text">{post.content}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {message.references.resources.length > 0 && (
                    <div className="references-section">
                      <strong>Referenced Resources:</strong>
                      {message.references.resources.map((resource, idx) => (
                        <div key={idx} className="reference-item resource-reference">
                          <span className="reference-icon">🔗</span>
                          <div className="reference-content">
                            <div className="reference-title">
                              <a href={resource.url} target="_blank" rel="noopener noreferrer">
                                {resource.title}
                              </a>
                            </div>
                            <div className="reference-text">{resource.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="message-timestamp">
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="message assistant loading">
            <div className="message-content">
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

      <form className="chat-input-form" onSubmit={handleSend}>
        <input
          type="text"
          className="chat-input"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type your message here..."
          disabled={loading}
        />
        <button
          type="submit"
          className="send-btn"
          disabled={!inputMessage.trim() || loading}
        >
          {loading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
};

export default SupportChat;
