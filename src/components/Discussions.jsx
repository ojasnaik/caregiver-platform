import { useState, useEffect } from 'react';
import './Discussions.css';
import TopicRequestForm from './TopicRequestForm';
import UserTopicRequestList from './UserTopicRequestList';
import AdminTopicRequestList from './AdminTopicRequestList';

const Discussions = ({ user }) => {
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTopicForm, setShowTopicForm] = useState(false);
  const [newTopic, setNewTopic] = useState({ name: '', description: '' });
  const [newPost, setNewPost] = useState({ content: '' });
  const [isAdmin, setIsAdmin] = useState(false);
  const [expandedPosts, setExpandedPosts] = useState(new Set());
  const [newComments, setNewComments] = useState({});
  const [newReplies, setNewReplies] = useState({});

  useEffect(() => {
    checkAdminStatus();
    fetchTopics();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/auth/users/${user.id}`, {
        headers: {
          'user-id': user.id
        }
      });
      const data = await response.json();
      if (data.success && data.user) {
        setIsAdmin(data.user.admin || false);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const fetchTopics = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/discussions/topics');
      const data = await response.json();
      if (data.success) {
        setTopics(data.topics);
        if (data.topics.length > 0 && !selectedTopic) {
          setSelectedTopic(data.topics[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching topics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async (topicId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/discussions/topics/${topicId}/posts`);
      const data = await response.json();
      if (data.success) {
        setPosts(data.posts);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  useEffect(() => {
    if (selectedTopic) {
      fetchPosts(selectedTopic._id);
    }
  }, [selectedTopic]);

  const handleCreateTopic = async (e) => {
    e.preventDefault();
    if (!newTopic.name.trim()) return;

    try {
      const response = await fetch('http://localhost:5000/api/discussions/topics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': user.id
        },
        body: JSON.stringify(newTopic)
      });

      const data = await response.json();
      if (data.success) {
        setTopics([...topics, data.topic]);
        setNewTopic({ name: '', description: '' });
        setShowTopicForm(false);
      } else {
        alert(data.message || 'Failed to create topic');
      }
    } catch (error) {
      console.error('Error creating topic:', error);
      alert('Failed to create topic');
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPost.content.trim()) return;

    try {
      const response = await fetch(`http://localhost:5000/api/discussions/topics/${selectedTopic._id}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': user.id
        },
        body: JSON.stringify(newPost)
      });

      const data = await response.json();
      if (data.success) {
        setPosts([data.post, ...posts]);
        setNewPost({ content: '' });
      } else {
        alert(data.message || 'Failed to create post');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post');
    }
  };

  const handleLikePost = async (postId) => {
    // Optimistic update - update UI immediately
    setPosts(posts.map(post => 
      post._id === postId 
        ? { ...post, likeCount: (post.likeCount || 0) + 1 }
        : post
    ));

    try {
      const response = await fetch(`http://localhost:5000/api/discussions/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'user-id': user.id
        }
      });

      const data = await response.json();
      if (data.success) {
        // Update with server response
        setPosts(posts.map(post => 
          post._id === postId 
            ? { ...post, likeCount: data.likeCount }
            : post
        ));
      } else {
        // Revert optimistic update on failure
        setPosts(posts.map(post => 
          post._id === postId 
            ? { ...post, likeCount: (post.likeCount || 1) - 1 }
            : post
        ));
      }
    } catch (error) {
      console.error('Error liking post:', error);
      // Revert optimistic update on error
      setPosts(posts.map(post => 
        post._id === postId 
          ? { ...post, likeCount: (post.likeCount || 1) - 1 }
          : post
      ));
    }
  };

  const handleDeleteTopic = async (topicId) => {
    if (!window.confirm('Are you sure you want to delete this topic? This will also delete all posts in this topic.')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/discussions/topics/${topicId}`, {
        method: 'DELETE',
        headers: {
          'user-id': user.id
        }
      });

      const data = await response.json();
      if (data.success) {
        setTopics(topics.filter(topic => topic._id !== topicId));
        if (selectedTopic && selectedTopic._id === topicId) {
          setSelectedTopic(topics.length > 1 ? topics.find(t => t._id !== topicId) : null);
          setPosts([]); // Clear posts when the selected topic is deleted
        }
      } else {
        alert(data.message || 'Failed to delete topic');
      }
    } catch (error) {
      console.error('Error deleting topic:', error);
      alert('Failed to delete topic');
    }
  };

  const handleRequestProcessed = () => {
    // Refresh topics when a request is approved
    fetchTopics();
  };

  const handleRequestCreated = () => {
    // Optionally refresh user requests list
    // This is handled by the UserTopicRequestList component itself
  };

  const handleAddReply = async (postId, content) => {
    try {
      const response = await fetch(`http://localhost:5000/api/discussions/posts/${postId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': user.id
        },
        body: JSON.stringify({ content })
      });

      const data = await response.json();
      if (data.success) {
        setPosts(posts.map(post => 
          post._id === postId 
            ? { ...post, replies: [...post.replies, data.reply] }
            : post
        ));
        setNewComments({ ...newComments, [postId]: '' });
      } else {
        alert(data.message || 'Failed to add reply');
      }
    } catch (error) {
      console.error('Error adding reply:', error);
      alert('Failed to add reply');
    }
  };

  const handleLikeReply = async (postId, replyId) => {
    // Optimistic update - update UI immediately
    setPosts(posts.map(post => 
      post._id === postId 
        ? {
            ...post,
            replies: post.replies.map(reply =>
              reply._id === replyId
                ? { ...reply, likeCount: (reply.likeCount || 0) + 1 }
                : reply
            )
          }
        : post
    ));

    try {
      const response = await fetch(`http://localhost:5000/api/discussions/posts/${postId}/replies/${replyId}/like`, {
        method: 'POST',
        headers: {
          'user-id': user.id
        }
      });

      const data = await response.json();
      if (data.success) {
        // Update with server response
        setPosts(posts.map(post => 
          post._id === postId 
            ? {
                ...post,
                replies: post.replies.map(reply =>
                  reply._id === replyId
                    ? { ...reply, likeCount: data.likeCount }
                    : reply
                )
              }
            : post
        ));
      } else {
        // Revert optimistic update on failure
        setPosts(posts.map(post => 
          post._id === postId 
            ? {
                ...post,
                replies: post.replies.map(reply =>
                  reply._id === replyId
                    ? { ...reply, likeCount: (reply.likeCount || 1) - 1 }
                    : reply
                )
              }
            : post
        ));
      }
    } catch (error) {
      console.error('Error liking reply:', error);
      // Revert optimistic update on error
      setPosts(posts.map(post => 
        post._id === postId 
          ? {
              ...post,
              replies: post.replies.map(reply =>
                reply._id === replyId
                  ? { ...reply, likeCount: (reply.likeCount || 1) - 1 }
                  : reply
              )
            }
          : post
      ));
    }
  };

  const togglePostExpansion = (postId) => {
    setExpandedPosts(prev => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
  };

  if (loading) {
    return <div className="discussions-loading">Loading discussions...</div>;
  }

  return (
    <div className="discussions-container">
      <div className="discussions-header">
        <h2>Community Discussions</h2>
        {isAdmin && (
          <button 
            className="add-topic-btn"
            onClick={() => setShowTopicForm(!showTopicForm)}
          >
            {showTopicForm ? 'Cancel' : 'Add Topic'}
          </button>
        )}
      </div>

      {showTopicForm && isAdmin && (
        <form className="topic-form" onSubmit={handleCreateTopic}>
          <h3>Create New Topic</h3>
          <div className="form-group">
            <label htmlFor="topic-name">Topic Name</label>
            <input
              id="topic-name"
              type="text"
              value={newTopic.name}
              onChange={(e) => setNewTopic({ ...newTopic, name: e.target.value })}
              placeholder="e.g., Infant Care"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="topic-description">Description (Optional)</label>
            <textarea
              id="topic-description"
              value={newTopic.description}
              onChange={(e) => setNewTopic({ ...newTopic, description: e.target.value })}
              placeholder="Brief description of this topic..."
              rows="3"
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="submit-btn">Create Topic</button>
            <button type="button" onClick={() => setShowTopicForm(false)} className="cancel-btn">
              Cancel
            </button>
          </div>
        </form>
      )}

      {isAdmin && (
        <AdminTopicRequestList 
          user={user} 
          onRequestProcessed={handleRequestProcessed}
        />
      )}

      {!isAdmin && (
        <TopicRequestForm 
          user={user} 
          onRequestCreated={handleRequestCreated}
        />
      )}

      <div className="discussions-content">
        <div className="topics-sidebar">
          <h3>Topics</h3>
          {topics.length === 0 ? (
            <p className="no-topics">No topics available yet.</p>
          ) : (
            <div className="topics-list">
              {topics.map(topic => (
                <div 
                  key={topic._id} 
                  className={`topic-item ${selectedTopic?._id === topic._id ? 'active' : ''}`}
                  onClick={() => setSelectedTopic(topic)}
                >
                  <div className="topic-info">
                    <h4>{topic.name}</h4>
                    {topic.description && <p>{topic.description}</p>}
                  </div>
                  {isAdmin && (
                    <button 
                      className="delete-topic-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTopic(topic._id);
                      }}
                      title="Delete topic"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="posts-section">
          {selectedTopic ? (
            <>
              <div className="posts-header">
                <h3>{selectedTopic.name}</h3>
                <p>{selectedTopic.description}</p>
              </div>

              <form className="post-form" onSubmit={handleCreatePost}>
                <div className="form-group">
                  <label htmlFor="post-content">Share your thoughts (max 100 words)</label>
                  <textarea
                    id="post-content"
                    value={newPost.content}
                    onChange={(e) => setNewPost({ content: e.target.value })}
                    placeholder="What's on your mind?"
                    rows="3"
                    maxLength="500"
                    required
                  />
                  <div className="char-count">
                    {newPost.content.split(' ').filter(word => word.length > 0).length}/100 words
                  </div>
                </div>
                <button type="submit" className="submit-btn">Post</button>
              </form>

              <div className="posts-list">
                {posts.length === 0 ? (
                  <p className="no-posts">No posts yet. Be the first to share!</p>
                ) : (
                  posts.map(post => (
                    <div key={post._id} className="post-item">
                      <div className="post-header">
                        <span className="post-author">{post.authorName}</span>
                        <span className="post-date">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="post-content">{post.content}</div>
                      <div className="post-actions">
                        <button 
                          className="like-btn"
                          onClick={() => handleLikePost(post._id)}
                        >
                          ❤️ {post.likeCount || 0}
                        </button>
                        <button 
                          className="comment-toggle-btn"
                          onClick={() => togglePostExpansion(post._id)}
                        >
                          💬 {post.replies.length} replies
                        </button>
                      </div>

                      {expandedPosts.has(post._id) && (
                        <div className="comments-section">
                          <div className="add-comment">
                            <textarea
                              placeholder="Add a reply..."
                              value={newComments[post._id] || ''}
                              onChange={(e) => setNewComments({ ...newComments, [post._id]: e.target.value })}
                              rows="2"
                            />
                            <button 
                              onClick={() => handleAddReply(post._id, newComments[post._id])}
                              disabled={!newComments[post._id]?.trim()}
                              className="submit-comment-btn"
                            >
                              Reply
                            </button>
                          </div>

                          <div className="comments-list">
                            {post.replies.map(reply => (
                              <div key={reply._id} className="comment-item">
                                <div className="comment-header">
                                  <span className="comment-author">{reply.authorName}</span>
                                  <span className="comment-date">
                                    {new Date(reply.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="comment-content">{reply.content}</div>
                                <div className="comment-actions">
                                  <button 
                                    className="like-btn"
                                    onClick={() => handleLikeReply(post._id, reply._id)}
                                  >
                                    ❤️ {reply.likeCount || 0}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="no-topic-selected">
              <p>Select a topic to view and participate in discussions.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Discussions;
