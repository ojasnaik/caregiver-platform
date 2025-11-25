import { useState, useEffect } from 'react';
import './AdminTopicRequestList.css';

const AdminTopicRequestList = ({ user, onRequestProcessed }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});

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

  const handleReject = async (requestId) => {
    if (!window.confirm('Are you sure you want to reject this topic request?')) {
      return;
    }

    setProcessing({ ...processing, [requestId]: 'rejecting' });
    try {
      const response = await fetch(`http://localhost:5000/api/discussions/topic-requests/${requestId}/reject`, {
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
                className="reject-btn"
                onClick={() => handleReject(request._id)}
                disabled={processing[request._id]}
              >
                {processing[request._id] === 'rejecting' ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminTopicRequestList;

