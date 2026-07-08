import React, { useState, useEffect } from 'react';
import { fetchHomepageConfig, saveHomepageConfig, uploadImage, fetchOrders, fetchStudents } from './api/configApi';

// Reusable Section Component
const FormSection: React.FC<{
  title: string;
  icon: string;
  children: React.ReactNode;
  isOpenDefault?: boolean;
}> = ({ title, icon, children, isOpenDefault = true }) => {
  const [isOpen, setIsOpen] = useState(isOpenDefault);
  return (
    <div className="card">
      <div className="card-header" style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => setIsOpen(!isOpen)}>
        <span className="card-icon">{icon}</span>
        <h2 style={{ flex: 1 }}>{title}</h2>
        <span style={{ fontSize: '12px', color: '#94A3B8' }}>{isOpen ? '▲ Collapse' : '▼ Expand'}</span>
      </div>
      {isOpen && <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '10px' }}>{children}</div>}
    </div>
  );
};

// Reusable Image Field Component
const ImageField: React.FC<{
  label: string;
  value: string;
  onChange: (url: string) => void;
}> = ({ label, value, onChange }) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const url = await uploadImage(base64);
        onChange(url);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // Convert relative url from backend, e.g. '/uploads/image.png', to a preview-friendly URL
  const getPreviewUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const API_BASE = window.location.port === '5173' || window.location.port === '5174' ? 'http://localhost:3001' : '';
    return `${API_BASE}${url}`;
  };

  const previewSrc = getPreviewUrl(value);

  return (
    <div className="image-field-container">
      <label>{label}</label>
      <div className="image-field-row">
        {previewSrc ? (
          <img src={previewSrc} alt="Preview" className="image-preview" onError={(e) => {
            (e.target as HTMLImageElement).src = ''; // Clear if invalid URL
          }} />
        ) : (
          <div className="image-preview">🖼️</div>
        )}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input 
            type="text" 
            placeholder="Image URL (or upload file below)" 
            value={value || ''} 
            onChange={(e) => onChange(e.target.value)} 
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label className="image-upload-btn-label">
              {isUploading ? 'Uploading...' : 'Upload File'}
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange} 
                style={{ display: 'none' }} 
                disabled={isUploading}
              />
            </label>
            {value && (
              <button 
                type="button" 
                onClick={() => onChange('')} 
                style={{ background: 'transparent', border: 'none', color: '#EF4444', fontSize: '11px', cursor: 'pointer', fontWeight: 650 }}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [selectedClass, setSelectedClass] = useState('Class 6');
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'config' | 'orders' | 'students'>('config');
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid'>('all');
  const [ordersClassFilter, setOrdersClassFilter] = useState('all');

  // Students list states
  const [students, setStudents] = useState<any[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsSearchQuery, setStudentsSearchQuery] = useState('');
  const [studentsClassFilter, setStudentsClassFilter] = useState('all');
  const [studentsEnrollFilter, setStudentsEnrollFilter] = useState('all');

  const loadOrders = async () => {
    setOrdersLoading(true);
    try {
      const data = await fetchOrders();
      setOrders(data || []);
    } catch (err: any) {
      console.error(err);
      showToast('Failed to load orders.');
    } finally {
      setOrdersLoading(false);
    }
  };

  const loadStudents = async () => {
    setStudentsLoading(true);
    try {
      const data = await fetchStudents();
      setStudents(data || []);
    } catch (err: any) {
      console.error(err);
      showToast('Failed to load students list.');
    } finally {
      setStudentsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'orders') {
      loadOrders();
    } else if (activeTab === 'students') {
      loadStudents();
    }
  }, [activeTab]);

  // Fetch configs upon selection
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await fetchHomepageConfig(selectedClass);
        setConfig(data);
      } catch (err: any) {
        console.error(err);
        showToast('Error loading configuration.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedClass]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    setSaving(true);
    try {
      await saveHomepageConfig(selectedClass, config);
      showToast('Configuration saved successfully! ✨');
    } catch (err: any) {
      alert('Save failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Helper getters/setters to keep nesting updates simple
  const setRootField = (field: string, value: any) => {
    setConfig((prev: any) => ({ ...prev, [field]: value }));
  };

  const setNestedField = (parent: string, field: string, value: any) => {
    setConfig((prev: any) => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
  };

  const setBulletField = (parent: string, index: number, value: any) => {
    setConfig((prev: any) => {
      const arr = [...(prev[parent]?.bullets || [])];
      arr[index] = value;
      return {
        ...prev,
        [parent]: {
          ...prev[parent],
          bullets: arr
        }
      };
    });
  };

  const setOutlineField = (index: number, value: any) => {
    setConfig((prev: any) => {
      const arr = [...(prev.masterProgram?.outline || [])];
      arr[index] = value;
      return {
        ...prev,
        masterProgram: {
          ...prev.masterProgram,
          outline: arr
        }
      };
    });
  };

  const setTestimonialTagField = (index: number, value: any) => {
    setConfig((prev: any) => {
      const arr = [...(prev.masterProgram?.testimonialTags || [])];
      arr[index] = value;
      return {
        ...prev,
        masterProgram: {
          ...prev.masterProgram,
          testimonialTags: arr
        }
      };
    });
  };

  const setTeacherField = (index: number, key: string, value: any) => {
    setConfig((prev: any) => {
      const arr = [...(prev.teachers || [])];
      arr[index] = { ...arr[index], [key]: value };
      return { ...prev, teachers: arr };
    });
  };

  const renderOrdersTracker = () => {
    const filteredOrders = orders.filter((o: any) => {
      const matchesSearch = 
        (o.studentPhone && o.studentPhone.includes(searchQuery)) ||
        (o.courseTitle && o.courseTitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (o.classInfo && o.classInfo.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
      const matchesClass = ordersClassFilter === 'all' || (o.classInfo && o.classInfo.toLowerCase().includes(ordersClassFilter.toLowerCase()));
      return matchesSearch && matchesStatus && matchesClass;
    });

    const totalPaid = orders.filter((o: any) => o.status === 'paid').length;
    const totalPending = orders.filter((o: any) => o.status === 'pending').length;
    const totalAmountPaid = orders
      .filter((o: any) => o.status === 'paid')
      .reduce((sum: number, o: any) => sum + (Number(o.amount) || 0), 0);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <header>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'white' }}>Live Orders &amp; Enrollments Tracker</h1>
            <p style={{ margin: '4px 0 0', color: '#94A3B8', fontSize: '13px' }}>
              Track real-time student registrations, demo classes, and master program payments.
            </p>
          </div>
          <button 
            type="button" 
            onClick={loadOrders} 
            className="save-btn" 
            style={{ padding: '8px 16px', fontSize: '12px' }}
            disabled={ordersLoading}
          >
            {ordersLoading ? 'Refreshing...' : '🔄 Refresh Data'}
          </button>
        </header>

        {/* Stats Metrics Dashboard Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-title">Total Registered</div>
            <div className="stat-value">{orders.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-title">Paid Enrollments</div>
            <div className="stat-value success">{totalPaid}</div>
          </div>
          <div className="stat-card">
            <div className="stat-title">Pending Payments</div>
            <div className="stat-value pending">{totalPending}</div>
          </div>
          <div className="stat-card">
            <div className="stat-title">Total Revenue</div>
            <div className="stat-value" style={{ color: '#00B6A6' }}>
              ₹ {totalAmountPaid.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Search & Status Filters */}
        <div className="search-container">
          <div className="search-input-wrap">
            <span className="search-icon-placeholder">🔍</span>
            <input 
              type="text" 
              placeholder="Search by phone, course, or class..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>
          <select 
            value={ordersClassFilter} 
            onChange={(e) => setOrdersClassFilter(e.target.value)}
            style={{ width: '180px', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)' }}
          >
            <option value="all">All Grades</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
              <option key={n} value={`Class ${n}`}>Grade Class {n}</option>
            ))}
          </select>
          <select 
            value={statusFilter} 
            onChange={(e: any) => setStatusFilter(e.target.value)}
            style={{ width: '180px', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)' }}
          >
            <option value="all">All Statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        {/* Orders Table */}
        {ordersLoading ? (
          <div style={{ padding: '60px', textAlign: 'center', background: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }}></div>
            <p style={{ color: '#94A3B8' }}>Loading student registrations...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', background: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)', color: '#94A3B8' }}>
            📭 No orders found matching the filter criteria.
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Student Phone</th>
                  <th>Course Title</th>
                  <th>Class Info</th>
                  <th>Amount</th>
                  <th>Created At</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((o: any) => (
                  <tr key={o._id}>
                    <td style={{ color: '#94A3B8', fontFamily: 'monospace', fontSize: '12px' }}>
                      {String(o._id).substring(Math.max(0, String(o._id).length - 6))}
                    </td>
                    <td style={{ fontWeight: 600 }}>{o.studentPhone}</td>
                    <td>{o.courseTitle}</td>
                    <td>{o.classInfo}</td>
                    <td style={{ fontWeight: 700 }}>₹ {o.amount}</td>
                    <td style={{ fontSize: '12px', color: '#94A3B8' }}>
                      {o.createdAt ? new Date(o.createdAt).toLocaleString() : 'N/A'}
                    </td>
                    <td>
                      <span className={`badge ${o.status === 'paid' ? 'paid' : 'pending'}`}>
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderStudentsTracker = () => {
    const filteredStudents = students.filter((s: any) => {
      const matchesSearch = 
        (s.name && s.name.toLowerCase().includes(studentsSearchQuery.toLowerCase())) ||
        (s.phone && s.phone.includes(studentsSearchQuery));
      const matchesClass = studentsClassFilter === 'all' || s.selectedClass === studentsClassFilter;
      
      const enrollType = s.enrollmentType || 'none';
      const matchesEnroll = studentsEnrollFilter === 'all' || enrollType === studentsEnrollFilter;
      
      return matchesSearch && matchesClass && matchesEnroll;
    });

    const totalStudents = students.length;
    const totalMaster = students.filter((s: any) => s.enrollmentType === 'master').length;
    const totalDemo = students.filter((s: any) => s.enrollmentType === 'demo').length;
    const totalGuest = students.filter((s: any) => !s.enrollmentType || s.enrollmentType === 'none').length;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <header>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'white' }}>Enrolled Students &amp; Registrations</h1>
            <p style={{ margin: '4px 0 0', color: '#94A3B8', fontSize: '13px' }}>
              Manage registered student profiles, view demographics, and track dynamic course enrollment states.
            </p>
          </div>
          <button 
            type="button" 
            onClick={loadStudents} 
            className="save-btn" 
            style={{ padding: '8px 16px', fontSize: '12px' }}
            disabled={studentsLoading}
          >
            {studentsLoading ? 'Refreshing...' : '🔄 Refresh Data'}
          </button>
        </header>

        {/* Stats Metrics Dashboard Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-title">Total Registered</div>
            <div className="stat-value">{totalStudents}</div>
          </div>
          <div className="stat-card">
            <div className="stat-title">Master Program</div>
            <div className="stat-value success">{totalMaster}</div>
          </div>
          <div className="stat-card">
            <div className="stat-title">6-Day Demo</div>
            <div className="stat-value" style={{ color: '#38BDF8' }}>{totalDemo}</div>
          </div>
          <div className="stat-card">
            <div className="stat-title">Not Enrolled / Guest</div>
            <div className="stat-value pending">{totalGuest}</div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="search-container">
          <div className="search-input-wrap">
            <span className="search-icon-placeholder">🔍</span>
            <input 
              type="text" 
              placeholder="Search by name or phone..."
              value={studentsSearchQuery}
              onChange={(e) => setStudentsSearchQuery(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>
          <select 
            value={studentsClassFilter} 
            onChange={(e) => setStudentsClassFilter(e.target.value)}
            style={{ width: '180px', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)' }}
          >
            <option value="all">All Grades</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
              <option key={n} value={`Class ${n}`}>Grade Class {n}</option>
            ))}
          </select>
          <select 
            value={studentsEnrollFilter} 
            onChange={(e: any) => setStudentsEnrollFilter(e.target.value)}
            style={{ width: '180px', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)' }}
          >
            <option value="all">All Enrollment Types</option>
            <option value="master">Master Program</option>
            <option value="demo">6-Day Demo</option>
            <option value="none">Not Enrolled</option>
          </select>
        </div>

        {/* Students Table */}
        {studentsLoading ? (
          <div style={{ padding: '60px', textAlign: 'center', background: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }}></div>
            <p style={{ color: '#94A3B8' }}>Loading registered student list...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', background: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)', color: '#94A3B8' }}>
            📭 No students found matching the filter criteria.
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Avatar</th>
                  <th>Student Name</th>
                  <th>Phone Number</th>
                  <th>Selected Grade</th>
                  <th>Alt Phone</th>
                  <th>State &amp; Address</th>
                  <th>Last Updated</th>
                  <th>Enrollment Type</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s: any) => {
                  const enroll = s.enrollmentType || 'none';
                  return (
                    <tr key={s._id}>
                      <td>
                        <img 
                          src={s.profilePhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60&auto=format&fit=crop&q=80'} 
                          alt="avatar"
                          style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }}
                        />
                      </td>
                      <td style={{ fontWeight: 600 }}>{s.name || 'Anonymous Student'}</td>
                      <td>{s.phone}</td>
                      <td>
                        <span style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '6px', fontSize: '12px' }}>
                          {s.selectedClass || 'N/A'}
                        </span>
                      </td>
                      <td>{s.altPhone || '—'}</td>
                      <td style={{ fontSize: '12.5px', color: '#94A3B8', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={s.address}>
                        {s.state ? `${s.state}${s.address ? `, ${s.address}` : ''}` : '—'}
                      </td>
                      <td style={{ fontSize: '12px', color: '#94A3B8' }}>
                        {s.updatedAt ? new Date(s.updatedAt).toLocaleString() : 'N/A'}
                      </td>
                      <td>
                        {enroll === 'master' ? (
                          <span className="badge paid" style={{ color: '#00B6A6', borderColor: 'rgba(0,182,166,0.3)', background: 'rgba(0,182,166,0.15)' }}>
                            Master Program
                          </span>
                        ) : enroll === 'demo' ? (
                          <span className="badge pending" style={{ color: '#38BDF8', borderColor: 'rgba(56,189,248,0.3)', background: 'rgba(56,189,248,0.15)' }}>
                            6-Day Demo
                          </span>
                        ) : (
                          <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.1)' }}>
                            Not Enrolled
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  if (loading && activeTab === 'config') {
    return (
      <div style={{ display: 'flex', flex: 1, height: '100vh', justifyContent: 'center', alignItems: 'center', background: '#0F172A', color: 'white' }}>
        <div className="spinner"></div>
        <p style={{ marginLeft: '12px', fontSize: '14px', fontWeight: 500 }}>Fetching grade configuration...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Sidebar Panel */}
      <div className="sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <span style={{ background: '#00B6A6', color: 'white', fontWeight: 700, padding: '3px 8px', borderRadius: '5px', fontSize: '13px' }}>ODA</span>
          <span style={{ fontSize: '14px', fontWeight: 600 }}>Class Manager</span>
        </div>

        {/* Sidebar Tabs Navigation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px', width: '100%' }}>
          <button 
            type="button" 
            className={`nav-item ${activeTab === 'config' ? 'active' : ''}`}
            onClick={() => setActiveTab('config')}
          >
            🏠 Grade Manager
          </button>
          <button 
            type="button" 
            className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            📋 Live Orders &amp; Tracker
          </button>
          <button 
            type="button" 
            className={`nav-item ${activeTab === 'students' ? 'active' : ''}`}
            onClick={() => setActiveTab('students')}
          >
            👥 Enrolled Students
          </button>
        </div>

        {activeTab === 'config' && (
          <>
            <label style={{ fontSize: '10px', color: '#94A3B8' }}>Current Grade</label>
            <select 
              className="class-select-dropdown" 
              value={selectedClass} 
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              {[1,2,3,4,5,6,7,8,9,10,11].map(n => (
                <option key={n} value={`Class ${n}`}>Grade Class {n}</option>
              ))}
            </select>
          </>
        )}
        <div style={{ flex: 1 }} />
        <div style={{ color: '#94A3B8', fontSize: '11px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
          Oda Admin v2.0 (React)
        </div>
      </div>

      {/* Main Form content */}
      <div className="main-content">
        {activeTab === 'orders' ? (
          renderOrdersTracker()
        ) : activeTab === 'students' ? (
          renderStudentsTracker()
        ) : (
          <>
            <header>
              <h1>Configure Details — {selectedClass}</h1>
              <button type="button" className="save-btn" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : '💾 Save Changes'}
              </button>
            </header>

            {config && (
              <form className="editor-wrap" onSubmit={handleSave}>
            
            {/* ========================================== SECTION 1: HOME PAGE GENERAL ========================================== */}
            <FormSection title="1. Dashboard Banner & General Details" icon="🏠">
              <span className="section-label">Banner Alert</span>
              <div className="form-grid">
                <div className="form-group span-2">
                  <label>Marketing Subtitle Banner Text</label>
                  <input 
                    type="text" 
                    value={config.bannerText || ''} 
                    onChange={(e) => setRootField('bannerText', e.target.value)} 
                  />
                </div>
              </div>

              <span className="section-label">Upcoming Class Details</span>
              <div className="form-grid">
                <div className="form-group span-2">
                  <label>Upcoming Lecture Title</label>
                  <input 
                    type="text" 
                    value={config.upcomingClass?.title || ''} 
                    onChange={(e) => setNestedField('upcomingClass', 'title', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Subject</label>
                  <input 
                    type="text" 
                    value={config.upcomingClass?.subject || ''} 
                    onChange={(e) => setNestedField('upcomingClass', 'subject', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Time / Day Label</label>
                  <input 
                    type="text" 
                    value={config.upcomingClass?.time || ''} 
                    onChange={(e) => setNestedField('upcomingClass', 'time', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Teacher Name</label>
                  <input 
                    type="text" 
                    value={config.upcomingClass?.teacherName || ''} 
                    onChange={(e) => setNestedField('upcomingClass', 'teacherName', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <ImageField 
                    label="Teacher Photo avatar" 
                    value={config.upcomingClass?.teacherAvatar || ''} 
                    onChange={(url) => setNestedField('upcomingClass', 'teacherAvatar', url)} 
                  />
                </div>
              </div>

              <span className="section-label">Teachers Profiles (3 Cards on Home Screen)</span>
              <div>
                {(config.teachers || []).map((t: any, idx: number) => (
                  <div key={idx} className="teacher-item-block">
                    <span className="teacher-item-header">Teacher Card {idx + 1}</span>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Name</label>
                        <input 
                          type="text" 
                          value={t.name || ''} 
                          onChange={(e) => setTeacherField(idx, 'name', e.target.value)} 
                        />
                      </div>
                      <div className="form-group">
                        <label>Expert Role Label</label>
                        <input 
                          type="text" 
                          value={t.role || ''} 
                          onChange={(e) => setTeacherField(idx, 'role', e.target.value)} 
                        />
                      </div>
                      <div className="form-group span-2">
                        <ImageField 
                          label="Avatar URL/File" 
                          value={t.avatar || ''} 
                          onChange={(url) => setTeacherField(idx, 'avatar', url)} 
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </FormSection>

            {/* ========================================== SECTION 2: BOOSTER DETAILS ========================================== */}
            <FormSection title="2. 6-Day Booster Details Page Config" icon="🚀">
              <span className="section-label">Hero Banner Info</span>
              <div className="form-grid">
                <div className="form-group">
                  <label>Header Title</label>
                  <input 
                    type="text" 
                    value={config.boosterCourse?.headerTitle || ''} 
                    onChange={(e) => setNestedField('boosterCourse', 'headerTitle', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Header Subtitle</label>
                  <input 
                    type="text" 
                    value={config.boosterCourse?.headerSubtitle || ''} 
                    onChange={(e) => setNestedField('boosterCourse', 'headerSubtitle', e.target.value)} 
                  />
                </div>
                <div className="form-group span-2">
                  <label>Card Title (Beige card overlay)</label>
                  <input 
                    type="text" 
                    value={config.boosterCourse?.cardTitle || ''} 
                    onChange={(e) => setNestedField('boosterCourse', 'cardTitle', e.target.value)} 
                  />
                </div>
                <div className="form-group span-2">
                  <label>Main Title Description</label>
                  <input 
                    type="text" 
                    value={config.boosterCourse?.title || ''} 
                    onChange={(e) => setNestedField('boosterCourse', 'title', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Hero Chip Text</label>
                  <input 
                    type="text" 
                    value={config.boosterCourse?.heroChipText || ''} 
                    onChange={(e) => setNestedField('boosterCourse', 'heroChipText', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Parents Badge Choice Label</label>
                  <input 
                    type="text" 
                    value={config.boosterCourse?.parentsBadgeText || ''} 
                    onChange={(e) => setNestedField('boosterCourse', 'parentsBadgeText', e.target.value)} 
                  />
                </div>
                <div className="form-group span-2">
                  <ImageField 
                    label="Hero Top Banner Image" 
                    value={config.boosterCourse?.heroBannerImage || ''} 
                    onChange={(url) => setNestedField('boosterCourse', 'heroBannerImage', url)} 
                  />
                </div>
              </div>

              <span className="section-label">Highlights Bullet Points</span>
              <div className="form-grid">
                {[0, 1, 2, 3].map((idx) => (
                  <div key={idx} className="form-group">
                    <label>Bullet Point Highlight {idx + 1}</label>
                    <input 
                      type="text" 
                      value={(config.boosterCourse?.bullets || [])[idx] || ''} 
                      onChange={(e) => setBulletField('boosterCourse', idx, e.target.value)} 
                    />
                  </div>
                ))}
              </div>

              <span className="section-label">Customer Reviews Section</span>
              <div className="form-grid">
                <div className="form-group span-2">
                  <label>Review Header Title</label>
                  <input 
                    type="text" 
                    value={config.boosterCourse?.reviewSectionTitle || ''} 
                    onChange={(e) => setNestedField('boosterCourse', 'reviewSectionTitle', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Reviewer 1 — Name</label>
                  <input 
                    type="text" 
                    value={config.boosterCourse?.review1Name || ''} 
                    onChange={(e) => setNestedField('boosterCourse', 'review1Name', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Reviewer 1 — Date</label>
                  <input 
                    type="text" 
                    value={config.boosterCourse?.review1Date || ''} 
                    onChange={(e) => setNestedField('boosterCourse', 'review1Date', e.target.value)} 
                  />
                </div>
                <div className="form-group span-2">
                  <label>Reviewer 1 — Review content</label>
                  <textarea 
                    value={config.boosterCourse?.review1Text || ''} 
                    onChange={(e) => setNestedField('boosterCourse', 'review1Text', e.target.value)} 
                  />
                </div>
                <div className="form-group span-2">
                  <ImageField 
                    label="Reviewer 1 — Avatar Photo" 
                    value={config.boosterCourse?.review1Avatar || ''} 
                    onChange={(url) => setNestedField('boosterCourse', 'review1Avatar', url)} 
                  />
                </div>

                <div className="form-group">
                  <label>Reviewer 2 — Name</label>
                  <input 
                    type="text" 
                    value={config.boosterCourse?.review2Name || ''} 
                    onChange={(e) => setNestedField('boosterCourse', 'review2Name', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Reviewer 2 — Date</label>
                  <input 
                    type="text" 
                    value={config.boosterCourse?.review2Date || ''} 
                    onChange={(e) => setNestedField('boosterCourse', 'review2Date', e.target.value)} 
                  />
                </div>
                <div className="form-group span-2">
                  <label>Reviewer 2 — Review content</label>
                  <textarea 
                    value={config.boosterCourse?.review2Text || ''} 
                    onChange={(e) => setNestedField('boosterCourse', 'review2Text', e.target.value)} 
                  />
                </div>
                <div className="form-group span-2">
                  <ImageField 
                    label="Reviewer 2 — Avatar Photo" 
                    value={config.boosterCourse?.review2Avatar || ''} 
                    onChange={(url) => setNestedField('boosterCourse', 'review2Avatar', url)} 
                  />
                </div>
              </div>

              <span className="section-label">Score 100% Score Grid</span>
              <div className="form-grid">
                <div className="form-group span-2">
                  <label>Grid Section Header</label>
                  <input 
                    type="text" 
                    value={config.boosterCourse?.score100Title || ''} 
                    onChange={(e) => setNestedField('boosterCourse', 'score100Title', e.target.value)} 
                  />
                </div>
                <div className="form-group span-2">
                  <label>Grid Header Subjects Highlight Description</label>
                  <input 
                    type="text" 
                    value={config.boosterCourse?.subjectsLine || ''} 
                    onChange={(e) => setNestedField('boosterCourse', 'subjectsLine', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Grid Block 1 — Badge (e.g. Secret of 83%)</label>
                  <input 
                    type="text" 
                    value={config.boosterCourse?.grid1Badge || ''} 
                    onChange={(e) => setNestedField('boosterCourse', 'grid1Badge', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Grid Block 1 — Title</label>
                  <input 
                    type="text" 
                    value={config.boosterCourse?.grid1Title || ''} 
                    onChange={(e) => setNestedField('boosterCourse', 'grid1Title', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Grid Block 2 — Title</label>
                  <input 
                    type="text" 
                    value={config.boosterCourse?.grid2Title || ''} 
                    onChange={(e) => setNestedField('boosterCourse', 'grid2Title', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Grid Block 2 — Subtitle</label>
                  <input 
                    type="text" 
                    value={config.boosterCourse?.grid2Subtitle || ''} 
                    onChange={(e) => setNestedField('boosterCourse', 'grid2Subtitle', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Grid Block 3 — Title</label>
                  <input 
                    type="text" 
                    value={config.boosterCourse?.grid3Title || ''} 
                    onChange={(e) => setNestedField('boosterCourse', 'grid3Title', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Grid Block 3 — Subtitle</label>
                  <input 
                    type="text" 
                    value={config.boosterCourse?.grid3Subtitle || ''} 
                    onChange={(e) => setNestedField('boosterCourse', 'grid3Subtitle', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Grid Block 4 — Title</label>
                  <input 
                    type="text" 
                    value={config.boosterCourse?.grid4Title || ''} 
                    onChange={(e) => setNestedField('boosterCourse', 'grid4Title', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Grid Block 4 — Subtitle</label>
                  <input 
                    type="text" 
                    value={config.boosterCourse?.grid4Subtitle || ''} 
                    onChange={(e) => setNestedField('boosterCourse', 'grid4Subtitle', e.target.value)} 
                  />
                </div>
              </div>

              <span className="section-label">Interactive Live Section</span>
              <div className="form-grid">
                <div className="form-group span-2">
                  <label>Live Section Main Title</label>
                  <input 
                    type="text" 
                    value={config.boosterCourse?.liveSectionTitle || ''} 
                    onChange={(e) => setNestedField('boosterCourse', 'liveSectionTitle', e.target.value)} 
                  />
                </div>
                <div className="form-group span-2">
                  <ImageField 
                    label="Dual Teacher - Master Teacher Avatar" 
                    value={config.boosterCourse?.teacher1Avatar || ''} 
                    onChange={(url) => setNestedField('boosterCourse', 'teacher1Avatar', url)} 
                  />
                </div>
                <div className="form-group span-2">
                  <ImageField 
                    label="Dual Teacher - Mentor Teacher Avatar" 
                    value={config.boosterCourse?.teacher2Avatar || ''} 
                    onChange={(url) => setNestedField('boosterCourse', 'teacher2Avatar', url)} 
                  />
                </div>
                <div className="form-group span-2">
                  <ImageField 
                    label="Dual Teacher - Student avatar" 
                    value={config.boosterCourse?.teacher3Avatar || ''} 
                    onChange={(url) => setNestedField('boosterCourse', 'teacher3Avatar', url)} 
                  />
                </div>
                <div className="form-group span-2">
                  <ImageField 
                    label="Teacher Video Box preview photo" 
                    value={config.boosterCourse?.teacherCardImage || ''} 
                    onChange={(url) => setNestedField('boosterCourse', 'teacherCardImage', url)} 
                  />
                </div>
                
                <div className="form-group">
                  <label>Trust Feature 1 Title</label>
                  <input 
                    type="text" 
                    value={config.boosterCourse?.trustMetric1Title || ''} 
                    onChange={(e) => setNestedField('boosterCourse', 'trustMetric1Title', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Trust Feature 1 Subtitle</label>
                  <input 
                    type="text" 
                    value={config.boosterCourse?.trustMetric1Subtitle || ''} 
                    onChange={(e) => setNestedField('boosterCourse', 'trustMetric1Subtitle', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Trust Feature 2 Title</label>
                  <input 
                    type="text" 
                    value={config.boosterCourse?.trustMetric2Title || ''} 
                    onChange={(e) => setNestedField('boosterCourse', 'trustMetric2Title', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Trust Feature 2 Subtitle</label>
                  <input 
                    type="text" 
                    value={config.boosterCourse?.trustMetric2Subtitle || ''} 
                    onChange={(e) => setNestedField('boosterCourse', 'trustMetric2Subtitle', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Trust Feature 3 Title</label>
                  <input 
                    type="text" 
                    value={config.boosterCourse?.trustMetric3Title || ''} 
                    onChange={(e) => setNestedField('boosterCourse', 'trustMetric3Title', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Trust Feature 3 Subtitle</label>
                  <input 
                    type="text" 
                    value={config.boosterCourse?.trustMetric3Subtitle || ''} 
                    onChange={(e) => setNestedField('boosterCourse', 'trustMetric3Subtitle', e.target.value)} 
                  />
                </div>
              </div>

              <span className="section-label">Pricing details</span>
              <div className="form-grid">
                <div className="form-group">
                  <label>Booster Offer Price (INR)</label>
                  <input 
                    type="number" 
                    value={config.boosterCourse?.price || 0} 
                    onChange={(e) => setNestedField('boosterCourse', 'price', Number(e.target.value))} 
                  />
                </div>
                <div className="form-group">
                  <label>Booster Original Price (INR)</label>
                  <input 
                    type="number" 
                    value={config.boosterCourse?.originalPrice || 0} 
                    onChange={(e) => setNestedField('boosterCourse', 'originalPrice', Number(e.target.value))} 
                  />
                </div>
              </div>
            </FormSection>

            {/* ========================================== SECTION 3: MASTER DETAILS ========================================== */}
            <FormSection title="3. Long-term Master Program Config" icon="🎯">
              <span className="section-label">Hero Section</span>
              <div className="form-grid">
                <div className="form-group">
                  <label>Master Screen Header Title</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.headerTitle || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'headerTitle', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Master Screen Header Subtitle</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.headerSubtitle || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'headerSubtitle', e.target.value)} 
                  />
                </div>
                <div className="form-group span-2">
                  <label>Program Headline Title</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.title || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'title', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Beige card Subjects Label</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.subjectsCardLabel || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'subjectsCardLabel', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Beige card Subjects Text</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.subjectsCardText || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'subjectsCardText', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Metric Course Count Text (e.g. 400+ Courses)</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.metricCourses || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'metricCourses', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Metric Concepts Count Text (e.g. 200+ Concepts)</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.metricConcepts || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'metricConcepts', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Metric Quiz Count Text (e.g. 5000+ Quizzes)</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.metricQuizzes || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'metricQuizzes', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Schedule Text label</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.scheduleText || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'scheduleText', e.target.value)} 
                  />
                </div>
                <div className="form-group span-2">
                  <label>Subject Pills Row Text</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.subjectPillText || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'subjectPillText', e.target.value)} 
                  />
                </div>
              </div>

              <span className="section-label">Academic Highlights Bullet Points</span>
              <div className="form-grid">
                {[0, 1, 2].map((idx) => (
                  <div key={idx} className="form-group">
                    <label>Highlight Bullet point {idx + 1}</label>
                    <input 
                      type="text" 
                      value={(config.masterProgram?.bullets || [])[idx] || ''} 
                      onChange={(e) => setBulletField('masterProgram', idx, e.target.value)} 
                    />
                  </div>
                ))}
              </div>

              <span className="section-label">Course Outline Syllabus</span>
              <div className="form-grid">
                <div className="form-group span-2">
                  <label>Outline Subtitle Description</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.outlineSubtitle || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'outlineSubtitle', e.target.value)} 
                  />
                </div>
                {[0, 1, 2].map((idx) => (
                  <div key={idx} className="form-group span-2">
                    <label>Outline Block {idx + 1} Title and Details</label>
                    <input 
                      type="text" 
                      value={(config.masterProgram?.outline || [])[idx] || ''} 
                      onChange={(e) => setOutlineField(idx, e.target.value)} 
                    />
                  </div>
                ))}
              </div>

              <span className="section-label">User Ratings & Testimonial review</span>
              <div className="form-grid">
                <div className="form-group">
                  <label>Ratings section header text</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.ratingsTitle || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'ratingsTitle', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Total ratings count indicator</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.ratingsCount || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'ratingsCount', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Rating Score (e.g. 4.7)</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.ratingScore || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'ratingScore', e.target.value)} 
                  />
                </div>
                <div className="form-group"></div>
                
                <div className="form-group">
                  <label>Rating tag chip 1 text</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.ratingChip1 || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'ratingChip1', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Rating tag chip 2 text</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.ratingChip2 || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'ratingChip2', e.target.value)} 
                  />
                </div>
                <div className="form-group span-2">
                  <label>Rating tag chip 3 text</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.ratingChip3 || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'ratingChip3', e.target.value)} 
                  />
                </div>

                <div className="form-group">
                  <label>Testimonial Reviewer Name</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.testimonialName || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'testimonialName', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Testimonial Date Label</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.testimonialDate || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'testimonialDate', e.target.value)} 
                  />
                </div>
                <div className="form-group span-2">
                  <label>Testimonial Text block</label>
                  <textarea 
                    value={config.masterProgram?.testimonialText || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'testimonialText', e.target.value)} 
                  />
                </div>
                <div className="form-group span-2">
                  <label>Testimonial Course/Session topic Tag</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.testimonialSessionTag || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'testimonialSessionTag', e.target.value)} 
                  />
                </div>

                <div className="form-group">
                  <label>Testimonial Badge pill tag 1</label>
                  <input 
                    type="text" 
                    value={(config.masterProgram?.testimonialTags || [])[0] || ''} 
                    onChange={(e) => setTestimonialTagField(0, e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Testimonial Badge pill tag 2</label>
                  <input 
                    type="text" 
                    value={(config.masterProgram?.testimonialTags || [])[1] || ''} 
                    onChange={(e) => setTestimonialTagField(1, e.target.value)} 
                  />
                </div>
                <div className="form-group span-2">
                  <label>Testimonial Badge pill tag 3</label>
                  <input 
                    type="text" 
                    value={(config.masterProgram?.testimonialTags || [])[2] || ''} 
                    onChange={(e) => setTestimonialTagField(2, e.target.value)} 
                  />
                </div>
              </div>

              <span className="section-label">Faculty Spotlight & Team</span>
              <div className="form-grid">
                <div className="form-group">
                  <label>Faculty Section Header</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.facultyTitle || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'facultyTitle', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Faculty Subtitle description</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.facultySubtitle || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'facultySubtitle', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Featured Teacher Name</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.featuredTeacherName || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'featuredTeacherName', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Featured Teacher Role Label</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.featuredTeacherRole || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'featuredTeacherRole', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Featured Teacher Rating score indicator</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.featuredTeacherRating || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'featuredTeacherRating', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <ImageField 
                    label="Featured Teacher Photo" 
                    value={config.masterProgram?.featuredTeacherAvatar || ''} 
                    onChange={(url) => setNestedField('masterProgram', 'featuredTeacherAvatar', url)} 
                  />
                </div>

                <div className="form-group">
                  <label>Team Overview section title</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.teamSectionTitle || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'teamSectionTitle', e.target.value)} 
                  />
                </div>
                <div className="form-group"></div>
                <div className="form-group">
                  <label>Team highlight Badge pill 1</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.teamBadge1 || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'teamBadge1', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Team highlight Badge pill 2</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.teamBadge2 || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'teamBadge2', e.target.value)} 
                  />
                </div>
              </div>

              <span className="section-label">Student Success Results & Feedbacks</span>
              <div className="form-grid">
                <div className="form-group">
                  <label>Results section header title</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.resultsSectionTitle || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'resultsSectionTitle', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Results section subtitle description</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.resultsSectionSubtitle || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'resultsSectionSubtitle', e.target.value)} 
                  />
                </div>

                <div className="form-group">
                  <label>Success Student 1 — Name</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.studentResult1Name || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'studentResult1Name', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Success Student 1 — Score Increase percentage</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.studentResult1Pct || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'studentResult1Pct', e.target.value)} 
                  />
                </div>
                <div className="form-group span-2">
                  <ImageField 
                    label="Success Student 1 — Photo" 
                    value={config.masterProgram?.studentResult1Avatar || ''} 
                    onChange={(url) => setNestedField('masterProgram', 'studentResult1Avatar', url)} 
                  />
                </div>

                <div className="form-group">
                  <label>Success Student 2 — Name</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.studentResult2Name || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'studentResult2Name', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Success Student 2 — Score Increase percentage</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.studentResult2Pct || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'studentResult2Pct', e.target.value)} 
                  />
                </div>
                <div className="form-group span-2">
                  <ImageField 
                    label="Success Student 2 — Photo" 
                    value={config.masterProgram?.studentResult2Avatar || ''} 
                    onChange={(url) => setNestedField('masterProgram', 'studentResult2Avatar', url)} 
                  />
                </div>

                <div className="form-group">
                  <label>Success Student 3 — Name</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.studentResult3Name || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'studentResult3Name', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Success Student 3 — Score Increase percentage</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.studentResult3Pct || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'studentResult3Pct', e.target.value)} 
                  />
                </div>
                <div className="form-group span-2">
                  <ImageField 
                    label="Success Student 3 — Photo" 
                    value={config.masterProgram?.studentResult3Avatar || ''} 
                    onChange={(url) => setNestedField('masterProgram', 'studentResult3Avatar', url)} 
                  />
                </div>

                <div className="form-group span-2">
                  <label>Chat feedback text block 1</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.chatBubble1 || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'chatBubble1', e.target.value)} 
                  />
                </div>
                <div className="form-group span-2">
                  <label>Chat feedback text block 2</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.chatBubble2 || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'chatBubble2', e.target.value)} 
                  />
                </div>
                <div className="form-group span-2">
                  <label>Chat feedback text block 3</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.chatBubble3 || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'chatBubble3', e.target.value)} 
                  />
                </div>
              </div>

              <span className="section-label">Trust Count Verified metrics</span>
              <div className="form-grid">
                <div className="form-group">
                  <label>Trust Score/Number metric (e.g. 20,103,026)</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.trustNumber || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'trustNumber', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Trust Tag label text</label>
                  <input 
                    type="text" 
                    value={config.masterProgram?.trustLabel || ''} 
                    onChange={(e) => setNestedField('masterProgram', 'trustLabel', e.target.value)} 
                  />
                </div>
              </div>

              <span className="section-label">Pricing details</span>
              <div className="form-grid">
                <div className="form-group">
                  <label>Master Program Tuition Fee (INR)</label>
                  <input 
                    type="number" 
                    value={config.masterProgram?.price || 0} 
                    onChange={(e) => setNestedField('masterProgram', 'price', Number(e.target.value))} 
                  />
                </div>
              </div>
            </FormSection>

            {/* Bottom Actions Row */}
            <div className="btn-row" style={{ marginTop: '20px', paddingBottom: '50px' }}>
              <button type="submit" className="save-btn" disabled={saving}>
                {saving ? 'Saving changes...' : '💾 Save All Configurations'}
              </button>
            </div>
          </form>
        )}
          </>
        )}

        {/* Global Toast component */}
        {toast && (
          <div className="toast active">
            <div className="toast-dot"></div>
            <span>{toast}</span>
          </div>
        )}
      </div>
    </div>
  );
}
