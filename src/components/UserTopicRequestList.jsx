import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';

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
      case 'Approved': return '#4CAF50';
      case 'Pending': return '#FFC107';
      case 'Rejected': return '#f44336';
      case 'Edit_Requested': return '#2196F3';
      default: return '#757575';
    }
  };

  const getStatusBgColor = (status) => {
    switch (status) {
      case 'Approved': return '#e8f5e9';
      case 'Pending': return '#fff9c4';
      case 'Rejected': return '#ffebee';
      case 'Edit_Requested': return '#e3f2fd';
      default: return '#f5f5f5';
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

  const editFieldClass = 'w-full px-2 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 font-[inherit] box-border';

  if (loading) {
    return <div className="text-center text-gray-500 py-5">Loading your requests...</div>;
  }

  if (requests.length === 0) {
    return (
      <div className="mt-5 p-5 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="mt-0 mb-3 font-semibold text-gray-800">My Topic Requests</h3>
        <p className="text-gray-500 text-sm italic text-center py-5">You haven't submitted any topic requests yet.</p>
      </div>
    );
  }

  return (
    <div className="mt-5 p-5 bg-gray-50 rounded-lg border border-gray-200">
      <h3 className="mt-0 mb-3 font-semibold text-gray-800">My Topic Requests</h3>
      <div className="flex flex-col gap-4">
        {requests.map(request => (
          <div key={request._id} className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center mb-2.5">
              <h4 className="font-semibold text-gray-800 m-0">{request.name}</h4>
              <span
                className="px-3 py-1 rounded-full text-xs font-semibold border uppercase tracking-wide"
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
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="mb-3">
                  <label className="block mb-1 text-sm font-medium text-gray-700">Topic Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className={editFieldClass}
                    maxLength={50}
                  />
                </div>
                <div className="mb-3">
                  <label className="block mb-1 text-sm font-medium text-gray-700">Description (Optional)</label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className={`${editFieldClass} resize-y`}
                    maxLength={200}
                    rows="3"
                  />
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    className="bg-green-500 hover:bg-green-600 text-white border-0 px-4 py-2 rounded text-sm cursor-pointer transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                    onClick={() => handleSubmitEdit(request._id)}
                    disabled={submitting || !editForm.name.trim()}
                  >
                    {submitting ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 border-0 px-4 py-2 rounded text-sm cursor-pointer transition-colors disabled:opacity-50"
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
                  <p className="text-gray-600 text-sm mb-2">{request.description}</p>
                )}
                {request.status === 'Edit_Requested' && request.feedbackText && (
                  <div className="my-4 p-3 bg-blue-50 border-l-4 border-l-blue-500 rounded">
                    <p className="text-sm font-semibold text-blue-700 mb-1">Admin Feedback:</p>
                    <p className="text-sm text-blue-800 m-0">{request.feedbackText}</p>
                  </div>
                )}
                {request.status === 'Rejected' && request.rejectionReason && (
                  <div className="my-4 p-3 bg-red-50 border-l-4 border-l-red-500 rounded">
                    <p className="text-sm font-semibold text-red-700 mb-1">Rejection Reason:</p>
                    <p className="text-sm text-red-800 m-0">{request.rejectionReason}</p>
                  </div>
                )}
                <div className="flex gap-4 text-xs text-gray-400 mt-2 mb-2">
                  <span>Submitted: {new Date(request.createdAt).toLocaleDateString()}</span>
                  {request.reviewedAt && (
                    <span>Reviewed: {new Date(request.reviewedAt).toLocaleDateString()}</span>
                  )}
                </div>
                {request.status === 'Edit_Requested' && (
                  <button
                    className="mt-2 bg-blue-500 hover:bg-blue-600 text-white border-0 px-4 py-2 rounded text-sm cursor-pointer transition-colors"
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
