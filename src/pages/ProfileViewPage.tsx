import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { User, Copy, Download, Crown, Building2, Gem, CheckCircle, Laptop, Star } from 'lucide-react';
import { Profile, Project, Message } from '../types';
import { copyProfileUrl } from '../utils/profileUrl';

interface ProfileViewPageProps {
  language: 'en' | 'ar';
  t: any;
}

const ProfileViewPage: React.FC<ProfileViewPageProps> = ({ language, t }) => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<Message | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (!username) {
        setLoading(false);
        return;
      }

      try {
        const cleanUsername = username.startsWith('@') ? username.slice(1) : username;

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', cleanUsername)
          .maybeSingle();

        if (profileError) throw profileError;

        if (!profileData) {
          setProfile(null);
          setLoading(false);
          return;
        }

        setProfile(profileData);

        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select(`
            *,
            profiles:user_id (
              username,
              display_name,
              user_rank,
              is_verified
            )
          `)
          .eq('user_id', profileData.id)
          .order('created_at', { ascending: false });

        if (projectsError) throw projectsError;
        setProjects(projectsData || []);
      } catch (error) {
        console.error('Error loading profile:', error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [username, navigate]);

  const handleCopyUrl = async () => {
    if (!profile?.username) return;
    try {
      await copyProfileUrl(profile.username);
      setMessage({ type: 'success', text: t.urlCopied || 'URL copied!' });
      setTimeout(() => setMessage(null), 2000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to copy URL' });
    }
  };

  const handleDownload = async (projectId: string, downloadLink: string) => {
    try {
      await supabase.rpc('increment_download_count', { project_id: projectId });
      window.open(downloadLink, '_blank');
    } catch (error) {
      console.error('Error handling download:', error);
    }
  };

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

  if (!profile) {
    return (
      <div className="retro-window">
        <div className="window-header">
          <span>{language === 'en' ? 'Profile Not Found' : 'الملف غير موجود'}</span>
          <div className="window-buttons">
            <div className="window-button close" onClick={() => navigate('/members')}>×</div>
          </div>
        </div>
        <div className="window-content">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>{language === 'en' ? 'User not found' : 'المستخدم غير موجود'}</p>
            <button className="retro-button primary" onClick={() => navigate('/members')}>
              {language === 'en' ? 'Back to Members' : 'العودة للأعضاء'}
            </button>
          </div>
        </div>
      </div>
    );
  }

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
          <span>@{profile.username}</span>
          <div className="window-buttons">
            <div className="window-button close" onClick={() => navigate(-1)}>×</div>
          </div>
        </div>
        <div className="window-content">
          <div className="profile-section">
            <div className="profile-avatar-section">
              <div className="profile-avatar-large">
                {profile.avatar_url ? <img src={profile.avatar_url} alt={profile.username} /> : <User size={64} />}
              </div>
              <h2>{profile.display_name || profile.username} {getVerificationBadge()}</h2>
              <div className="profile-rank">
                {t[profile.user_rank || 'member']}
              </div>
              {profile.mason_badge && (
                <div className="mason-badge-display" style={{ marginTop: '10px', padding: '5px 15px', background: 'rgba(0,255,0,0.1)', border: '1px solid #00ff00', borderRadius: '4px' }}>{profile.mason_badge}</div>
              )}
              <button className="retro-button secondary" onClick={handleCopyUrl} style={{ marginTop: '15px' }}>
                <Copy size={16} /> {t.copyProfileUrl || 'Copy Profile URL'}
              </button>
            </div>

            <div className="profile-details" style={{ marginTop: '30px' }}>
              <div className="profile-field">
                <label>{language === 'en' ? 'Username:' : 'اسم المستخدم:'}</label>
                <span className="profile-value">@{profile.username}</span>
              </div>
              {profile.bio && (
                <div className="profile-field">
                  <label>{t.bio}:</label>
                  <span className="profile-value">{profile.bio}</span>
                </div>
              )}
              <div className="profile-field">
                <label>{t.joinedOn}:</label>
                <span className="profile-value">{new Date(profile.created_at || '').toLocaleDateString()}</span>
              </div>
              {profile.social_links && profile.social_links.length > 0 && (
                <div className="profile-field">
                  <label>{t.socialLinks}:</label>
                  <div className="profile-value">
                    {profile.social_links.map((link, index) => (
                      <div key={index} style={{ marginBottom: '5px' }}>
                        <strong>{link.platform}:</strong> <a href={link.url} target="_blank" rel="noopener noreferrer" style={{ color: '#00ff00' }}>{link.url}</a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="separator" style={{ margin: '30px 0' }}></div>

            <div className="user-stats">
              <h3>{t.userProjects} ({projects.length})</h3>
              {projects.length > 0 ? (
                <div className="projects-grid">
                  {projects.map(project => (
                    <div key={project.id} className="project-card">
                      {project.image_url && <img src={project.image_url} alt={project.title} className="project-image" />}
                      <div className="project-header">
                        <div>
                          <h4 className="project-title">{project.title}</h4>
                          {project.is_official && <span className="official-badge" style={{ fontSize: '10px', color: '#ffd700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Star size={12} /> {t.official}</span>}
                        </div>
                      </div>
                      {project.description && <div className="project-description">{project.description}</div>}
                      {project.language && (
                        <div className="project-language">
                          <strong>{language === 'en' ? 'Language:' : 'اللغة:'}</strong> {project.language}
                        </div>
                      )}
                      <div className="project-footer">
                        <button className="retro-button download-btn" onClick={() => handleDownload(project.id, project.download_link)}>
                          <Download size={16} /> {t.downloadBtn}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-projects">{t.noProjects}</div>
              )}
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

export default ProfileViewPage;
