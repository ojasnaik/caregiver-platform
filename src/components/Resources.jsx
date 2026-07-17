import { useEffect, useMemo, useState } from 'react';
import { API_BASE } from '../config';

const inputCls =
  'w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm text-gray-800 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 box-border resize-y';

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
      const response = await fetch(`${API_BASE}/api/auth/users/${user.id}`, {
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
      const response = await fetch(`${API_BASE}/api/resources`);
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
      const response = await fetch(`${API_BASE}/api/resources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'user-id': user.id },
        body: JSON.stringify(form)
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Failed to add resource');
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
    return <div className="text-center py-10 text-gray-500 text-lg">Loading resources...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto bg-gray-50 rounded-lg shadow-sm p-4 sm:p-5">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center mb-5 pb-4 border-b-2 border-gray-200 gap-3">
        <h2 className="text-gray-800 m-0 text-2xl sm:text-3xl font-bold">Helpful Resources</h2>
        {isAdmin && (
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white border-0 px-5 py-2.5 rounded-md cursor-pointer text-sm font-medium transition-colors"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Cancel' : 'Add Resource'}
          </button>
        )}
      </div>

      {/* Admin add resource form */}
      {showForm && isAdmin && (
        <form className="bg-white p-5 rounded-lg mb-5 shadow-sm" onSubmit={handleSubmit}>
          <h3 className="mt-0 text-gray-800 text-lg font-semibold mb-4">Add New Resource</h3>
          <div className="mb-4">
            <label htmlFor="res-title" className="block mb-1.5 font-semibold text-sm text-gray-700">Title</label>
            <input
              id="res-title"
              type="text"
              className={inputCls}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Resource title"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="res-url" className="block mb-1.5 font-semibold text-sm text-gray-700">URL</label>
            <input
              id="res-url"
              type="url"
              className={inputCls}
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="https://example.com/article"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="res-desc" className="block mb-1.5 font-semibold text-sm text-gray-700">Description (≤ 100 words)</label>
            <textarea
              id="res-desc"
              rows="3"
              className={inputCls}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief summary of the resource"
              required
            />
            <div className="text-right text-xs text-gray-500 mt-1.5">{descriptionWordCount}/100 words</div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white border-0 px-5 py-2.5 rounded-md cursor-pointer text-sm font-medium transition-colors disabled:cursor-not-allowed"
          >
            {submitting ? 'Adding…' : 'Add Resource'}
          </button>
        </form>
      )}

      {/* Resources grid */}
      {resources.length === 0 ? (
        <p className="text-center text-gray-500 italic py-10">No resources yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((r) => (
            <a
              key={r._id}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              title={r.title}
              className="flex flex-col gap-2 bg-white border border-gray-200 rounded-xl p-4 no-underline text-inherit hover:shadow-lg hover:-translate-y-px transition-all"
            >
              <h4 className="m-0 text-gray-800 text-base font-semibold leading-snug">{r.title}</h4>
              <p className="m-0 text-gray-600 text-sm leading-relaxed flex-1">{r.description}</p>
              <span className="mt-auto text-sm text-blue-500 font-medium">Visit ↗</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export default Resources;
