import { useState, useEffect } from 'react';

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
    return <div className="text-center text-gray-500 py-5">Loading pending requests...</div>;
  }

  if (requests.length === 0) {
    return (
      <div className="mt-4">
        <h3 className="font-semibold text-gray-800 mb-3">Pending Topic Requests</h3>
        <p className="text-gray-500 text-sm italic text-center py-5">No pending topic requests.</p>
      </div>
    );
  }

  const actionBtnBase = 'border-0 px-4 py-2 rounded text-sm cursor-pointer transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed';

  return (
    <div className="mt-4">
      <h3 className="font-semibold text-gray-800 mb-3">Pending Topic Requests</h3>
      <div className="flex flex-col gap-4">
        {requests.map(request => (
          <div key={request._id} className="bg-white p-5 rounded-lg border border-gray-200 border-l-4 border-l-yellow-400 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-semibold text-gray-800 m-0 mb-1">{request.name}</h4>
                {request.userId && (
                  <p className="text-sm text-gray-500 italic m-0">
                    Requested by: {request.userId.alias || request.userId.name}
                  </p>
                )}
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-500 border border-yellow-400 uppercase tracking-wide whitespace-nowrap">
                Pending
              </span>
            </div>
            {request.description && (
              <p className="text-gray-600 text-sm mb-2">{request.description}</p>
            )}
            {request.status === 'Edit_Requested' && request.feedbackText && (
              <div className="my-3 p-3 bg-blue-50 border-l-4 border-l-blue-500 rounded">
                <p className="text-sm font-semibold text-blue-700 mb-1">Feedback:</p>
                <p className="text-sm text-blue-800 m-0">{request.feedbackText}</p>
              </div>
            )}
            <div className="text-xs text-gray-400 mt-2 mb-3">
              Submitted: {new Date(request.createdAt).toLocaleDateString()}
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                className={`${actionBtnBase} bg-green-500 hover:bg-green-600 text-white`}
                onClick={() => handleApprove(request._id)}
                disabled={processing[request._id]}
              >
                {processing[request._id] === 'approving' ? 'Approving...' : 'Approve'}
              </button>
              <button
                className={`${actionBtnBase} bg-blue-500 hover:bg-blue-600 text-white`}
                onClick={() => {
                  setShowEditModal(request._id);
                  setEditFeedback('');
                }}
                disabled={processing[request._id] || request.status === 'Edit_Requested'}
              >
                Request Edit
              </button>
              <button
                className={`${actionBtnBase} bg-red-500 hover:bg-red-600 text-white`}
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
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[1000]" onClick={() => setShowEditModal(null)}>
          <div className="bg-white p-6 rounded-lg max-w-lg w-[90%] shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="mt-0 mb-3 text-gray-800">Request Edits</h3>
            <p className="text-sm text-gray-600 mb-3">Provide feedback to help the user improve their topic request:</p>
            <textarea
              className="w-full px-2.5 py-2.5 border border-gray-300 rounded text-sm resize-y mb-4 box-border focus:outline-none focus:border-blue-500 font-[inherit]"
              value={editFeedback}
              onChange={(e) => setEditFeedback(e.target.value)}
              placeholder="Enter feedback for the user..."
              rows="5"
            />
            <div className="flex gap-2.5 justify-end">
              <button
                className={`${actionBtnBase} bg-blue-500 hover:bg-blue-600 text-white`}
                onClick={() => handleRequestEdit(showEditModal)}
                disabled={processing[showEditModal] || !editFeedback.trim()}
              >
                {processing[showEditModal] === 'requesting-edit' ? 'Sending...' : 'Send Feedback'}
              </button>
              <button
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 border-0 px-4 py-2 rounded text-sm cursor-pointer transition-colors"
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
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[1000]" onClick={() => setShowRejectModal(null)}>
          <div className="bg-white p-6 rounded-lg max-w-lg w-[90%] shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="mt-0 mb-3 text-gray-800">Reject Topic Request</h3>
            <p className="text-sm text-gray-600 mb-3">Please provide a reason for rejection (optional but recommended):</p>
            <textarea
              className="w-full px-2.5 py-2.5 border border-gray-300 rounded text-sm resize-y mb-4 box-border focus:outline-none focus:border-blue-500 font-[inherit]"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows="5"
            />
            <div className="flex gap-2.5 justify-end">
              <button
                className={`${actionBtnBase} bg-red-500 hover:bg-red-600 text-white`}
                onClick={() => handleReject(showRejectModal)}
                disabled={processing[showRejectModal]}
              >
                {processing[showRejectModal] === 'rejecting' ? 'Rejecting...' : 'Confirm Reject'}
              </button>
              <button
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 border-0 px-4 py-2 rounded text-sm cursor-pointer transition-colors"
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
