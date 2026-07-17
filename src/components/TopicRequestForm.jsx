import { useState, useRef } from 'react';
import UserTopicRequestList from './UserTopicRequestList';
import { API_BASE } from '../config';

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
      const response = await fetch(`${API_BASE}/api/discussions/topic-requests`, {
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

  const fieldClass = 'w-full px-2 py-2 border border-gray-300 rounded text-sm box-border focus:outline-none focus:border-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed font-[inherit]';

  return (
    <div className="mb-5">
      <button
        className="bg-green-500 hover:bg-green-600 text-white border-0 px-5 py-2.5 rounded cursor-pointer text-sm font-medium transition-colors"
        onClick={() => setShowForm(!showForm)}
      >
        {showForm ? 'Cancel Request' : 'Request New Topic'}
      </button>

      {showForm && (
        <form className="bg-gray-50 p-5 rounded-lg mt-4 border border-gray-200" onSubmit={handleSubmit}>
          <h3 className="mt-0 mb-4 text-gray-800 font-semibold">Request a New Topic</h3>
          <div className="mb-4">
            <label htmlFor="request-topic-name" className="block mb-1 font-medium text-gray-600 text-sm">Topic Name</label>
            <input
              id="request-topic-name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={fieldClass}
              placeholder="e.g., Infant Care"
              required
              disabled={submitting}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="request-topic-description" className="block mb-1 font-medium text-gray-600 text-sm">Description (Optional)</label>
            <textarea
              id="request-topic-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={fieldClass}
              placeholder="Brief description of this topic..."
              rows="3"
              disabled={submitting}
            />
          </div>
          <div className="flex gap-2.5 mt-4">
            <button
              type="submit"
              className="bg-green-500 hover:bg-green-600 text-white border-0 px-5 py-2.5 rounded cursor-pointer text-sm font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
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
              className="bg-red-500 hover:bg-red-600 text-white border-0 px-5 py-2.5 rounded cursor-pointer text-sm font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
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
