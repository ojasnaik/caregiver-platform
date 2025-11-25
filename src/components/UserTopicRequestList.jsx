import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import './UserTopicRequestList.css';

const UserTopicRequestList = forwardRef(({ user }, ref) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

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
      default:
        return '#f5f5f5'; // Light gray
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
                {request.status}
              </span>
            </div>
            {request.description && (
              <p className="request-description">{request.description}</p>
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
          </div>
        ))}
      </div>
    </div>
  );
});

UserTopicRequestList.displayName = 'UserTopicRequestList';

export default UserTopicRequestList;

