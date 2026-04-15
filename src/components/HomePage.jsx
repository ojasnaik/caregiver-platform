import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Discussions from './Discussions';
import Resources from './Resources';
import SupportChat from './SupportChat';

const TABS = [
  { id: 'home', label: 'Home' },
  { id: 'discussions', label: 'Discussions' },
  { id: 'resources', label: 'Resources' },
  { id: 'support-chat', label: 'Support Chat' },
];

const inputCls =
  'border border-gray-300 rounded-md px-2.5 py-2 text-sm text-gray-800 bg-white w-full focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 appearance-none';
const labelCls = 'text-sm text-gray-700 font-medium';

const HomePage = () => {
  const [user, setUser] = useState(null);
  const [otherUsers, setOtherUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [editProfile, setEditProfile] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedUserIds, setExpandedUserIds] = useState(new Set());
  const [activeTab, setActiveTab] = useState('home');
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      setEditProfile({
        name: parsed.name || '',
        alias: parsed.alias || '',
        age: parsed.age || '',
        caregiverType: parsed.caregiverType || 'parent',
        familyInfo: {
          numberOfKids: parsed.familyInfo?.numberOfKids ?? 1,
          kidsAgeGroups: Array.isArray(parsed.familyInfo?.kidsAgeGroups) ? parsed.familyInfo.kidsAgeGroups : [],
          additionalInfo: parsed.familyInfo?.additionalInfo || ''
        },
        isPrivate: Boolean(parsed.isPrivate),
        location: {
          city: parsed.location?.city || '',
          state: parsed.location?.state || ''
        },
        showLocation: Boolean(parsed.showLocation)
      });

      fetch(`http://localhost:5000/api/auth/users/${parsed.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.user) {
            const u = data.user;
            const normalized = { ...parsed, ...u, id: u._id || parsed.id };
            setUser(normalized);
            setEditProfile({
              name: u.name || '',
              alias: u.alias || '',
              age: u.age || '',
              caregiverType: u.caregiverType || 'parent',
              familyInfo: {
                numberOfKids: u.familyInfo?.numberOfKids ?? 1,
                kidsAgeGroups: Array.isArray(u.familyInfo?.kidsAgeGroups) ? u.familyInfo.kidsAgeGroups : [],
                additionalInfo: u.familyInfo?.additionalInfo || ''
              },
              isPrivate: Boolean(u.isPrivate),
              location: {
                city: u.location?.city || '',
                state: u.location?.state || ''
              },
              showLocation: Boolean(u.showLocation)
            });
            localStorage.setItem('user', JSON.stringify(normalized));
          }
        })
        .catch(err => console.error('Fetch self profile error:', err));

      fetch(`http://localhost:5000/api/auth/users?currentUserId=${parsed.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) setOtherUsers(data.users || []);
        })
        .catch(err => console.error('Fetch users error:', err))
        .finally(() => setLoadingUsers(false));
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-600 text-lg">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f7fa] to-[#c3cfe2]">
      {/* Navbar */}
      <nav className="bg-white shadow-sm sticky top-0 z-40">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center gap-2">
          <h1 className="text-gray-800 text-lg sm:text-2xl font-bold m-0 shrink-0">
            Caregiver Platform
          </h1>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden sm:inline text-gray-600 font-medium text-sm">
              Welcome, {user.name}!
            </span>
            <button
              type="button"
              className="p-0 border-0 bg-transparent cursor-pointer"
              aria-label="Open your profile"
              aria-haspopup="true"
              aria-expanded={isProfileOpen}
              onClick={() => setIsProfileOpen((prev) => !prev)}
            >
              <span className="w-9 h-9 rounded-full bg-blue-700 text-white inline-flex items-center justify-center font-bold text-xs tracking-wide shadow">
                {(user.alias || user.name || '?')
                  .split(' ')
                  .map((p) => p[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </span>
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white border-0 rounded-md px-3 py-1.5 text-sm font-medium cursor-pointer transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Tab navigation — horizontally scrollable on mobile */}
        <div className="flex border-b-2 border-gray-200 mb-6 -mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              className={`shrink-0 bg-transparent border-0 border-b-[3px] px-4 sm:px-6 py-3 text-sm sm:text-base font-semibold cursor-pointer transition-all whitespace-nowrap ${
                activeTab === id
                  ? 'text-blue-700 border-b-blue-700 bg-gray-50'
                  : 'text-gray-500 border-b-transparent hover:text-gray-800 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'home' && (
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-gray-800 text-2xl sm:text-3xl lg:text-4xl font-bold mb-3">
                Welcome to our platform
              </h2>
              <p className="text-gray-500 text-base sm:text-lg">
                You&apos;re now part of a supportive community of caregivers and single parents.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 lg:p-8">
              <h3 className="text-gray-800 text-lg sm:text-xl font-semibold mb-4 text-center">
                Other Active Users:
              </h3>
              {loadingUsers ? (
                <p className="text-gray-500">Loading users...</p>
              ) : otherUsers.length === 0 ? (
                <p className="text-gray-500">No users to show right now.</p>
              ) : (
                <ul className="list-disc pl-5 space-y-1">
                  {otherUsers.map((u) => {
                    const isOpen = expandedUserIds.has(u._id);
                    return (
                      <li key={u._id} className="my-1">
                        <button
                          type="button"
                          className="bg-transparent border-0 text-blue-700 font-semibold cursor-pointer text-left p-0 hover:underline"
                          aria-expanded={isOpen}
                          onClick={() => {
                            setExpandedUserIds(prev => {
                              const next = new Set(prev);
                              if (next.has(u._id)) next.delete(u._id); else next.add(u._id);
                              return next;
                            });
                          }}
                        >
                          {u.alias || u.name}
                        </button>
                        {isOpen && (
                          <div className="mt-1 mb-2 ml-1 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                            <p className="m-0 py-0.5 text-gray-800"><strong>Role:</strong> {u.caregiverType.charAt(0).toUpperCase() + u.caregiverType.slice(1)}</p>
                            <p className="m-0 py-0.5 text-gray-800"><strong>Children:</strong> {u.familyInfo?.numberOfKids}</p>
                            {Array.isArray(u.familyInfo?.kidsAgeGroups) && u.familyInfo.kidsAgeGroups.length > 0 && (
                              <p className="m-0 py-0.5 text-gray-800"><strong>Age Groups:</strong> {u.familyInfo.kidsAgeGroups.join(', ')}</p>
                            )}
                            {u.showLocation && u.location && (u.location.city || u.location.state) && (
                              <p className="m-0 py-0.5 text-gray-800"><strong>Location:</strong> {[u.location.city, u.location.state].filter(Boolean).join(', ')}</p>
                            )}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        )}

        {activeTab === 'discussions' && <Discussions user={user} />}
        {activeTab === 'resources' && <Resources user={user} />}
        {activeTab === 'support-chat' && <SupportChat user={user} />}
      </main>

      {/* Right-side slide-out profile panel */}
      <aside
        className={`fixed top-0 right-0 h-screen w-full sm:w-[340px] max-w-[90vw] bg-white shadow-2xl flex flex-col z-[1000] transition-transform duration-300 ease-in-out ${
          isProfileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-hidden={!isProfileOpen}
        aria-labelledby="profile-panel-title"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 shrink-0">
          <h3 id="profile-panel-title" className="m-0 text-gray-800 font-semibold text-base">
            Your Profile
          </h3>
          <button
            type="button"
            className="bg-transparent border-0 text-2xl leading-none cursor-pointer text-gray-600 p-0 hover:text-gray-900"
            aria-label="Close profile panel"
            onClick={() => setIsProfileOpen(false)}
          >
            ×
          </button>
        </div>

        <div className="px-5 py-4 pb-6 overflow-y-auto flex-1">
          {editProfile && (
            <form
              className="flex flex-col gap-3"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="flex flex-col gap-1.5">
                <label htmlFor="pf-name" className={labelCls}>Name</label>
                <input
                  id="pf-name"
                  type="text"
                  className={inputCls}
                  value={editProfile.name}
                  onChange={(e) => { setEditProfile({ ...editProfile, name: e.target.value }); setIsDirty(true); }}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="pf-alias" className={labelCls}>Alias</label>
                <input
                  id="pf-alias"
                  type="text"
                  className={inputCls}
                  value={editProfile.alias}
                  onChange={(e) => { setEditProfile({ ...editProfile, alias: e.target.value }); setIsDirty(true); }}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="pf-age" className={labelCls}>Age</label>
                <input
                  id="pf-age"
                  type="number"
                  min="18"
                  max="100"
                  className={inputCls}
                  value={editProfile.age}
                  onChange={(e) => { setEditProfile({ ...editProfile, age: Number(e.target.value) }); setIsDirty(true); }}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="pf-role" className={labelCls}>Role</label>
                <select
                  id="pf-role"
                  className={inputCls}
                  value={editProfile.caregiverType}
                  onChange={(e) => { setEditProfile({ ...editProfile, caregiverType: e.target.value }); setIsDirty(true); }}
                >
                  <option value="parent">Parent</option>
                  <option value="guardian">Guardian</option>
                  <option value="grandparent">Grandparent</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="pf-kids" className={labelCls}>Children (count)</label>
                <input
                  id="pf-kids"
                  type="number"
                  min="1"
                  max="20"
                  className={inputCls}
                  value={editProfile.familyInfo.numberOfKids}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    const current = editProfile.familyInfo.kidsAgeGroups || [];
                    let nextGroups = current;
                    if (value > current.length) {
                      nextGroups = [...current, ...Array(value - current.length).fill('0-3')];
                    } else if (value < current.length) {
                      nextGroups = current.slice(0, value);
                    }
                    setEditProfile({
                      ...editProfile,
                      familyInfo: { ...editProfile.familyInfo, numberOfKids: value, kidsAgeGroups: nextGroups }
                    });
                    setIsDirty(true);
                  }}
                />
              </div>

              {Array.from({ length: editProfile.familyInfo.numberOfKids }).map((_, idx) => (
                <div className="flex flex-col gap-1.5" key={`agegroup-${idx}`}>
                  <label htmlFor={`pf-agegroup-${idx}`} className={labelCls}>Child {idx + 1} Age Group</label>
                  <select
                    id={`pf-agegroup-${idx}`}
                    className={inputCls}
                    value={editProfile.familyInfo.kidsAgeGroups[idx] || '0-3'}
                    onChange={(e) => {
                      const cloned = [...editProfile.familyInfo.kidsAgeGroups];
                      cloned[idx] = e.target.value;
                      setEditProfile({ ...editProfile, familyInfo: { ...editProfile.familyInfo, kidsAgeGroups: cloned } });
                      setIsDirty(true);
                    }}
                  >
                    <option value="0-3">0-3</option>
                    <option value="4-6">4-6</option>
                    <option value="7-12">7-12</option>
                    <option value="13-18">13-18</option>
                  </select>
                </div>
              ))}

              <div className="flex flex-col gap-1.5">
                <label htmlFor="pf-about" className={labelCls}>About</label>
                <textarea
                  id="pf-about"
                  rows={3}
                  className={inputCls}
                  value={editProfile.familyInfo.additionalInfo}
                  onChange={(e) => { setEditProfile({ ...editProfile, familyInfo: { ...editProfile.familyInfo, additionalInfo: e.target.value } }); setIsDirty(true); }}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="pf-city" className={labelCls}>City</label>
                <input
                  id="pf-city"
                  type="text"
                  className={inputCls}
                  placeholder="Enter your city"
                  value={editProfile.location.city}
                  onChange={(e) => { setEditProfile({ ...editProfile, location: { ...editProfile.location, city: e.target.value } }); setIsDirty(true); }}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="pf-state" className={labelCls}>State</label>
                <input
                  id="pf-state"
                  type="text"
                  className={inputCls}
                  placeholder="Enter your state"
                  value={editProfile.location.state}
                  onChange={(e) => { setEditProfile({ ...editProfile, location: { ...editProfile.location, state: e.target.value } }); setIsDirty(true); }}
                />
              </div>

              <div className="flex flex-row items-center gap-2">
                <input
                  type="checkbox"
                  id="pf-private"
                  checked={!!editProfile.isPrivate}
                  onChange={(e) => { setEditProfile({ ...editProfile, isPrivate: e.target.checked }); setIsDirty(true); }}
                />
                <label htmlFor="pf-private" className={labelCls}>Private profile</label>
              </div>

              <div className="flex flex-row items-center gap-2">
                <input
                  type="checkbox"
                  id="pf-showlocation"
                  checked={!!editProfile.showLocation}
                  onChange={(e) => { setEditProfile({ ...editProfile, showLocation: e.target.checked }); setIsDirty(true); }}
                />
                <label htmlFor="pf-showlocation" className={labelCls}>Show location to other users</label>
              </div>

              {isDirty && (
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    disabled={saving}
                    className="bg-green-700 hover:bg-green-800 text-white border-0 rounded-md px-3 py-2 text-sm font-semibold cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
                    onClick={async () => {
                      try {
                        setSaving(true);
                        const response = await fetch(`http://localhost:5000/api/auth/users/${user.id}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(editProfile)
                        });
                        const data = await response.json();
                        if (!response.ok || !data.success) {
                          throw new Error(data.message || 'Failed to save');
                        }
                        const updatedUser = { ...user, ...data.user, id: data.user._id || user.id };
                        setUser(updatedUser);
                        localStorage.setItem('user', JSON.stringify(updatedUser));
                        setIsDirty(false);
                      } catch (err) {
                        console.error('Save profile error:', err);
                        alert(err.message || 'Failed to save profile');
                      } finally {
                        setSaving(false);
                      }
                    }}
                  >
                    {saving ? 'Saving…' : 'Save changes'}
                  </button>
                </div>
              )}
            </form>
          )}
        </div>
      </aside>
    </div>
  );
};

export default HomePage;
