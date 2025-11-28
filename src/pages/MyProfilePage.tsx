import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { uploadImage } from '../lib/imageUpload';
import { User, Upload, Save, Plus, X, Crown, Building2, Gem, CheckCircle, Laptop } from 'lucide-react';
import { Profile, Message } from '../types';

interface MyProfilePageProps {
  user: any;
  profile: Profile | null;
  language: 'en' | 'ar';
  t: any;
  onProfileUpdate: () => void;
}

const MyProfilePage: React.FC<MyProfilePageProps> = ({ user, profile, language, t, onProfileUpdate }) => {
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [changingPassword, setChangingPassword] = useState(false);

  const [profileForm, setProfileForm] = useState({
    display_name: profile?.display_name || '',
    bio: profile?.bio || '',
    social_platform: '',
    social_url: ''
  });

  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  if (!user || !profile) {
    return (
      <div className="retro-window">
        <div className="window-header">
          <span>{language === 'en' ? 'Access Denied' : 'غير مصرح'}</span>
        </div>
        <div className="window-content">
          <p>{language === 'en' ? 'Please login to edit your profile' : 'يرجى تسجيل الدخول لتعديل ملفك الشخصي'}</p>
          <button className="retro-button primary" onClick={() => navigate('/login')}>
            {t.login}
          </button>
        </div>
      </div>
    );
  }

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const imageUrl = await uploadImage(file, 'avatars', user.id);

      if (imageUrl) {
        const { error } = await supabase
          .from('profiles')
          .update({ avatar_url: imageUrl })
          .eq('id', user.id);

        if (error) throw error;
        onProfileUpdate();
        setMessage({ type: 'success', text: 'Avatar uploaded successfully!' });
        setTimeout(() => setMessage(null), 2000);
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setUploading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const updates = {
        display_name: profileForm.display_name,
        bio: profileForm.bio,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      onProfileUpdate();
      setMessage({ type: 'success', text: 'Profile updated!' });
      setTimeout(() => setMessage(null), 2000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleAddSocialLink = async () => {
    if (!profileForm.social_platform || !profileForm.social_url) return;

    try {
      const currentLinks = profile?.social_links || [];
      const newLinks = [...currentLinks, {
        platform: profileForm.social_platform,
        url: profileForm.social_url
      }];

      const { error } = await supabase
        .from('profiles')
        .update({ social_links: newLinks })
        .eq('id', user.id);

      if (error) throw error;

      onProfileUpdate();
      setProfileForm(prev => ({ ...prev, social_platform: '', social_url: '' }));
      setMessage({ type: 'success', text: 'Social link added!' });
      setTimeout(() => setMessage(null), 2000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleRemoveSocialLink = async (index: number) => {
    try {
      const currentLinks = profile?.social_links || [];
      const newLinks = currentLinks.filter((_, i) => i !== index);

      const { error } = await supabase
        .from('profiles')
        .update({ social_links: newLinks })
        .eq('id', user.id);

      if (error) throw error;

      onProfileUpdate();
      setMessage({ type: 'success', text: 'Social link removed!' });
      setTimeout(() => setMessage(null), 2000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword.length < 6) {
      setMessage({
        type: 'error',
        text: language === 'en' ? 'Password must be at least 6 characters' : 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
      });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({
        type: 'error',
        text: language === 'en' ? 'Passwords do not match' : 'كلمات المرور غير متطابقة'
      });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (error) throw error;

      setPasswordForm({ newPassword: '', confirmPassword: '' });
      setMessage({
        type: 'success',
        text: language === 'en' ? 'Password changed successfully!' : 'تم تغيير كلمة المرور بنجاح!'
      });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setChangingPassword(false);
    }
  };

  const getVerificationBadge = () => {
    if (!profile.is_verified && profile.user_rank === 'member') return null;

    const badges = {
      admin: <Crown size={16} style={{ color: '#ffd700' }} />,
      developer: <Laptop size={16} style={{ color: '#00ff00' }} />,
      mason_official: <Building2 size={16} style={{ color: '#00bfff' }} />,
      vip: <Gem size={16} style={{ color: '#ff00ff' }} />,
      member: profile.is_verified ? <CheckCircle size={16} style={{ color: '#00ff00' }} /> : null
    };

    const badge = badges[profile.user_rank || 'member'];
    return badge ? <span title={t.verified}>{badge}</span> : null;
  };

  return (
    <>
      <div className="retro-window">
        <div className="window-header">
          <span>{t.profile}</span>
          <div className="window-buttons">
            <div className="window-button minimize">_</div>
            <div className="window-button maximize">□</div>
            <div className="window-button close" onClick={() => navigate('/')}>×</div>
          </div>
        </div>
        <div className="window-content">
          <div className="profile-section">
            <div className="profile-avatar-section">
              <div
                className="profile-avatar-large"
                onClick={() => avatarInputRef.current?.click()}
                style={{ cursor: 'pointer', position: 'relative' }}
              >
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.username} style={{ width: '128px', height: '128px', objectFit: 'cover', borderRadius: '4px' }} />
                ) : (
                  <User size={64} />
                )}
                <div className="avatar-upload-overlay" style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: 'rgba(0,0,0,0.7)',
                  padding: '8px',
                  textAlign: 'center',
                  fontSize: '12px'
                }}>
                  <Upload size={16} style={{ display: 'inline', marginRight: '5px' }} />
                  {uploading ? 'Uploading...' : t.uploadImage}
                </div>
              </div>
              <input
                type="file"
                ref={avatarInputRef}
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                }}
              />
              <h2>{profile.display_name || profile.username} {getVerificationBadge()}</h2>
              <div className="profile-rank">
                {t[profile.user_rank || 'member']}
              </div>
              {profile.mason_badge && (
                <div className="mason-badge-display" style={{ marginTop: '10px', padding: '5px 15px', background: 'rgba(0,255,0,0.1)', border: '1px solid #00ff00', borderRadius: '4px' }}>
                  {profile.mason_badge}
                </div>
              )}
              <button
                className="retro-button secondary"
                onClick={() => navigate(`/user/${profile.username}`)}
                style={{ marginTop: '15px' }}
              >
                {language === 'en' ? 'View Public Profile' : 'عرض الملف العام'}
              </button>
            </div>

            <div className="separator" style={{ margin: '30px 0' }}></div>

            <form onSubmit={handleProfileUpdate}>
              <h3>{language === 'en' ? 'Edit Profile Information' : 'تعديل معلومات الملف'}</h3>

              <div className="form-group">
                <label className="form-label">{t.username}</label>
                <input type="text" className="form-input" value={profile.username} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                <small style={{ fontSize: '11px', opacity: 0.7 }}>
                  {language === 'en' ? 'Username cannot be changed' : 'لا يمكن تغيير اسم المستخدم'}
                </small>
              </div>

              <div className="form-group">
                <label className="form-label">{t.displayName}</label>
                <input
                  type="text"
                  className="form-input"
                  value={profileForm.display_name}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, display_name: e.target.value }))}
                  placeholder={language === 'en' ? 'Your display name' : 'الاسم المعروض'}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t.bio} <span style={{ fontSize: '11px', opacity: 0.7 }}>({profileForm.bio.length}/300)</span></label>
                <textarea
                  className="form-textarea"
                  value={profileForm.bio}
                  onChange={(e) => {
                    if (e.target.value.length <= 300) {
                      setProfileForm(prev => ({ ...prev, bio: e.target.value }));
                    }
                  }}
                  rows={4}
                  maxLength={300}
                  placeholder={language === 'en' ? 'Tell us about yourself... (max 300 characters)' : 'أخبرنا عن نفسك... (حد أقصى 300 حرف)'}
                />
              </div>

              <button type="submit" className="retro-button primary">
                <Save size={16} /> {t.saveProfile}
              </button>
            </form>

            <div className="separator" style={{ margin: '30px 0' }}></div>

            <div className="social-links">
              <h3>{t.socialLinks}</h3>
              {profile?.social_links && profile.social_links.length > 0 ? (
                <div style={{ marginTop: '15px' }}>
                  {profile.social_links.map((link, index) => (
                    <div key={index} className="social-link" style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px',
                      marginBottom: '8px',
                      border: '1px solid rgba(0,255,0,0.3)',
                      background: 'rgba(0,255,0,0.05)'
                    }}>
                      <span>
                        <strong>{link.platform}:</strong>{' '}
                        <a href={link.url} target="_blank" rel="noopener noreferrer" style={{ color: '#00ff00' }}>
                          {link.url}
                        </a>
                      </span>
                      <button
                        className="delete-btn"
                        onClick={() => handleRemoveSocialLink(index)}
                        style={{ background: '#ff4444', padding: '5px 10px' }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ opacity: 0.6, marginTop: '10px' }}>
                  {language === 'en' ? 'No social links added yet' : 'لم تتم إضافة روابط اجتماعية بعد'}
                </p>
              )}
            </div>

            <div className="links-form" style={{ marginTop: '20px', padding: '20px', border: '2px solid #00ff00', background: 'rgba(0,255,0,0.05)' }}>
              <h4>{language === 'en' ? 'Add Social Link' : 'إضافة رابط اجتماعي'}</h4>
              <div className="form-group">
                <label className="form-label">{t.platform}</label>
                <input
                  type="text"
                  className="form-input"
                  value={profileForm.social_platform}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, social_platform: e.target.value }))}
                  placeholder="Twitter, Instagram, GitHub, etc."
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t.url}</label>
                <input
                  type="url"
                  className="form-input"
                  value={profileForm.social_url}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, social_url: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
              <button
                type="button"
                className="retro-button secondary"
                onClick={handleAddSocialLink}
                disabled={!profileForm.social_platform || !profileForm.social_url}
              >
                <Plus size={16} /> {t.addLink}
              </button>
            </div>

            <div className="separator" style={{ margin: '30px 0' }}></div>

            <div className="password-change-section">
              <h3>{language === 'en' ? 'Change Password' : 'تغيير كلمة المرور'}</h3>
              <form onSubmit={handlePasswordChange} style={{ marginTop: '15px' }}>
                <div className="form-group">
                  <label className="form-label">
                    {language === 'en' ? 'New Password' : 'كلمة المرور الجديدة'}
                  </label>
                  <input
                    type="password"
                    className="form-input"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    required
                    minLength={6}
                    placeholder={language === 'en' ? 'Minimum 6 characters' : 'على الأقل 6 أحرف'}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    {language === 'en' ? 'Confirm New Password' : 'تأكيد كلمة المرور الجديدة'}
                  </label>
                  <input
                    type="password"
                    className="form-input"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    required
                    minLength={6}
                    placeholder={language === 'en' ? 'Re-enter password' : 'أعد إدخال كلمة المرور'}
                  />
                </div>
                <button
                  type="submit"
                  className="retro-button primary"
                  disabled={changingPassword}
                  style={{ width: '100%' }}
                >
                  {changingPassword
                    ? (language === 'en' ? 'Changing...' : 'جاري التغيير...')
                    : (language === 'en' ? 'Change Password' : 'تغيير كلمة المرور')
                  }
                </button>
              </form>
            </div>
          </div>
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

export default MyProfilePage;
