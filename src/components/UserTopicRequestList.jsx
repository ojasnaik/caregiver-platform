import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import './UserTopicRequestList.css';

const UserTopicRequestList = forwardRef(({ user }, ref) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRequest, setEditingRequest] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchRequests = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/discussions/topic-requests/my-requests', {
        headers: {
          'user-id': user.id
        }
      });
      const data = await response.json();
      if (data.success) {
        setRequests(data.requests);
      }
    } catch (error) {
      console.error('Error fetching topic requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    refresh: fetchRequests
  }));

  useEffect(() => {
    fetchRequests();
  }, [user.id]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved':
        return '#4CAF50'; // Green
      case 'Pending':
        return '#FFC107'; // Yellow/Amber
      case 'Rejected':
        return '#f44336'; // Red
      case 'Edit_Requested':
        return '#2196F3'; // Blue
      default:
        return '#757575'; // Gray
    }
  };

  const getStatusBgColor = (status) => {
    switch (status) {
      case 'Approved':
        return '#e8f5e9'; // Light green
      case 'Pending':
        return '#fff9c4'; // Light yellow
      case 'Rejected':
        return '#ffebee'; // Light red
      case 'Edit_Requested':
        return '#e3f2fd'; // Light blue
      default:
        return '#f5f5f5'; // Light gray
    }
  };

  const handleEdit = (request) => {
    setEditingRequest(request._id);
    setEditForm({
      name: request.name,
      description: request.description || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingRequest(null);
    setEditForm({ name: '', description: '' });
  };

  const handleSubmitEdit = async (requestId) => {
    if (!editForm.name.trim()) {
      alert('Topic name is required');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`http://localhost:5000/api/discussions/topic-requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'user-id': user.id
        },
        body: JSON.stringify(editForm)
      });

      const data = await response.json();
      if (data.success) {
        setEditingRequest(null);
        setEditForm({ name: '', description: '' });
        fetchRequests();
      } else {
        alert(data.message || 'Failed to update topic request');
      }
    } catch (error) {
      console.error('Error updating topic request:', error);
      alert('Failed to update topic request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="user-requests-loading">Loading your requests...</div>;
  }

  if (requests.length === 0) {
    return (
      <div className="user-requests-section">
        <h3>My Topic Requests</h3>
        <p className="no-requests">You haven't submitted any topic requests yet.</p>
      </div>
    );
  }

  return (
    <div className="user-requests-section">
      <h3>My Topic Requests</h3>
      <div className="requests-list">
        {requests.map(request => (
          <div key={request._id} className="request-item">
            <div className="request-header">
              <h4>{request.name}</h4>
              <span 
                className="status-badge"
                style={{
                  backgroundColor: getStatusBgColor(request.status),
                  color: getStatusColor(request.status),
                  borderColor: getStatusColor(request.status)
                }}
              >
                {request.status === 'Edit_Requested' ? 'Edit Requested' : request.status}
              </span>
            </div>
            
            {editingRequest === request._id ? (
              <div className="edit-form">
                <div className="form-group">
                  <label>Topic Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    maxLength={50}
                  />
                </div>
                <div className="form-group">
                  <label>Description (Optional)</label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    maxLength={200}
                    rows="3"
                  />
                </div>
                <div className="edit-form-actions">
                  <button
                    className="save-edit-btn"
                    onClick={() => handleSubmitEdit(request._id)}
                    disabled={submitting || !editForm.name.trim()}
                  >
                    {submitting ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    className="cancel-edit-btn"
                    onClick={handleCancelEdit}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                {request.description && (
                  <p className="request-description">{request.description}</p>
                )}
                {request.status === 'Edit_Requested' && request.feedbackText && (
                  <div className="feedback-section">
                    <p className="feedback-label">Admin Feedback:</p>
                    <p className="feedback-text">{request.feedbackText}</p>
                  </div>
                )}
                {request.status === 'Rejected' && request.rejectionReason && (
                  <div className="rejection-section">
                    <p className="rejection-label">Rejection Reason:</p>
                    <p className="rejection-text">{request.rejectionReason}</p>
                  </div>
                )}
                <div className="request-meta">
                  <span className="request-date">
                    Submitted: {new Date(request.createdAt).toLocaleDateString()}
                  </span>
                  {request.reviewedAt && (
                    <span className="review-date">
                      Reviewed: {new Date(request.reviewedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
                {request.status === 'Edit_Requested' && (
                  <button
                    className="edit-request-btn"
                    onClick={() => handleEdit(request)}
                  >
                    Edit Request
                  </button>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
});

UserTopicRequestList.displayName = 'UserTopicRequestList';

export default UserTopicRequestList;

