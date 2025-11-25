import { useEffect, useMemo, useState } from 'react';
import './Discussions.css';

const Resources = ({ user }) => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', url: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    checkAdminStatus();
    fetchResources();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAdminStatus = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/auth/users/${user.id}`, {
        headers: { 'user-id': user.id }
      });
      const data = await response.json();
      if (data.success && data.user) setIsAdmin(Boolean(data.user.admin));
    } catch (e) {
      console.error('Check admin failed', e);
    }
  };

  const fetchResources = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/resources');
      const data = await response.json();
      if (data.success) setResources(data.resources || []);
    } catch (e) {
      console.error('Fetch resources failed', e);
    } finally {
      setLoading(false);
    }
  };

  const descriptionWordCount = useMemo(() => {
    return form.description.trim().split(/\s+/).filter(Boolean).length;
  }, [form.description]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.url.trim() || !form.description.trim()) return;
    if (descriptionWordCount > 100) {
      alert('Description must be 100 words or fewer');
      return;
    }
    try {
      setSubmitting(true);
      const response = await fetch('http://localhost:5000/api/resources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': user.id
        },
        body: JSON.stringify(form)
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to add resource');
      }
      setResources([data.resource, ...resources]);
      setForm({ title: '', url: '', description: '' });
      setShowForm(false);
    } catch (e) {
      console.error('Create resource failed', e);
      alert(e.message || 'Failed to add resource');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="discussions-loading">Loading resources...</div>;
  }

  return (
    <div className="discussions-container">
      <div className="discussions-header">
        <h2>Helpful Resources</h2>
        {isAdmin && (
          <button className="add-topic-btn" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'Add Resource'}
          </button>
        )}
      </div>

      {showForm && isAdmin && (
        <form className="topic-form" onSubmit={handleSubmit}>
          <h3>Add New Resource</h3>
          <div className="form-group">
            <label htmlFor="res-title">Title</label>
            <input
              id="res-title"
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Resource title"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="res-url">URL</label>
            <input
              id="res-url"
              type="url"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="https://example.com/article"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="res-desc">Description (≤ 100 words)</label>
            <textarea
              id="res-desc"
              rows="3"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief summary of the resource"
              required
            />
            <div className="char-count">{descriptionWordCount}/100 words</div>
          </div>
          <div className="form-actions">
            <button type="submit" className="submit-btn" disabled={submitting}>
              {submitting ? 'Adding…' : 'Add Resource'}
            </button>
          </div>
        </form>
      )}

      <div className="resources-grid">
        {resources.length === 0 ? (
          <p className="no-topics">No resources yet.</p>
        ) : (
          resources.map((r) => (
            <a
              key={r._id}
              className="resource-card"
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              title={r.title}
            >
              <h4 className="resource-title">{r.title}</h4>
              <p className="resource-desc">{r.description}</p>
              <span className="resource-link">Visit ↗</span>
            </a>
          ))
        )}
      </div>
    </div>
  );
};

export default Resources;


