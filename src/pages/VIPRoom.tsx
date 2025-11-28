import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { User, Download, Lock, Trash2 } from 'lucide-react';
import { Profile, Project, Message } from '../types';

interface VIPRoomProps {
  user: any;
  profile: Profile | null;
  language: 'en' | 'ar';
  t: any;
}

const VIPRoom: React.FC<VIPRoomProps> = ({ user, profile, language, t }) => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<Message | null>(null);

  const hasAccess = profile && ['admin', 'vip', 'mason_official', 'developer'].includes(profile.user_rank || '');

  useEffect(() => {
    if (hasAccess) {
      loadVIPProjects();
    } else {
      setLoading(false);
    }
  }, [hasAccess]);

  const loadVIPProjects = async () => {
    try {
      const { data, error } = await supabase
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
        .eq('project_type', 'vip')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error loading VIP projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (projectId: string, downloadLink: string) => {
    try {
      const { error } = await supabase.rpc('increment_download_count', {
        project_id: projectId
      });

      if (error) throw error;

      window.open(downloadLink, '_blank');
      loadVIPProjects();
    } catch (error) {
      console.error('Error handling download:', error);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!user) return;

    if (!confirm(language === 'en' ? 'Delete this project?' : 'حذف هذا المشروع؟')) return;

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;
      await loadVIPProjects();
      setMessage({ type: 'success', text: language === 'en' ? 'Project deleted!' : 'تم حذف المشروع!' });
      setTimeout(() => setMessage(null), 2000);
    } catch (error: any) {
      console.error('Error deleting project:', error);
      setMessage({ type: 'error', text: error.message });
      setTimeout(() => setMessage(null), 3000);
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

  if (!user) {
    return (
      <div className="retro-window">
        <div className="window-header">
          <span>VIP</span>
        </div>
        <div className="window-content">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Lock size={48} style={{ marginBottom: '20px', opacity: 0.5 }} />
            <h3>{language === 'en' ? 'Login Required' : 'يتطلب تسجيل الدخول'}</h3>
            <p style={{ marginBottom: '20px' }}>
              {language === 'en'
                ? 'Please login to access VIP content'
                : 'يرجى تسجيل الدخول للوصول إلى محتوى VIP'}
            </p>
            <button className="retro-button primary" onClick={() => navigate('/login')}>
              {t.login}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="retro-window">
        <div className="window-header">
          <span>VIP Room</span>
          <div className="window-buttons">
            <div className="window-button close" onClick={() => navigate('/')}>×</div>
          </div>
        </div>
        <div className="window-content">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Lock size={64} style={{ marginBottom: '20px', color: '#ffd700' }} />
            <h2 style={{ color: '#ffd700', marginBottom: '15px' }}>
              {language === 'en' ? 'VIP Access Required' : 'يتطلب وصول VIP'}
            </h2>
            <p style={{ marginBottom: '20px', fontSize: '14px' }}>
              {language === 'en'
                ? 'This exclusive room is only accessible to VIP members, Mason Officials, Developers, and Admins.'
                : 'هذه الغرفة الحصرية متاحة فقط لأعضاء VIP والماسون الرسميين والمطورين والمدراء.'}
            </p>
            <div className="info-section" style={{ padding: '20px', border: '2px solid #ffd700', background: 'rgba(255,215,0,0.05)', marginTop: '20px' }}>
              <h3 style={{ color: '#ffd700', marginBottom: '10px' }}>
                {language === 'en' ? 'How to get VIP access?' : 'كيف تحصل على وصول VIP؟'}
              </h3>
              <p style={{ fontSize: '13px', lineHeight: '1.6' }}>
                {language === 'en'
                  ? 'Contact an administrator to upgrade your account to VIP status and unlock exclusive content, projects, and features.'
                  : 'تواصل مع المدير لترقية حسابك إلى حالة VIP وفتح المحتوى والمشاريع والميزات الحصرية.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="retro-window">
      <div className="window-header">
        <span>VIP</span>
        <div className="window-buttons">
          <div className="window-button minimize">_</div>
          <div className="window-button maximize">□</div>
          <div className="window-button close" onClick={() => navigate('/')}>×</div>
        </div>
      </div>
      <div className="window-content">
        <div className="terminal-section" style={{ marginBottom: '20px' }}>
          <div className="terminal-title">VIP EXCLUSIVE CONTENT</div>
          <div className="terminal-line">
            {language === 'en'
              ? '> Welcome to the VIP Room - Exclusive content for premium members'
              : '> مرحباً في غرفة VIP - محتوى حصري للأعضاء المميزين'}
          </div>
          <div className="terminal-line">
            {language === 'en'
              ? `> Access Level: ${profile?.user_rank?.toUpperCase()}`
              : `> مستوى الوصول: ${t[profile?.user_rank || 'member']}`}
          </div>
        </div>

        <h3 style={{ marginBottom: '20px' }}>
          {language === 'en' ? 'VIP Projects' : 'مشاريع VIP'} ({projects.length})
        </h3>

        {projects.length > 0 ? (
          <div className="projects-grid">
            {projects.map(project => (
              <div key={project.id} className="project-card" style={{ border: '2px solid #ffd700', background: 'rgba(255,215,0,0.05)' }}>
                {project.image_url && <img src={project.image_url} alt={project.title} className="project-image" />}
                <div className="project-header">
                  <div>
                    <h4 className="project-title">{project.title}</h4>
                    <div className="project-author" onClick={() => navigate(`/user/${project.profiles?.username}`)}>
                      {language === 'en' ? 'By' : 'بواسطة'} @{project.profiles?.username}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '20px' }}></span>
                    {(profile?.user_rank === 'admin' || project.user_id === user?.id) && (
                      <button className="delete-btn" onClick={() => handleDeleteProject(project.id)}>
                        <Trash2 size={12} />
                      </button>
                    )}
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
          <div className="no-projects" style={{ textAlign: 'center', padding: '40px', border: '2px dashed #ffd700', borderRadius: '8px', background: 'rgba(255,215,0,0.05)' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}></div>
            <h3 style={{ marginBottom: '15px' }}>
              {language === 'en' ? 'No VIP Projects Yet' : 'لا توجد مشاريع VIP بعد'}
            </h3>
            <p style={{ opacity: 0.7, marginBottom: '20px' }}>
              {language === 'en'
                ? 'VIP projects will appear here. Only Admin, Mason Officials, and Developers can upload VIP content.'
                : 'مشاريع VIP ستظهر هنا. فقط الأدمن والماسون والمطورين يمكنهم رفع محتوى VIP.'}
            </p>
            {profile && ['admin', 'mason_official', 'developer'].includes(profile.user_rank || '') && (
              <button className="retro-button primary" onClick={() => navigate('/projects')}>
                {language === 'en' ? 'Upload VIP Project' : 'رفع مشروع VIP'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VIPRoom;
