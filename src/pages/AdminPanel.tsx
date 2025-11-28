import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { User, Trash2, CheckCircle, XCircle, Shield, Crown, CreditCard as Edit2, Eye, Lock, Unlock, Key } from 'lucide-react';
import { Profile, Message } from '../types';

interface AdminPanelProps {
  user: any;
  profile: Profile | null;
  language: 'en' | 'ar';
  t: any;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ user, profile, language, t }) => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<Message | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [changingPassword, setChangingPassword] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (!profile || profile.user_rank !== 'admin') {
      navigate('/');
      return;
    }
    loadUsers();
  }, [profile, navigate]);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      showMessage('error', language === 'en' ? 'Failed to load users' : 'فشل تحميل المستخدمين');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleUpdateRank = async (userId: string, newRank: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ user_rank: newRank })
        .eq('id', userId);

      if (error) throw error;

      showMessage('success', language === 'en' ? 'User rank updated!' : 'تم تحديث رتبة المستخدم!');
      loadUsers();
    } catch (error: any) {
      showMessage('error', error.message);
    }
  };

  const handleToggleVerification = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_verified: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      showMessage('success', language === 'en' ? 'Verification status updated!' : 'تم تحديث حالة التوثيق!');
      loadUsers();
    } catch (error: any) {
      showMessage('error', error.message);
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(language === 'en' ? `Delete user "${username}"? This cannot be undone!` : `حذف المستخدم "${username}"؟ لا يمكن التراجع!`)) {
      return;
    }

    try {
      const { error: projectsError } = await supabase
        .from('projects')
        .delete()
        .eq('user_id', userId);

      if (projectsError) throw projectsError;

      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) throw profileError;

      showMessage('success', language === 'en' ? 'User deleted successfully!' : 'تم حذف المستخدم بنجاح!');
      loadUsers();
    } catch (error: any) {
      showMessage('error', error.message);
    }
  };

  const handleUpdateBadge = async (userId: string, badge: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ mason_badge: badge || null })
        .eq('id', userId);

      if (error) throw error;

      showMessage('success', language === 'en' ? 'Badge updated!' : 'تم تحديث الشارة!');
      setEditingUser(null);
      loadUsers();
    } catch (error: any) {
      showMessage('error', error.message);
    }
  };

  const handleBanUser = async (userId: string, currentBanStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_banned: !currentBanStatus })
        .eq('id', userId);

      if (error) throw error;

      showMessage('success', language === 'en' ? 'Ban status updated!' : 'تم تحديث حالة الحظر!');
      loadUsers();
    } catch (error: any) {
      showMessage('error', error.message);
    }
  };

  const handleChangePassword = async (userId: string, username: string) => {
    if (!newPassword || newPassword.length < 6) {
      showMessage('error', language === 'en' ? 'Password must be at least 6 characters' : 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    try {
      const { data, error } = await supabase.rpc('admin_change_user_password', {
        target_user_id: userId,
        new_password: newPassword
      });

      if (error) throw error;

      if (data === true) {
        showMessage('success', language === 'en'
          ? `Password changed for ${username}! User can now login with the new password.`
          : `تم تغيير كلمة المرور لـ ${username}! يمكن للمستخدم تسجيل الدخول بكلمة المرور الجديدة.`);
        setChangingPassword(null);
        setNewPassword('');
      } else {
        throw new Error('Failed to change password');
      }
    } catch (error: any) {
      showMessage('error', error.message || (language === 'en' ? 'Failed to change password' : 'فشل تغيير كلمة المرور'));
    }
  };

  if (!profile || profile.user_rank !== 'admin') {
    return (
      <div className="retro-window">
        <div className="window-header">
          <span>{language === 'en' ? 'Access Denied' : 'غير مصرح'}</span>
        </div>
        <div className="window-content">
          <p>{language === 'en' ? 'Admin access required' : 'يتطلب صلاحيات المدير'}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="retro-window">
        <div className="window-header">
          <span>{t.loading}</span>
        </div>
        <div className="window-content">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div className="terminal-text blink">{t.loading}</div>
          </div>
        </div>
      </div>
    );
  }

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.display_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <>
      <div className="retro-window">
        <div className="window-header">
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Crown size={18} /> {t.adminPanel}</span>
          <div className="window-buttons">
            <div className="window-button minimize">_</div>
            <div className="window-button maximize">□</div>
            <div className="window-button close" onClick={() => navigate('/')}>×</div>
          </div>
        </div>
        <div className="window-content">
          <div className="terminal-section" style={{ marginBottom: '20px' }}>
            <div className="terminal-title">ADMIN CONTROL PANEL</div>
            <div className="terminal-line">
              {language === 'en'
                ? '> System Administrator Access Granted'
                : '> تم منح الوصول كمسؤول النظام'}
            </div>
            <div className="terminal-line">
              {language === 'en'
                ? `> Total Users: ${users.length}`
                : `> إجمالي المستخدمين: ${users.length}`}
            </div>
            <div className="terminal-line">
              {language === 'en'
                ? `> Admins: ${users.filter(u => u.user_rank === 'admin').length}`
                : `> المدراء: ${users.filter(u => u.user_rank === 'admin').length}`}
            </div>
          </div>

          <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <h3>{language === 'en' ? 'User Management' : 'إدارة المستخدمين'} ({filteredUsers.length})</h3>
            <input
              type="text"
              className="form-input"
              placeholder={language === 'en' ? 'Search users...' : 'ابحث عن مستخدم...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '250px' }}
            />
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(0,255,0,0.1)', borderBottom: '2px solid #00ff00' }}>
                  <th style={{ padding: '10px', textAlign: 'left' }}>{language === 'en' ? 'User' : 'المستخدم'}</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>{language === 'en' ? 'Email' : 'البريد'}</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>{language === 'en' ? 'Rank' : 'الرتبة'}</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>{language === 'en' ? 'Verified' : 'موثق'}</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>{language === 'en' ? 'Badge' : 'الشارة'}</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>{language === 'en' ? 'Actions' : 'الإجراءات'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(userProfile => (
                  <tr key={userProfile.id} style={{ borderBottom: '1px solid rgba(0,255,0,0.3)' }}>
                    <td style={{ padding: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="profile-avatar" style={{ width: '32px', height: '32px' }}>
                          {userProfile.avatar_url ? (
                            <img src={userProfile.avatar_url} alt={userProfile.username} style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover' }} />
                          ) : (
                            <User size={20} />
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 'bold' }}>{userProfile.display_name || userProfile.username}</div>
                          <div style={{ fontSize: '11px', opacity: 0.7 }}>@{userProfile.username}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '10px', fontSize: '12px', opacity: 0.8 }}>{userProfile.email}</td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      <select
                        className="form-input"
                        value={userProfile.user_rank || 'member'}
                        onChange={(e) => handleUpdateRank(userProfile.id, e.target.value)}
                        style={{ padding: '5px', fontSize: '11px', minWidth: '120px' }}
                      >
                        <option value="member">{t.member}</option>
                        <option value="vip">{t.vip}</option>
                        <option value="mason_official">{t.mason_official}</option>
                        <option value="developer">{t.developer}</option>
                        <option value="admin">{t.admin}</option>
                      </select>
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      <button
                        className={`retro-button ${userProfile.is_verified ? 'primary' : 'secondary'}`}
                        onClick={() => handleToggleVerification(userProfile.id, userProfile.is_verified || false)}
                        style={{ padding: '5px 10px', fontSize: '11px' }}
                      >
                        {userProfile.is_verified ? <CheckCircle size={14} /> : <XCircle size={14} />}
                      </button>
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      {editingUser?.id === userProfile.id ? (
                        <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                          <input
                            type="text"
                            className="form-input"
                            defaultValue={userProfile.mason_badge || ''}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleUpdateBadge(userProfile.id, (e.target as HTMLInputElement).value);
                              }
                            }}
                            style={{ padding: '5px', fontSize: '11px', width: '100px' }}
                            autoFocus
                          />
                          <button
                            className="retro-button secondary"
                            onClick={() => setEditingUser(null)}
                            style={{ padding: '5px', fontSize: '11px' }}
                          >
                            <XCircle size={12} />
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px' }}>{userProfile.mason_badge || '-'}</span>
                          <button
                            className="retro-button secondary"
                            onClick={() => setEditingUser(userProfile)}
                            style={{ padding: '3px 8px', fontSize: '11px' }}
                          >
                            <Edit2 size={12} />
                          </button>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                          className="retro-button secondary"
                          onClick={() => navigate(`/user/${userProfile.username}`)}
                          style={{ padding: '5px 10px', fontSize: '11px' }}
                          title={language === 'en' ? 'View Profile' : 'عرض الملف'}
                        >
                          <Eye size={12} />
                        </button>
                        <button
                          className="retro-button"
                          onClick={() => handleBanUser(userProfile.id, userProfile.is_banned || false)}
                          style={{
                            padding: '5px 10px',
                            fontSize: '11px',
                            background: userProfile.is_banned ? '#ffd700' : '#ff4444'
                          }}
                          title={language === 'en' ? (userProfile.is_banned ? 'Unban' : 'Ban') : (userProfile.is_banned ? 'إلغاء الحظر' : 'حظر')}
                        >
                          {userProfile.is_banned ? <Unlock size={12} /> : <Lock size={12} />}
                        </button>
                        <button
                          className="retro-button"
                          onClick={() => setChangingPassword(changingPassword === userProfile.id ? null : userProfile.id)}
                          style={{ padding: '5px 10px', fontSize: '11px', background: '#ff9800' }}
                          title={language === 'en' ? 'Change Password' : 'تغيير كلمة المرور'}
                        >
                          <Key size={12} />
                        </button>
                        {userProfile.id !== user.id && (
                          <button
                            className="retro-button"
                            onClick={() => handleDeleteUser(userProfile.id, userProfile.username)}
                            style={{ padding: '5px 10px', fontSize: '11px', background: '#ff4444' }}
                            title={language === 'en' ? 'Delete User' : 'حذف المستخدم'}
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                      {changingPassword === userProfile.id && (
                        <div style={{ marginTop: '8px', display: 'flex', gap: '5px', justifyContent: 'center' }}>
                          <input
                            type="password"
                            className="form-input"
                            placeholder={language === 'en' ? 'New password' : 'كلمة المرور الجديدة'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleChangePassword(userProfile.id, userProfile.username);
                              }
                            }}
                            style={{ padding: '5px', fontSize: '11px', width: '120px' }}
                            autoFocus
                          />
                          <button
                            className="retro-button primary"
                            onClick={() => handleChangePassword(userProfile.id, userProfile.username)}
                            style={{ padding: '5px 10px', fontSize: '11px' }}
                          >
                            {language === 'en' ? 'Save' : 'حفظ'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="no-projects" style={{ marginTop: '20px' }}>
              {language === 'en' ? 'No users found' : 'لا يوجد مستخدمين'}
            </div>
          )}
        </div>
      </div>

      {message && (
        <div className={`retro-message ${message.type}`} onClick={() => setMessage(null)}>
          {message.text}
        </div>
      )}
    </>
  );
};

export default AdminPanel;
