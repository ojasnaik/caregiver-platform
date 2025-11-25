import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';
import Discussions from './Discussions';
import Resources from './Resources';

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
    // Check if user is logged in
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

      // Fetch full self profile to hydrate missing fields
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
      // Fetch other users
      fetch(`http://localhost:5000/api/auth/users?currentUserId=${parsed.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setOtherUsers(data.users || []);
          }
        })
        .catch(err => console.error('Fetch users error:', err))
        .finally(() => setLoadingUsers(false));
    } else {
      // Redirect to login if not authenticated
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="home-container">
      <nav className="navbar">
        <div className="nav-content">
          <h1 className="nav-title">Caregiver Platform</h1>
          <div className="nav-actions">
            <span className="welcome-text">Welcome, {user.name}!</span>
            <button
              type="button"
              className="avatar-btn"
              aria-label="Open your profile"
              aria-haspopup="true"
              aria-expanded={isProfileOpen}
            onClick={() => setIsProfileOpen((prev) => !prev)}
            >
              <span className="avatar-circle">
                {(user.alias || user.name || '?')
                  .split(' ')
                  .map((part) => part[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </span>
            </button>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="main-content">
        <div className="tab-navigation">
          <button 
            className={`tab-btn ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => setActiveTab('home')}
          >
            Home
          </button>
          <button 
            className={`tab-btn ${activeTab === 'discussions' ? 'active' : ''}`}
            onClick={() => setActiveTab('discussions')}
          >
            Discussions
          </button>
          <button
            className={`tab-btn ${activeTab === 'resources' ? 'active' : ''}`}
            onClick={() => setActiveTab('resources')}
          >
            Resources
          </button>
        </div>

        {activeTab === 'home' && (
          <div className="welcome-section">
            <h2>Welcome to our platform</h2>
            <p className="welcome-description">
              You're now part of a supportive community of caregivers and single parents.
            </p>
            
            {/* Removed in-page Your Profile card per request; details now live in the right panel */}

            <div className="user-info-card" style={{ marginTop: '20px' }}>
              <h3>Other Active Users:</h3>
              {loadingUsers ? (
                <p>Loading users...</p>
              ) : otherUsers.length === 0 ? (
                <p>No users to show right now.</p>
              ) : (
                <ul className="connect-list">
                  {otherUsers.map((u) => {
                    const isOpen = expandedUserIds.has(u._id);
                    return (
                      <li key={u._id} className="connect-item">
                        <button
                          type="button"
                          className="connect-name"
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
                          <div className="connect-details">
                            <p><strong>Role:</strong> {u.caregiverType.charAt(0).toUpperCase() + u.caregiverType.slice(1)}</p>
                            <p><strong>Children:</strong> {u.familyInfo?.numberOfKids}</p>
                            {Array.isArray(u.familyInfo?.kidsAgeGroups) && u.familyInfo.kidsAgeGroups.length > 0 && (
                              <p><strong>Age Groups:</strong> {u.familyInfo.kidsAgeGroups.join(', ')}</p>
                            )}
                            {u.showLocation && u.location && (u.location.city || u.location.state) && (
                              <p><strong>Location:</strong> {[u.location.city, u.location.state].filter(Boolean).join(', ')}</p>
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

        {activeTab === 'discussions' && (
          <Discussions user={user} />
        )}
        {activeTab === 'resources' && (
          <Resources user={user} />
        )}
      </main>

      {/* Right-side profile panel */}
      <aside
        className={`profile-panel${isProfileOpen ? ' open' : ''}`}
        aria-hidden={!isProfileOpen}
        aria-labelledby="profile-panel-title"
      >
        <div className="profile-panel-header">
          <h3 id="profile-panel-title">Your Profile</h3>
          <button
            type="button"
            className="panel-close-btn"
            aria-label="Close profile panel"
            onClick={() => setIsProfileOpen(false)}
          >
            ×
          </button>
        </div>
        <div className="profile-panel-content">
          {editProfile && (
            <form
              className="panel-form"
              onSubmit={(e) => {
                e.preventDefault();
              }}
            >
              <div className="form-field">
                <label htmlFor="pf-name">Name</label>
                <input
                  id="pf-name"
                  type="text"
                  value={editProfile.name}
                  onChange={(e) => { setEditProfile({ ...editProfile, name: e.target.value }); setIsDirty(true); }}
                />
              </div>

              <div className="form-field">
                <label htmlFor="pf-alias">Alias</label>
                <input
                  id="pf-alias"
                  type="text"
                  value={editProfile.alias}
                  onChange={(e) => { setEditProfile({ ...editProfile, alias: e.target.value }); setIsDirty(true); }}
                />
              </div>

              <div className="form-field">
                <label htmlFor="pf-age">Age</label>
                <input
                  id="pf-age"
                  type="number"
                  min="18"
                  max="100"
                  value={editProfile.age}
                  onChange={(e) => { setEditProfile({ ...editProfile, age: Number(e.target.value) }); setIsDirty(true); }}
                />
              </div>

              <div className="form-field">
                <label htmlFor="pf-role">Role</label>
                <select
                  id="pf-role"
                  value={editProfile.caregiverType}
                  onChange={(e) => { setEditProfile({ ...editProfile, caregiverType: e.target.value }); setIsDirty(true); }}
                >
                  <option value="parent">Parent</option>
                  <option value="guardian">Guardian</option>
                  <option value="grandparent">Grandparent</option>
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="pf-kids">Children (count)</label>
                <input
                  id="pf-kids"
                  type="number"
                  min="1"
                  max="20"
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
                <div className="form-field" key={`agegroup-${idx}`}>
                  <label htmlFor={`pf-agegroup-${idx}`}>Child {idx + 1} Age Group</label>
                  <select
                    id={`pf-agegroup-${idx}`}
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

              <div className="form-field">
                <label htmlFor="pf-about">About</label>
                <textarea
                  id="pf-about"
                  rows={3}
                  value={editProfile.familyInfo.additionalInfo}
                  onChange={(e) => { setEditProfile({ ...editProfile, familyInfo: { ...editProfile.familyInfo, additionalInfo: e.target.value } }); setIsDirty(true); }}
                />
              </div>

              <div className="form-field">
                <label htmlFor="pf-city">City</label>
                <input
                  id="pf-city"
                  type="text"
                  value={editProfile.location.city}
                  onChange={(e) => { setEditProfile({ ...editProfile, location: { ...editProfile.location, city: e.target.value } }); setIsDirty(true); }}
                  placeholder="Enter your city"
                />
              </div>

              <div className="form-field">
                <label htmlFor="pf-state">State</label>
                <input
                  id="pf-state"
                  type="text"
                  value={editProfile.location.state}
                  onChange={(e) => { setEditProfile({ ...editProfile, location: { ...editProfile.location, state: e.target.value } }); setIsDirty(true); }}
                  placeholder="Enter your state"
                />
              </div>

              <div className="form-field checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={!!editProfile.isPrivate}
                    onChange={(e) => { setEditProfile({ ...editProfile, isPrivate: e.target.checked }); setIsDirty(true); }}
                  />
                  Private profile
                </label>
              </div>

              <div className="form-field checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={!!editProfile.showLocation}
                    onChange={(e) => { setEditProfile({ ...editProfile, showLocation: e.target.checked }); setIsDirty(true); }}
                  />
                  Show location to other users
                </label>
              </div>

              {isDirty && (
                <div className="panel-actions">
                  <button
                    type="button"
                    className="save-btn"
                    disabled={saving}
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
