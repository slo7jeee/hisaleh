import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Download, User, Calendar, Code, ArrowLeft, Crown, Building2, Gem, Laptop, Star } from 'lucide-react';
import { Project, Profile, Message } from '../types';

interface ProjectViewPageProps {
  user: any;
  profile: Profile | null;
  language: 'en' | 'ar';
  t: any;
}

const ProjectViewPage: React.FC<ProjectViewPageProps> = ({ user, profile, language, t }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<Message | null>(null);

  useEffect(() => {
    if (id) {
      loadProject();
    }
  }, [id]);

  const loadProject = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          profiles:user_id (
            username,
            display_name,
            user_rank,
            is_verified,
            avatar_url
          )
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setProject(null);
        setLoading(false);
        return;
      }

      setProject(data);
    } catch (error) {
      console.error('Error loading project:', error);
      setProject(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!project) return;

    try {
      const { error } = await supabase.rpc('increment_download_count', {
        project_id: project.id
      });

      if (error) throw error;

      window.open(project.download_link, '_blank');
      await loadProject();
    } catch (error) {
      console.error('Error handling download:', error);
    }
  };

  const getVerificationBadge = () => {
    if (!project?.profiles) return null;

    const badges: { [key: string]: string } = {
      admin: <Crown size={14} style={{ color: '#ffd700' }} />,
      developer: <Laptop size={14} style={{ color: '#00ff00' }} />,
      mason_official: <Building2 size={14} style={{ color: '#00bfff' }} />,
      vip: <Gem size={14} style={{ color: '#ff00ff' }} />
    };

    const badge = badges[project.profiles.user_rank || 'member'];
    return badge ? <span title={t.verified}>{badge}</span> : null;
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

  if (!project) {
    return (
      <div className="retro-window">
        <div className="window-header">
          <span>{language === 'en' ? 'Project Not Found' : 'المشروع غير موجود'}</span>
        </div>
        <div className="window-content">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>{language === 'en' ? 'This project does not exist' : 'هذا المشروع غير موجود'}</p>
            <button className="retro-button primary" onClick={() => navigate('/projects')}>
              {language === 'en' ? 'Back to Projects' : 'العودة للمشاريع'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {message && (
        <div className={`notification ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="retro-window">
        <div className="window-header">
          <span>{project.title}</span>
          <div className="window-buttons">
            <div className="window-button close" onClick={() => navigate(-1)}>×</div>
          </div>
        </div>
        <div className="window-content">
          <button className="retro-button secondary" onClick={() => navigate(-1)} style={{ marginBottom: '20px' }}>
            <ArrowLeft size={16} /> {language === 'en' ? 'Back' : 'رجوع'}
          </button>

          {project.image_url && (
            <div style={{
              width: '100%',
              maxHeight: '400px',
              overflow: 'hidden',
              borderRadius: '4px',
              border: '2px solid #00ff00',
              marginBottom: '20px'
            }}>
              <img src={project.image_url} alt={project.title} style={{ width: '100%', height: 'auto', display: 'block' }} />
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ marginBottom: '15px', fontSize: '24px' }}>{project.title}</h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', cursor: 'pointer' }} onClick={() => navigate(`/user/${project.profiles?.username}`)}>
              <div className="profile-avatar" style={{ width: '32px', height: '32px' }}>
                {project.profiles?.avatar_url ? (
                  <img src={project.profiles.avatar_url} alt={project.profiles.username} style={{ width: '100%', height: '100%', borderRadius: '4px', objectFit: 'cover' }} />
                ) : (
                  <User size={20} />
                )}
              </div>
              <span style={{ color: '#00ff00' }}>
                {project.profiles?.display_name || project.profiles?.username} {getVerificationBadge()}
              </span>
            </div>

            {project.language && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <Code size={16} />
                <span><strong>{language === 'en' ? 'Language:' : 'اللغة:'}</strong> {project.language}</span>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <Calendar size={16} />
              <span><strong>{language === 'en' ? 'Created:' : 'تاريخ الإنشاء:'}</strong> {new Date(project.created_at || '').toLocaleDateString()}</span>
            </div>

            {project.is_official && (
              <div style={{
                padding: '8px 12px',
                background: 'rgba(255,215,0,0.1)',
                border: '1px solid #ffd700',
                borderRadius: '4px',
                display: 'inline-block',
                marginBottom: '15px'
              }}>
                <span style={{ color: '#ffd700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Star size={14} /> {t.official}</span>
              </div>
            )}
          </div>

          <div className="separator" style={{ margin: '20px 0' }}></div>

          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ marginBottom: '10px' }}>{language === 'en' ? 'Description' : 'الوصف'}</h3>
            <div style={{
              background: 'rgba(0,255,0,0.05)',
              border: '1px solid rgba(0,255,0,0.3)',
              padding: '15px',
              borderRadius: '4px',
              whiteSpace: 'pre-wrap',
              lineHeight: '1.6'
            }}>
              {project.description || (language === 'en' ? 'No description provided' : 'لا يوجد وصف')}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="retro-button primary" onClick={handleDownload}>
              <Download size={16} /> {t.downloadBtn}
            </button>
            <button className="retro-button secondary" onClick={() => navigate(`/user/${project.profiles?.username}`)}>
              <User size={16} /> {language === 'en' ? 'View Author' : 'عرض المؤلف'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProjectViewPage;
