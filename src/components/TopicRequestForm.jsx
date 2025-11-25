import { useState, useRef } from 'react';
import './TopicRequestForm.css';
import UserTopicRequestList from './UserTopicRequestList';

const TopicRequestForm = ({ user, onRequestCreated }) => {
  const requestListRef = useRef(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch('http://localhost:5000/api/discussions/topic-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': user.id
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        setFormData({ name: '', description: '' });
        setShowForm(false);
        // Refresh the request list
        if (requestListRef.current) {
          requestListRef.current.refresh();
        }
        if (onRequestCreated) {
          onRequestCreated();
        }
      } else {
        alert(data.message || 'Failed to create topic request');
      }
    } catch (error) {
      console.error('Error creating topic request:', error);
      alert('Failed to create topic request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="topic-request-form-container">
      <button 
        className="request-topic-btn"
        onClick={() => setShowForm(!showForm)}
      >
        {showForm ? 'Cancel Request' : 'Request New Topic'}
      </button>

      {showForm && (
        <form className="topic-request-form" onSubmit={handleSubmit}>
          <h3>Request a New Topic</h3>
          <div className="form-group">
            <label htmlFor="request-topic-name">Topic Name</label>
            <input
              id="request-topic-name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Infant Care"
              required
              disabled={submitting}
            />
          </div>
          <div className="form-group">
            <label htmlFor="request-topic-description">Description (Optional)</label>
            <textarea
              id="request-topic-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of this topic..."
              rows="3"
              disabled={submitting}
            />
          </div>
          <div className="form-actions">
            <button 
              type="submit" 
              className="submit-btn" 
              disabled={submitting || !formData.name.trim()}
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
            <button 
              type="button" 
              onClick={() => {
                setShowForm(false);
                setFormData({ name: '', description: '' });
              }} 
              className="cancel-btn"
              disabled={submitting}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
      <UserTopicRequestList ref={requestListRef} user={user} />
    </div>
  );
};

export default TopicRequestForm;

