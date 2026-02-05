import { useState, useEffect } from 'react';
import './AdminTopicRequestList.css';

const AdminTopicRequestList = ({ user, onRequestProcessed }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});
  const [showEditModal, setShowEditModal] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(null);
  const [editFeedback, setEditFeedback] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  const fetchPendingRequests = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/discussions/topic-requests/pending', {
        headers: {
          'user-id': user.id
        }
      });
      const data = await response.json();
      if (data.success) {
        setRequests(data.requests);
      }
    } catch (error) {
      console.error('Error fetching pending topic requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingRequests();
  }, [user.id]);

  const handleApprove = async (requestId) => {
    setProcessing({ ...processing, [requestId]: 'approving' });
    try {
      const response = await fetch(`http://localhost:5000/api/discussions/topic-requests/${requestId}/approve`, {
        method: 'POST',
        headers: {
          'user-id': user.id
        }
      });

      const data = await response.json();
      if (data.success) {
        // Remove from list (rejected requests disappear from admin view)
        setRequests(requests.filter(req => req._id !== requestId));
        if (onRequestProcessed) {
          onRequestProcessed();
        }
      } else {
        alert(data.message || 'Failed to approve topic request');
      }
    } catch (error) {
      console.error('Error approving topic request:', error);
      alert('Failed to approve topic request');
    } finally {
      setProcessing({ ...processing, [requestId]: null });
    }
  };

  const handleRequestEdit = async (requestId) => {
    if (!editFeedback.trim()) {
      alert('Please provide feedback text');
      return;
    }

    setProcessing({ ...processing, [requestId]: 'requesting-edit' });
    try {
      const response = await fetch(`http://localhost:5000/api/discussions/topic-requests/${requestId}/request-edit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': user.id
        },
        body: JSON.stringify({ feedbackText: editFeedback })
      });

      const data = await response.json();
      if (data.success) {
        setShowEditModal(null);
        setEditFeedback('');
        fetchPendingRequests();
        if (onRequestProcessed) {
          onRequestProcessed();
        }
      } else {
        alert(data.message || 'Failed to request edits');
      }
    } catch (error) {
      console.error('Error requesting edits:', error);
      alert('Failed to request edits');
    } finally {
      setProcessing({ ...processing, [requestId]: null });
    }
  };

  const handleReject = async (requestId) => {
    setProcessing({ ...processing, [requestId]: 'rejecting' });
    try {
      const response = await fetch(`http://localhost:5000/api/discussions/topic-requests/${requestId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': user.id
        },
        body: JSON.stringify({ reason: rejectReason })
      });

      const data = await response.json();
      if (data.success) {
        setShowRejectModal(null);
        setRejectReason('');
        // Remove from list (rejected requests disappear from admin view)
        setRequests(requests.filter(req => req._id !== requestId));
        if (onRequestProcessed) {
          onRequestProcessed();
        }
      } else {
        alert(data.message || 'Failed to reject topic request');
      }
    } catch (error) {
      console.error('Error rejecting topic request:', error);
      alert('Failed to reject topic request');
    } finally {
      setProcessing({ ...processing, [requestId]: null });
    }
  };

  if (loading) {
    return <div className="admin-requests-loading">Loading pending requests...</div>;
  }

  if (requests.length === 0) {
    return (
      <div className="admin-requests-section">
        <h3>Pending Topic Requests</h3>
        <p className="no-pending-requests">No pending topic requests.</p>
      </div>
    );
  }

  return (
    <div className="admin-requests-section">
      <h3>Pending Topic Requests</h3>
      <div className="pending-requests-list">
        {requests.map(request => (
          <div key={request._id} className="pending-request-item">
            <div className="pending-request-header">
              <div>
                <h4>{request.name}</h4>
                {request.userId && (
                  <p className="request-author">
                    Requested by: {request.userId.alias || request.userId.name}
                  </p>
                )}
              </div>
              <span className="pending-badge">Pending</span>
            </div>
            {request.description && (
              <p className="pending-request-description">{request.description}</p>
            )}
            {request.status === 'Edit_Requested' && request.feedbackText && (
              <div className="feedback-section">
                <p className="feedback-label">Feedback:</p>
                <p className="feedback-text">{request.feedbackText}</p>
              </div>
            )}
            <div className="pending-request-meta">
              <span className="pending-request-date">
                Submitted: {new Date(request.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="pending-request-actions">
              <button
                className="approve-btn"
                onClick={() => handleApprove(request._id)}
                disabled={processing[request._id]}
              >
                {processing[request._id] === 'approving' ? 'Approving...' : 'Approve'}
              </button>
              <button
                className="request-edit-btn"
                onClick={() => {
                  setShowEditModal(request._id);
                  setEditFeedback('');
                }}
                disabled={processing[request._id] || request.status === 'Edit_Requested'}
              >
                Request Edit
              </button>
              <button
                className="reject-btn"
                onClick={() => {
                  setShowRejectModal(request._id);
                  setRejectReason('');
                }}
                disabled={processing[request._id]}
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Request Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Request Edits</h3>
            <p className="modal-description">Provide feedback to help the user improve their topic request:</p>
            <textarea
              className="modal-textarea"
              value={editFeedback}
              onChange={(e) => setEditFeedback(e.target.value)}
              placeholder="Enter feedback for the user..."
              rows="5"
            />
            <div className="modal-actions">
              <button
                className="modal-submit-btn"
                onClick={() => handleRequestEdit(showEditModal)}
                disabled={processing[showEditModal] || !editFeedback.trim()}
              >
                {processing[showEditModal] === 'requesting-edit' ? 'Sending...' : 'Send Feedback'}
              </button>
              <button
                className="modal-cancel-btn"
                onClick={() => {
                  setShowEditModal(null);
                  setEditFeedback('');
                }}
                disabled={processing[showEditModal]}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="modal-overlay" onClick={() => setShowRejectModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Reject Topic Request</h3>
            <p className="modal-description">Please provide a reason for rejection (optional but recommended):</p>
            <textarea
              className="modal-textarea"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows="5"
            />
            <div className="modal-actions">
              <button
                className="reject-btn"
                onClick={() => handleReject(showRejectModal)}
                disabled={processing[showRejectModal]}
              >
                {processing[showRejectModal] === 'rejecting' ? 'Rejecting...' : 'Confirm Reject'}
              </button>
              <button
                className="modal-cancel-btn"
                onClick={() => {
                  setShowRejectModal(null);
                  setRejectReason('');
                }}
                disabled={processing[showRejectModal]}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTopicRequestList;

