import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Layout, FileText, Star, Clock, Trash2,
  User, Book, Zap, Lightbulb, Code, Palette, Briefcase,
  MoreHorizontal, Share2, Copy, X, Menu, Settings, Bell,
  Edit3, Save, Check, Home, Layers, Hash, Archive, Info, Moon, Sun, Pin, LogOut
} from 'lucide-react';
import profileImg from './assets/foto.jpeg';

// Debug logs for environment
const isProd = import.meta.env.PROD;
console.log('🛠️ isProd =', isProd);
const API_BASE = isProd ? '/api' : 'http://localhost:5000/api';
console.log('🛠️ API_BASE =', API_BASE);
const API_URL = `${API_BASE}/notes`;
const AUTH_URL = `${API_BASE}/auth`;
console.log('🛠️ AUTH_URL =', AUTH_URL);

// Duplicate imports and constants removed

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const formatRelativeTime = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now - date) / 1000);
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 172800) return 'Yesterday';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const getCategoryClass = (cat) => {
  switch (cat?.toLowerCase()) {
    case 'programming': return 'tag-prog';
    case 'design': return 'tag-design';
    case 'personal': return 'tag-personal';
    case 'ideas': return 'tag-ideas';
    default: return 'tag-personal';
  }
};

function App() {
  const getInitialUser = () => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr && userStr !== 'undefined' ? JSON.parse(userStr) : null;
    } catch (e) {
      return null;
    }
  };

  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(getInitialUser());
  const [isLoginView, setIsLoginView] = useState(true);
  const [authForm, setAuthForm] = useState({ username: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newNote, setNewNote] = useState({ title: '', category: 'Programming', content: '' });

  const [currentView, setCurrentView] = useState('home');
  const [activeCategory, setActiveCategory] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  const searchInputRef = useRef(null);

  useEffect(() => {
    if (token) {
      fetchNotes();
    } else {
      setLoading(false);
    }

    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setCurrentView('home');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!isDarkMode) {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
  }, [isDarkMode]);

  const fetchNotes = async () => {
    try {
      const response = await axios.get(API_URL);
      setNotes(response.data);
      if (response.data.length > 0) setSelectedNote(response.data[0]);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching notes:', error);
      setLoading(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.title) return;
    try {
      const response = await axios.post(API_URL, {
        ...newNote,
        icon: 'file-text',
        sections: [{ title: 'Note', items: [newNote.content] }]
      });
      setNotes([response.data, ...notes]);
      setSelectedNote(response.data);
      setIsModalOpen(false);
      setNewNote({ title: '', category: 'Programming', content: '' });
      setCurrentView('notes');
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await axios.delete(`${API_URL}/${id}`);
      const updated = notes.filter(n => n._id !== id);
      setNotes(updated);
      if (selectedNote?._id === id) setSelectedNote(updated[0] || null);
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const startNewNote = (category = "Programming") => {
    setSelectedNote({
      title: "",
      category: category || "Programming",
      sections: [{ title: "Introduction", items: [""] }],
      isFavorite: false,
      createdAt: new Date().toISOString()
    });
    setIsEditing(true);
    setCurrentView('notes');
  };

  const handleSaveNote = async () => {
    try {
      if (selectedNote._id) {
        // Update existing
        const response = await axios.put(`${API_URL}/${selectedNote._id}`, selectedNote);
        setNotes(notes.map(n => n._id === selectedNote._id ? response.data : n));
      } else {
        // Create new
        const response = await axios.post(API_URL, selectedNote);
        setNotes([response.data, ...notes]);
        setSelectedNote(response.data);
      }
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  const updateNoteTitle = (title) => {
    setSelectedNote({ ...selectedNote, title });
  };

  const updateSectionTitle = (idx, title) => {
    const newSections = [...selectedNote.sections];
    newSections[idx].title = title;
    setSelectedNote({ ...selectedNote, sections: newSections });
  };

  const updateItem = (sIdx, iIdx, value) => {
    const newSections = [...selectedNote.sections];
    newSections[sIdx].items[iIdx] = value;
    setSelectedNote({ ...selectedNote, sections: newSections });
  };

  const addItem = (sIdx) => {
    const newSections = [...selectedNote.sections];
    newSections[sIdx].items.push("");
    setSelectedNote({ ...selectedNote, sections: newSections });
  };

  const addSection = () => {
    const newSections = [...(selectedNote.sections || [])];
    newSections.push({ title: "New Section", items: [""] });
    setSelectedNote({ ...selectedNote, sections: newSections });
  };

  const togglePinned = async (note) => {
    try {
      const updatedNote = { ...note, isPinned: !note.isPinned };
      const response = await axios.put(`${API_URL}/${note._id}`, updatedNote);
      setNotes(notes.map(n => n._id === note._id ? response.data : n));
      if (selectedNote?._id === note._id) {
        setSelectedNote(response.data);
      }
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  };

  const toggleFavorite = async (note) => {
    try {
      const updatedNote = { ...note, isFavorite: !note.isFavorite };
      const response = await axios.put(`${API_URL}/${note._id}`, updatedNote);
      setNotes(notes.map(n => n._id === note._id ? response.data : n));
      if (selectedNote?._id === note._id) {
        setSelectedNote(response.data);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const filteredNotes = notes.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory ? n.category === activeCategory : true;
    if (currentView === 'favorites') return matchesSearch && n.isFavorite;
    return matchesSearch && matchesCategory;
  });

  useEffect(() => {
    if (filteredNotes.length > 0) {
      // If current selected note is not in filtered list, pick the first one
      if (!selectedNote || !filteredNotes.find(n => n._id === selectedNote._id)) {
        setSelectedNote(filteredNotes[0]);
      }
    } else {
      setSelectedNote(null);
    }
  }, [activeCategory, currentView, notes.length]);

  const recentNotes = [...notes].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 3);
  const pinnedNotes = notes.filter(n => n.isPinned);

  // Generate simple activity data (last 30 days)
  const activityData = Array.from({ length: 28 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (27 - i));
    const dateStr = date.toISOString().split('T')[0];
    const count = notes.filter(n => n.createdAt?.split('T')[0] === dateStr).length;
    return { count, level: Math.min(count, 4) };
  });

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    try {
      const endpoint = isLoginView ? `${AUTH_URL}/login` : `${AUTH_URL}/register`;
      const response = await axios.post(endpoint, authForm);
      if (isLoginView) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setToken(response.data.token);
        setUser(response.data.user);
      } else {
        setIsLoginView(true);
        setAuthSuccess('Registration successful. Please login.');
      }
    } catch (err) {
      console.error("Auth error details:", err.response || err);
      const serverMsg = err.response?.data?.message;
      const fallbackMsg = err.message || 'Authentication failed';
      setAuthError(serverMsg || `Network/Browser Error: ${fallbackMsg}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setNotes([]);
  };

  if (loading) return null;

  if (!token) {
    return (
      <div className={`app-container ${!isDarkMode ? 'light-mode' : ''}`} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg-app)' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="auth-card"
          style={{ width: '400px', padding: '3rem', background: 'var(--bg-card)', borderRadius: '2rem', border: '1px solid var(--border)', boxShadow: '0 25px 50px rgba(0,0,0,0.5)', textAlign: 'center' }}
        >
          <h1 className="logo-cursive" style={{ fontSize: '3rem', marginBottom: '1rem', color: 'var(--accent)' }}>Yusri Insight</h1>
          <h2 style={{ marginBottom: '2rem', color: 'white', fontWeight: 800 }}>{isLoginView ? 'Welcome Back' : 'Create Account'}</h2>

          {authError && <div style={{ color: '#ef4444', marginBottom: '1.5rem', padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '0.75rem', fontSize: '0.9rem' }}>{authError}</div>}
          {authSuccess && <div style={{ color: '#22c55e', marginBottom: '1.5rem', padding: '0.75rem', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '0.75rem', fontSize: '0.9rem' }}>{authSuccess}</div>}

          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {!isLoginView && (
              <input
                type="text"
                placeholder="Username"
                value={authForm.username}
                onChange={e => setAuthForm({ ...authForm, username: e.target.value })}
                style={{ padding: '1rem', borderRadius: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'white', outline: 'none', fontSize: '1rem' }}
                required
              />
            )}
            <input
              type="email"
              placeholder="Email Address"
              value={authForm.email}
              onChange={e => setAuthForm({ ...authForm, email: e.target.value })}
              style={{ padding: '1rem', borderRadius: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'white', outline: 'none', fontSize: '1rem' }}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={authForm.password}
              onChange={e => setAuthForm({ ...authForm, password: e.target.value })}
              style={{ padding: '1rem', borderRadius: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'white', outline: 'none', fontSize: '1rem' }}
              required
            />
            <button type="submit" style={{ padding: '1rem', borderRadius: '1rem', background: 'var(--accent-gradient)', color: 'white', fontWeight: 800, border: 'none', cursor: 'pointer', marginTop: '1rem', fontSize: '1rem' }}>
              {isLoginView ? 'Login' : 'Sign Up'}
            </button>
          </form>

          <p style={{ marginTop: '2rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {isLoginView ? "Don't have an account? " : "Already have an account? "}
            <span
              onClick={() => { setIsLoginView(!isLoginView); setAuthError(''); setAuthSuccess(''); }}
              style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: 700 }}
            >
              {isLoginView ? 'Sign Up' : 'Login'}
            </span>
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`app-container ${!isDarkMode ? 'light-mode' : ''}`}>
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="logo-cursive">Yusri Insight</div>
        <nav style={{ flex: 1 }}>
          <div className={`nav-item ${currentView === 'home' ? 'active' : ''}`} onClick={() => { setCurrentView('home'); setActiveCategory(null); }}>
            <Home size={20} /> Home
          </div>
          <div className={`nav-item ${currentView === 'notes' && !activeCategory ? 'active' : ''}`} onClick={() => { setCurrentView('notes'); setActiveCategory(null); }}>
            <FileText size={20} /> Notes
          </div>
          <div className={`nav-item ${currentView === 'categories' ? 'active' : ''}`} onClick={() => { setCurrentView('categories'); setActiveCategory(null); }}>
            <Layers size={20} /> Categories
          </div>
          <div className={`nav-item ${currentView === 'tags' ? 'active' : ''}`} onClick={() => { setCurrentView('tags'); setActiveCategory(null); }}>
            <Hash size={20} /> Tags
          </div>
          <div className={`nav-item ${currentView === 'favorites' ? 'active' : ''}`} onClick={() => { setCurrentView('favorites'); setActiveCategory(null); }}>
            <Star size={20} /> Favorites
          </div>
          <div className={`nav-item ${currentView === 'archive' ? 'active' : ''}`} onClick={() => { setCurrentView('archive'); setActiveCategory(null); }}>
            <Archive size={20} /> Archive
          </div>
          <div className={`nav-item ${currentView === 'search' ? 'active' : ''}`} onClick={() => { setCurrentView('search'); setActiveCategory(null); setTimeout(() => searchInputRef.current?.focus(), 100); }}>
            <Search size={20} /> Search
          </div>
          <div className={`nav-item ${currentView === 'about' ? 'active' : ''}`} onClick={() => { setCurrentView('about'); setActiveCategory(null); }}>
            <Info size={20} /> About
          </div>
        </nav>
        <div className="sidebar-footer">
          <div className="user-profile">
            <img src={profileImg} alt="User" className="user-avatar" style={{ objectFit: 'cover' }} />
            <div style={{ flex: 1, marginLeft: '10px' }}>
              <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{user?.username || 'Yusri'}</div>
              <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Stay curious.</div>
            </div>
            <button onClick={handleLogout} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Logout">
              <LogOut size={18} />
            </button>
          </div>
          <div className="theme-toggle" onClick={() => setIsDarkMode(!isDarkMode)}>
            {isDarkMode ? <Moon size={14} color="#94a3b8" style={{ margin: '0 auto' }} /> : <Sun size={14} color="#fbbf24" style={{ margin: '0 auto' }} />}
          </div>
        </div>
      </aside>

      {/* MAIN AREA */}
      <main className="main-content">
        <AnimatePresence mode="wait">
          {currentView === 'home' ? (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="dashboard-view">
              <section className="hero-section">
                <div style={{ position: 'absolute', top: 60, right: 60 }}>
                  <Plus size={48} style={{ cursor: 'pointer', background: 'rgba(255,255,255,0.1)', padding: 12, borderRadius: '1.25rem' }} onClick={startNewNote} />
                </div>
                <h1 className="greeting">Good morning, Yusri 👋</h1>
                <p style={{ color: '#cbd5e1', fontSize: '1.3rem', marginBottom: '1rem' }}>What do you want to learn today?</p>
                <div className="search-bar-container">
                  <Search size={20} color="#94a3b8" />
                  <input ref={searchInputRef} type="text" placeholder="Search your notes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                  <span style={{ color: '#64748b', fontSize: '0.9rem' }}>⌘K</span>
                </div>
              </section>

              <div className="dashboard-body">
                <div style={{ display: 'flex', gap: '2.5rem', marginBottom: '5rem' }}>
                  <div style={{ flex: 1, background: 'var(--bg-card)', padding: '2.5rem', borderRadius: '2.5rem', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                      <h2 style={{ fontSize: '1.4rem', fontWeight: 900 }}>Activity Insights</h2>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Last 4 weeks</div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end', height: '100px' }}>
                      {activityData.map((d, i) => (
                        <div
                          key={i}
                          title={`${d.count} notes`}
                          style={{
                            flex: 1,
                            background: d.count > 0 ? `rgba(139, 92, 246, ${0.2 + (d.level * 0.2)})` : 'rgba(255,255,255,0.03)',
                            height: `${20 + (d.level * 20)}%`,
                            borderRadius: '4px',
                            minWidth: '8px'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <div style={{ width: '350px', background: 'var(--accent-gradient)', padding: '2.5rem', borderRadius: '2.5rem', color: 'white' }}>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '1.5rem' }}>Premium Tip</h2>
                    <p style={{ fontSize: '1rem', opacity: 0.9, lineHeight: '1.6' }}>
                      Use **#tags** in your notes to automatically categorize them for better search results.
                    </p>
                    <div style={{ marginTop: '2rem', background: 'rgba(255,255,255,0.2)', padding: '1rem', borderRadius: '1.25rem', fontSize: '0.9rem', textAlign: 'center', fontWeight: 700 }}>
                      Explore Version 4.0
                    </div>
                  </div>
                </div>

                {pinnedNotes.length > 0 && (
                  <>
                    <h2 className="section-label">📌 Pinned Notes</h2>
                    <div className="quick-access-grid" style={{ marginBottom: '4rem' }}>
                      {pinnedNotes.map(note => (
                        <div key={note._id} className="qa-card" onClick={() => { setSelectedNote(note); setCurrentView('notes'); }}>
                          <div className="qa-icon-box" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#a78bfa' }}><Pin size={28} /></div>
                          <div className="qa-title">{note.title}</div>
                          <div className="qa-count">{note.category}</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <h2 className="section-label">Quick Access</h2>
                <div className="quick-access-grid">
                  {[
                    { id: 'Programming', icon: <Code size={28} />, color: '#a78bfa', bg: 'rgba(139, 92, 246, 0.25)' },
                    { id: 'Design', icon: <Palette size={28} />, color: '#f472b6', bg: 'rgba(236, 72, 153, 0.25)' },
                    { id: 'Personal', icon: <User size={28} />, color: '#60a5fa', bg: 'rgba(59, 130, 246, 0.25)' },
                    { id: 'Ideas', icon: <Lightbulb size={28} />, color: '#2dd4bf', bg: 'rgba(20, 184, 166, 0.25)' }
                  ].map(cat => (
                    <div key={cat.id} className="qa-card" onClick={() => { setCurrentView('notes'); setActiveCategory(cat.id); }}>
                      <div className="qa-icon-box" style={{ background: cat.bg, color: cat.color }}>{cat.icon}</div>
                      <div className="qa-title">{cat.id}</div>
                      <div className="qa-count">{notes.filter(n => n.category === cat.id).length} notes</div>
                    </div>
                  ))}
                </div>

                <h2 className="section-label">Recent Notes</h2>
                <div className="recent-notes-list">
                  {recentNotes.map(note => (
                    <div key={note._id} className="recent-note-item" onClick={() => { setSelectedNote(note); setCurrentView('notes'); }}>
                      <div className="note-icon-glow">
                        <FileText size={20} color="#8b5cf6" />
                      </div>
                      <div className="note-title-text">{note.title}</div>
                      <div className="note-meta-wrap">
                        <div className={`note-category-tag ${getCategoryClass(note.category)}`}>{note.category}</div>
                        <div className="note-time-text">
                          {formatRelativeTime(note.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : currentView === 'categories' ? (
            <motion.div key="categories" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="dashboard-body" style={{ paddingTop: '8rem' }}>
              <h1 className="greeting" style={{ marginBottom: '4rem' }}>Categories</h1>
              <div className="quick-access-grid">
                {[
                  { id: 'Programming', icon: <Code size={32} />, color: '#a78bfa', bg: 'rgba(139, 92, 246, 0.25)' },
                  { id: 'Design', icon: <Palette size={32} />, color: '#f472b6', bg: 'rgba(236, 72, 153, 0.25)' },
                  { id: 'Personal', icon: <User size={32} />, color: '#60a5fa', bg: 'rgba(59, 130, 246, 0.25)' },
                  { id: 'Ideas', icon: <Lightbulb size={32} />, color: '#2dd4bf', bg: 'rgba(20, 184, 166, 0.25)' },
                  { id: 'Work', icon: <Briefcase size={32} />, color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.15)' },
                  { id: 'Learning', icon: <Book size={32} />, color: '#34d399', bg: 'rgba(52, 211, 153, 0.15)' }
                ].map(cat => (
                  <div key={cat.id} className="qa-card" style={{ minHeight: '200px' }} onClick={() => { setCurrentView('notes'); setActiveCategory(cat.id); }}>
                    <div className="qa-icon-box" style={{ background: cat.bg, color: cat.color, width: 80, height: 80 }}>{cat.icon}</div>
                    <div className="qa-title" style={{ fontSize: '1.5rem' }}>{cat.id}</div>
                    <div className="qa-count">{notes.filter(n => n.category === cat.id).length} notes</div>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : currentView === 'search' ? (
            <motion.div key="search" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="dashboard-body" style={{ paddingTop: '8rem' }}>
              <div className="search-bar-container" style={{ maxWidth: '1000px', margin: '0 auto 5rem', padding: '1.5rem 2.5rem', borderRadius: '2.5rem', background: 'rgba(255,255,255,0.03)' }}>
                <Search size={32} color="#8b5cf6" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Type to search anything..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ fontSize: '1.8rem', fontWeight: 700 }}
                />
              </div>

              <div className="quick-access-grid">
                {filteredNotes.map(note => (
                  <div key={note._id} className="qa-card" onClick={() => { setSelectedNote(note); setCurrentView('notes'); }}>
                    <div className="qa-icon-box" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#a78bfa' }}><FileText size={28} /></div>
                    <div className="qa-title">{note.title}</div>
                    <div className="qa-count">{note.category}</div>
                  </div>
                ))}
              </div>

              {filteredNotes.length === 0 && searchQuery && (
                <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#64748b' }}>
                  No matches found for "{searchQuery}"
                </div>
              )}
            </motion.div>
          ) : currentView === 'tags' ? (
            <motion.div key="tags" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="dashboard-body" style={{ paddingTop: '8rem' }}>
              <h1 className="greeting" style={{ marginBottom: '4rem' }}>Tags</h1>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                {['#react', '#javascript', '#node', '#express', '#ux', '#minimalist', '#productivity', '#coding', '#design-system', '#glassmorphism'].map(tag => (
                  <div key={tag} className="tag-pill" style={{ padding: '1rem 2rem', fontSize: '1.2rem', background: 'rgba(255,255,255,0.05)' }}>{tag}</div>
                ))}
              </div>
            </motion.div>
          ) : currentView === 'archive' ? (
            <motion.div key="archive" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="dashboard-body" style={{ paddingTop: '8rem', textAlign: 'center' }}>
              <Archive size={80} color="#94a3b8" style={{ marginBottom: '2rem' }} />
              <h1 className="greeting">Archive Empty</h1>
              <p style={{ color: '#94a3b8' }}>You haven't archived any notes yet.</p>
            </motion.div>
          ) : currentView === 'about' ? (
            <motion.div key="about" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="dashboard-body" style={{ paddingTop: '8rem', display: 'flex', gap: '5rem', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <h1 className="greeting" style={{ marginBottom: '3rem' }}>Yusri Insight Premium</h1>
                <p style={{ fontSize: '1.4rem', color: 'var(--text-secondary)', lineHeight: '1.8', maxWidth: '700px', fontWeight: 500 }}>
                  Yusri Insight Premium is a modern note-taking platform designed to empower creators, developers, and learners to build their knowledge in an organized way.
                  <br /><br />
                  By prioritizing simplicity and performance, this platform delivers a seamless writing experience and a robust management system—from personal notes to professional knowledge bases.
                  <br /><br />
                  More than just a note-taking app, this is a space to think, learn, and grow.
                  <br /><br />
                  <span style={{ color: 'var(--accent)', fontWeight: 800 }}>Version 4.0 "Yusri Insights"</span>
                </p>
              </div>

              {/* HANGING ID CARD ANIMATION */}
              <div style={{ position: 'relative', width: '300px', height: '600px', display: 'flex', justifyContent: 'center' }}>
                {/* The Lanyard / Rope */}
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 250 }}
                  transition={{ delay: 0.5, duration: 1 }}
                  style={{ width: '4px', background: 'var(--accent-gradient)', position: 'absolute', top: -100, borderRadius: '2px' }}
                />

                <motion.div
                  initial={{ y: -800, rotate: -30 }}
                  animate={{ y: 150, rotate: [5, -5, 5] }}
                  transition={{
                    y: { type: 'spring', damping: 15, stiffness: 80, delay: 0.2 },
                    rotate: { repeat: Infinity, duration: 4, ease: "easeInOut" }
                  }}
                  style={{
                    width: '260px',
                    height: '420px',
                    background: 'var(--bg-card)',
                    backdropFilter: 'blur(30px)',
                    border: '1px solid var(--border)',
                    borderRadius: '1.5rem',
                    padding: '2rem',
                    boxShadow: '0 50px 100px rgba(0,0,0,0.5)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    zIndex: 20
                  }}
                >
                  <div style={{ width: '40px', height: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '5px', marginBottom: '1.5rem' }}></div>
                  <img src={profileImg} style={{ width: '130px', height: '130px', borderRadius: '1rem', border: '3px solid var(--accent)', marginBottom: '1.5rem', objectFit: 'cover' }} alt="Profile" />
                  <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '0.25rem', textAlign: 'center' }}>Yusri</h2>
                  <div style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Computer Engineering</div>
                  <div style={{ color: '#fbbf24', fontWeight: 800, fontSize: '0.7rem', marginBottom: '1.5rem' }}>UNIVERSITAS INDONESIA</div>

                  <div style={{ width: '100%', height: '1px', background: 'var(--border)', marginBottom: '1.5rem' }}></div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>ID Number</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>2024-YIP-001</div>
                    </div>
                    <div style={{ width: '50px', height: '50px', background: 'white', borderRadius: '8px', padding: '4px' }}>
                      <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=YusriInsightPremium" style={{ width: '100%', height: '100%' }} alt="QR" />
                    </div>
                  </div>

                  <div style={{ marginTop: 'auto', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>YUSRI INSIGHT MEMBER</div>
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="notes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="notes-view-container">
              <div className="note-list-col">
                <div style={{ padding: '3rem 2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                    <h2 style={{ fontSize: '2rem', fontWeight: 900 }}>
                      {activeCategory || (currentView === 'favorites' ? 'Favorites' : 'All Notes')}
                    </h2>
                    {activeCategory && (
                      <button
                        onClick={() => setActiveCategory(null)}
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: '#94a3b8', padding: '0.4rem 0.8rem', borderRadius: '0.75rem', fontSize: '0.8rem', cursor: 'pointer' }}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  {filteredNotes.map(note => (
                    <div key={note._id} className={`note-preview-card ${selectedNote?._id === note._id ? 'active' : ''}`} onClick={() => setSelectedNote(note)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {note.isPinned && <Pin size={14} color="var(--accent)" fill="var(--accent)" />}
                          <h3 style={{ fontWeight: 800 }}>{note.title}</h3>
                        </div>
                        {note.isFavorite && <Star size={14} fill="#fbbf24" color="#fbbf24" />}
                      </div>
                      <div className={`note-category-tag ${getCategoryClass(note.category)}`} style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem', marginBottom: '0.75rem', display: 'inline-block' }}>
                        {note.category}
                      </div>
                      <p style={{ fontSize: '0.85rem', color: '#94a3b8', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {note.quote || note.sections?.[0]?.items?.[0] || "No content summary..."}
                      </p>
                    </div>
                  ))}
                  {filteredNotes.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '6rem 2rem' }}>
                      <div style={{ background: 'rgba(255,255,255,0.03)', width: 80, height: 80, borderRadius: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 2rem' }}>
                        <FileText size={40} color="#64748b" />
                      </div>
                      <h3 style={{ color: 'white', marginBottom: '1rem', fontSize: '1.5rem', fontWeight: 800 }}>No {activeCategory} notes</h3>
                      <p style={{ color: '#94a3b8', marginBottom: '2.5rem' }}>Start your journey by creating your first note in this category.</p>
                      <button
                        className="add-section-btn"
                        onClick={() => startNewNote(activeCategory)}
                        style={{ maxWidth: '250px', margin: '0 auto' }}
                      >
                        <Plus size={20} /> Create First Note
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {selectedNote ? (
                <div className="note-detail-col">
                  <div className="note-detail-container">
                    <div className="detail-banner">
                      <img src={selectedNote.imageUrl || "https://images.unsplash.com/photo-1542332213-9b5a5a3fad35?auto=format&fit=crop&q=80&w=2000"} alt="Banner" />
                    </div>

                    <div className="detail-body">
                      <div className="detail-header-card" style={{ border: '1px solid rgba(139, 92, 246, 0.3)', boxShadow: '0 25px 60px rgba(0,0,0,0.4)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                          <div style={{ display: 'flex', gap: '0.75rem' }}>
                            {isEditing ? (
                              <select
                                className="tag-pill"
                                value={selectedNote.category}
                                onChange={(e) => setSelectedNote({ ...selectedNote, category: e.target.value })}
                                style={{ background: 'rgba(139, 92, 246, 0.2)', border: '1px solid rgba(139, 92, 246, 0.4)', color: '#c084fc', outline: 'none', cursor: 'pointer' }}
                              >
                                {['Programming', 'Design', 'Personal', 'Ideas', 'Work', 'Learning'].map(c => (
                                  <option key={c} value={c}>{c}</option>
                                ))}
                              </select>
                            ) : (
                              <div className="tag-pill" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa' }}>{selectedNote.category}</div>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: '0.75rem' }}>
                            {isEditing ? (
                              <button className="action-btn" onClick={handleSaveNote} style={{ background: 'var(--accent-gradient)', color: 'white' }}><Check size={20} /></button>
                            ) : (
                              <button className="action-btn" onClick={() => setIsEditing(true)}><Edit3 size={20} /></button>
                            )}
                            <button className="action-btn" onClick={() => togglePinned(selectedNote)}>
                              <Pin size={20} fill={selectedNote.isPinned ? "var(--accent)" : "none"} color={selectedNote.isPinned ? "var(--accent)" : "white"} />
                            </button>
                            <button className="action-btn" onClick={() => toggleFavorite(selectedNote)}>
                              <Star size={20} fill={selectedNote.isFavorite ? "#fbbf24" : "none"} color={selectedNote.isFavorite ? "#fbbf24" : "white"} />
                            </button>
                            <button className="action-btn" onClick={() => setSelectedNote(null)} style={{ background: 'rgba(255,255,255,0.05)' }}><X size={20} /></button>
                          </div>
                        </div>

                        {isEditing ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <input
                              className="detail-title"
                              value={selectedNote.title}
                              onChange={(e) => updateNoteTitle(e.target.value)}
                              style={{ background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', outline: 'none', color: 'white', width: '100%', fontSize: '3.5rem', fontWeight: 900, paddingBottom: '1rem' }}
                              placeholder="Note Title..."
                            />
                          </div>
                        ) : (
                          <h1 className="detail-title" style={{ fontSize: '3.5rem', lineHeight: 1.1 }}>{selectedNote.title}</h1>
                        )}
                      </div>

                      {selectedNote.sections?.map((section, sIdx) => (
                        <div key={sIdx} className="content-section">
                          <div className="section-head">
                            <div className="section-num">{sIdx + 1}</div>
                            {isEditing ? (
                              <input
                                className="section-title"
                                value={section.title}
                                onChange={(e) => updateSectionTitle(sIdx, e.target.value)}
                                style={{ background: 'transparent', border: 'none', outline: 'none', color: 'white', fontSize: '2rem', fontWeight: 800 }}
                              />
                            ) : (
                              <h2 className="section-title">{section.title}</h2>
                            )}
                          </div>
                          <div className="content-grid">
                            {section.items.map((item, iIdx) => (
                              <div key={iIdx} className="item-card">
                                <div className="item-bullet"></div>
                                {isEditing ? (
                                  <input
                                    value={item}
                                    onChange={(e) => updateItem(sIdx, iIdx, e.target.value)}
                                    style={{ background: 'transparent', border: 'none', outline: 'none', color: 'white', flex: 1, fontSize: '1.1rem' }}
                                  />
                                ) : (
                                  <span style={{ color: '#cbd5e1' }}>{item}</span>
                                )}
                              </div>
                            ))}
                            {isEditing && (
                              <button
                                className="item-card"
                                style={{ borderStyle: 'dashed', justifyContent: 'center', color: '#94a3b8' }}
                                onClick={() => addItem(sIdx)}
                              >
                                <Plus size={16} /> Add Item
                              </button>
                            )}
                          </div>
                        </div>
                      ))}

                      {isEditing && (
                        <button
                          className="add-section-btn"
                          onClick={addSection}
                        >
                          <Plus size={20} /> Add New Section
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="note-detail-col" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#64748b', background: 'rgba(0,0,0,0.2)' }}>
                  {filteredNotes.length > 0 ? "Select a note to view details" : ""}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)}>
            <motion.div className="modal-content" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={(e) => e.stopPropagation()}>
              <h2 style={{ marginBottom: '2.5rem', fontSize: '2rem', fontWeight: 900 }}>Create New Note</h2>
              <form onSubmit={handleAddNote}>
                <div className="form-group"><label>Title</label><input type="text" value={newNote.title} onChange={e => setNewNote({ ...newNote, title: e.target.value })} placeholder="Give it a title..." /></div>
                <div className="form-group">
                  <label>Category</label>
                  <select value={newNote.category} onChange={e => setNewNote({ ...newNote, category: e.target.value })}>
                    <option value="Programming">Programming</option>
                    <option value="Design">Design</option>
                    <option value="Personal">Personal</option>
                    <option value="Ideas">Ideas</option>
                  </select>
                </div>
                <div className="form-group"><label>Content</label><textarea value={newNote.content} onChange={e => setNewNote({ ...newNote, content: e.target.value })} placeholder="What's on your mind?" /></div>
                <button type="submit" className="btn-primary">Create Note</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
