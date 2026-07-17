import { useState, useEffect } from 'react';
import TopicRequestForm from './TopicRequestForm';
import UserTopicRequestList from './UserTopicRequestList';
import AdminTopicRequestList from './AdminTopicRequestList';
import { API_BASE } from '../config';

const inputCls =
  'w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm text-gray-800 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 box-border resize-y';

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

  useEffect(() => {
    checkAdminStatus();
    fetchTopics();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/users/${user.id}`, {
        headers: { 'user-id': user.id }
      });
      const data = await response.json();
      if (data.success && data.user) setIsAdmin(data.user.admin || false);
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const fetchTopics = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/discussions/topics`);
      const data = await response.json();
      if (data.success) {
        setTopics(data.topics);
        if (data.topics.length > 0 && !selectedTopic) setSelectedTopic(data.topics[0]);
      }
    } catch (error) {
      console.error('Error fetching topics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async (topicId) => {
    try {
      const response = await fetch(`${API_BASE}/api/discussions/topics/${topicId}/posts`);
      const data = await response.json();
      if (data.success) setPosts(data.posts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  useEffect(() => {
    if (selectedTopic) fetchPosts(selectedTopic._id);
  }, [selectedTopic]);

  const handleCreateTopic = async (e) => {
    e.preventDefault();
    if (!newTopic.name.trim()) return;
    try {
      const response = await fetch(`${API_BASE}/api/discussions/topics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'user-id': user.id },
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
      const response = await fetch(`${API_BASE}/api/discussions/topics/${selectedTopic._id}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'user-id': user.id },
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
    setPosts(posts.map(post =>
      post._id === postId ? { ...post, likeCount: (post.likeCount || 0) + 1 } : post
    ));
    try {
      const response = await fetch(`${API_BASE}/api/discussions/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'user-id': user.id }
      });
      const data = await response.json();
      if (data.success) {
        setPosts(posts.map(post =>
          post._id === postId ? { ...post, likeCount: data.likeCount } : post
        ));
      } else {
        setPosts(posts.map(post =>
          post._id === postId ? { ...post, likeCount: (post.likeCount || 1) - 1 } : post
        ));
      }
    } catch (error) {
      console.error('Error liking post:', error);
      setPosts(posts.map(post =>
        post._id === postId ? { ...post, likeCount: (post.likeCount || 1) - 1 } : post
      ));
    }
  };

  const handleDeleteTopic = async (topicId) => {
    if (!window.confirm('Are you sure you want to delete this topic? This will also delete all posts in this topic.')) return;
    try {
      const response = await fetch(`${API_BASE}/api/discussions/topics/${topicId}`, {
        method: 'DELETE',
        headers: { 'user-id': user.id }
      });
      const data = await response.json();
      if (data.success) {
        setTopics(topics.filter(topic => topic._id !== topicId));
        if (selectedTopic && selectedTopic._id === topicId) {
          setSelectedTopic(topics.length > 1 ? topics.find(t => t._id !== topicId) : null);
          setPosts([]);
        }
      } else {
        alert(data.message || 'Failed to delete topic');
      }
    } catch (error) {
      console.error('Error deleting topic:', error);
      alert('Failed to delete topic');
    }
  };

  const handleRequestProcessed = () => { fetchTopics(); };
  const handleRequestCreated = () => {};

  const handleAddReply = async (postId, content) => {
    try {
      const response = await fetch(`${API_BASE}/api/discussions/posts/${postId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'user-id': user.id },
        body: JSON.stringify({ content })
      });
      const data = await response.json();
      if (data.success) {
        setPosts(posts.map(post =>
          post._id === postId ? { ...post, replies: [...post.replies, data.reply] } : post
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
    setPosts(posts.map(post =>
      post._id === postId
        ? { ...post, replies: post.replies.map(reply => reply._id === replyId ? { ...reply, likeCount: (reply.likeCount || 0) + 1 } : reply) }
        : post
    ));
    try {
      const response = await fetch(`${API_BASE}/api/discussions/posts/${postId}/replies/${replyId}/like`, {
        method: 'POST',
        headers: { 'user-id': user.id }
      });
      const data = await response.json();
      if (data.success) {
        setPosts(posts.map(post =>
          post._id === postId
            ? { ...post, replies: post.replies.map(reply => reply._id === replyId ? { ...reply, likeCount: data.likeCount } : reply) }
            : post
        ));
      } else {
        setPosts(posts.map(post =>
          post._id === postId
            ? { ...post, replies: post.replies.map(reply => reply._id === replyId ? { ...reply, likeCount: (reply.likeCount || 1) - 1 } : reply) }
            : post
        ));
      }
    } catch (error) {
      console.error('Error liking reply:', error);
      setPosts(posts.map(post =>
        post._id === postId
          ? { ...post, replies: post.replies.map(reply => reply._id === replyId ? { ...reply, likeCount: (reply.likeCount || 1) - 1 } : reply) }
          : post
      ));
    }
  };

  const togglePostExpansion = (postId) => {
    setExpandedPosts(prev => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId); else next.add(postId);
      return next;
    });
  };

  if (loading) {
    return <div className="text-center py-10 text-gray-500 text-lg">Loading discussions...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto bg-gray-50 rounded-lg shadow-sm p-4 sm:p-5">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center mb-5 pb-4 border-b-2 border-gray-200 gap-3">
        <h2 className="text-gray-800 m-0 text-2xl sm:text-3xl font-bold">Community Discussions</h2>
        {isAdmin && (
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white border-0 px-5 py-2.5 rounded-md cursor-pointer text-sm font-medium transition-colors"
            onClick={() => setShowTopicForm(!showTopicForm)}
          >
            {showTopicForm ? 'Cancel' : 'Add Topic'}
          </button>
        )}
      </div>

      {/* Admin create topic form */}
      {showTopicForm && isAdmin && (
        <form className="bg-white p-5 rounded-lg mb-5 shadow-sm" onSubmit={handleCreateTopic}>
          <h3 className="mt-0 text-gray-800 text-lg font-semibold mb-4">Create New Topic</h3>
          <div className="mb-4">
            <label htmlFor="topic-name" className="block mb-1.5 font-semibold text-sm text-gray-700">Topic Name</label>
            <input
              id="topic-name"
              type="text"
              className={inputCls}
              value={newTopic.name}
              onChange={(e) => setNewTopic({ ...newTopic, name: e.target.value })}
              placeholder="e.g., Infant Care"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="topic-description" className="block mb-1.5 font-semibold text-sm text-gray-700">Description (Optional)</label>
            <textarea
              id="topic-description"
              className={inputCls}
              value={newTopic.description}
              onChange={(e) => setNewTopic({ ...newTopic, description: e.target.value })}
              placeholder="Brief description of this topic..."
              rows="3"
            />
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button type="submit" className="bg-green-600 hover:bg-green-700 text-white border-0 px-5 py-2.5 rounded-md cursor-pointer text-sm font-medium transition-colors">
              Create Topic
            </button>
            <button type="button" onClick={() => setShowTopicForm(false)} className="bg-gray-400 hover:bg-gray-500 text-white border-0 px-5 py-2.5 rounded-md cursor-pointer text-sm font-medium transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      {isAdmin && <AdminTopicRequestList user={user} onRequestProcessed={handleRequestProcessed} />}
      {!isAdmin && <TopicRequestForm user={user} onRequestCreated={handleRequestCreated} />}

      {/* Main content: sidebar + posts */}
      <div className="flex flex-col lg:flex-row gap-5 mt-5 min-h-[400px]">
        {/* Topics sidebar */}
        <div className="w-full lg:w-72 lg:shrink-0 bg-white rounded-lg p-4 sm:p-5 shadow-sm h-fit">
          <h3 className="mt-0 mb-4 text-gray-800 font-semibold text-base border-b-2 border-gray-100 pb-2.5">Topics</h3>
          {topics.length === 0 ? (
            <p className="text-center text-gray-500 italic py-5">No topics available yet.</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {topics.map(topic => (
                <div
                  key={topic._id}
                  className={`group relative p-4 border rounded-md cursor-pointer transition-all ${
                    selectedTopic?._id === topic._id
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedTopic(topic)}
                >
                  <div className={isAdmin ? 'pr-6' : ''}>
                    <h4 className="m-0 mb-1 text-gray-800 text-base font-semibold">{topic.name}</h4>
                    {topic.description && <p className="m-0 text-gray-500 text-sm">{topic.description}</p>}
                  </div>
                  {isAdmin && (
                    <button
                      className="absolute top-1.5 right-1.5 bg-red-500 hover:bg-red-600 text-white border-0 rounded-full w-6 h-6 flex items-center justify-center text-base leading-none opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer p-0"
                      onClick={(e) => { e.stopPropagation(); handleDeleteTopic(topic._id); }}
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

        {/* Posts section */}
        <div className="flex-1 bg-white rounded-lg p-4 sm:p-5 shadow-sm min-w-0">
          {selectedTopic ? (
            <>
              <div className="mb-5 pb-4 border-b-2 border-gray-100">
                <h3 className="m-0 mb-1 text-gray-800 text-xl font-semibold">{selectedTopic.name}</h3>
                {selectedTopic.description && (
                  <p className="m-0 text-gray-500 text-sm">{selectedTopic.description}</p>
                )}
              </div>

              <form className="bg-gray-50 p-4 sm:p-5 rounded-lg mb-5 border border-gray-200" onSubmit={handleCreatePost}>
                <div className="mb-4">
                  <label htmlFor="post-content" className="block mb-2 font-semibold text-sm text-gray-700">
                    Share your thoughts (max 100 words)
                  </label>
                  <textarea
                    id="post-content"
                    className={inputCls}
                    value={newPost.content}
                    onChange={(e) => setNewPost({ content: e.target.value })}
                    placeholder="What's on your mind?"
                    rows="3"
                    maxLength="500"
                    required
                  />
                  <div className="text-right text-xs text-gray-500 mt-1.5">
                    {newPost.content.split(' ').filter(w => w.length > 0).length}/100 words
                  </div>
                </div>
                <button type="submit" className="bg-green-600 hover:bg-green-700 text-white border-0 px-5 py-2.5 rounded-md cursor-pointer text-sm font-medium transition-colors">
                  Post
                </button>
              </form>

              <div className="flex flex-col gap-4">
                {posts.length === 0 ? (
                  <p className="text-center text-gray-500 italic py-10">No posts yet. Be the first to share!</p>
                ) : (
                  posts.map(post => (
                    <div key={post._id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 sm:p-5 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-center mb-2.5">
                        <span className="font-semibold text-gray-800">{post.authorName}</span>
                        <span className="text-gray-500 text-sm">{new Date(post.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="text-gray-700 leading-relaxed mb-4">{post.content}</div>
                      <div className="flex flex-wrap gap-3 items-center">
                        <button
                          className="bg-transparent border border-gray-300 px-3 py-2 rounded-full cursor-pointer text-sm flex items-center gap-1.5 hover:bg-gray-100 hover:border-blue-400 text-black transition-all"
                          onClick={() => handleLikePost(post._id)}
                        >
                          ❤️ {post.likeCount || 0}
                        </button>
                        <button
                          className="bg-transparent border border-gray-300 px-3 py-2 rounded-full cursor-pointer text-sm flex items-center gap-1.5 text-gray-500 hover:bg-gray-100 hover:border-blue-400 hover:text-blue-500 transition-all"
                          onClick={() => togglePostExpansion(post._id)}
                        >
                          💬 {post.replies.length} replies
                        </button>
                      </div>

                      {expandedPosts.has(post._id) && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <textarea
                              className={`${inputCls} min-h-[60px] mb-2.5`}
                              placeholder="Add a reply..."
                              value={newComments[post._id] || ''}
                              onChange={(e) => setNewComments({ ...newComments, [post._id]: e.target.value })}
                              rows="2"
                            />
                            <button
                              onClick={() => handleAddReply(post._id, newComments[post._id])}
                              disabled={!newComments[post._id]?.trim()}
                              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white border-0 px-4 py-2 rounded-md cursor-pointer text-sm font-medium transition-colors disabled:cursor-not-allowed"
                            >
                              Reply
                            </button>
                          </div>

                          <div className="flex flex-col gap-3">
                            {post.replies.map(reply => (
                              <div key={reply._id} className="bg-white border border-gray-200 rounded-lg p-4">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="font-semibold text-gray-800 text-sm">{reply.authorName}</span>
                                  <span className="text-gray-500 text-xs">{new Date(reply.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="text-gray-700 leading-snug mb-2.5 text-sm">{reply.content}</div>
                                <button
                                  className="bg-transparent border border-gray-300 px-3 py-1.5 rounded-full cursor-pointer text-sm flex items-center gap-1.5 hover:bg-gray-100 hover:border-blue-400 text-black transition-all"
                                  onClick={() => handleLikeReply(post._id, reply._id)}
                                >
                                  ❤️ {reply.likeCount || 0}
                                </button>
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
            <div className="text-center text-gray-500 italic py-10">
              Select a topic to view and participate in discussions.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Discussions;
