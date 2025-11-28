import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { uploadImage } from '../lib/imageUpload';
import { Plus, Download, Trash2, Star, Copy, Crown, Building2, Gem, CheckCircle, Laptop } from 'lucide-react';
import { Profile, Project, Message } from '../types';
import { copyProjectUrl } from '../utils/profileUrl';

interface ProjectsPageProps {
  user: any;
  profile: Profile | null;
  language: 'en' | 'ar';
  t: any;
}

const ProjectsPage: React.FC<ProjectsPageProps> = ({ user, profile, language, t }) => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const projectImageInputRef = useRef<HTMLInputElement>(null);

  const [projectForm, setProjectForm] = useState({
    title: '',
    description: '',
    language: '',
    download_link: '',
    image_url: '',
    project_type: 'public' as 'public' | 'vip' | 'mason'
  });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
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
        .or('project_type.is.null,project_type.eq.public')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!user) return;

    setUploading(true);
    try {
      const imageUrl = await uploadImage(file, 'project-images', user.id);
      if (imageUrl) {
        setProjectForm(prev => ({ ...prev, image_url: imageUrl }));
        setMessage({ type: 'success', text: 'Image uploaded successfully!' });
        setTimeout(() => setMessage(null), 2000);
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setUploading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          title: projectForm.title,
          description: projectForm.description,
          language: projectForm.language,
          download_link: projectForm.download_link,
          image_url: projectForm.image_url,
          project_type: projectForm.project_type,
          is_official: ['admin', 'developer', 'mason_official'].includes(profile?.user_rank || '')
        });

      if (error) throw error;

      await loadProjects();
      setProjectForm({
        title: '',
        description: '',
        language: '',
        download_link: '',
        image_url: '',
        project_type: 'public'
      });
      setShowCreateProject(false);
      setMessage({ type: 'success', text: 'Project created!' });
      setTimeout(() => setMessage(null), 2000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
      setTimeout(() => setMessage(null), 3000);
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
      await loadProjects();
      setMessage({ type: 'success', text: 'Project deleted!' });
      setTimeout(() => setMessage(null), 2000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleDownload = async (projectId: string, downloadLink: string) => {
    try {
      await supabase.rpc('increment_download_count', { project_id: projectId });
      window.open(downloadLink, '_blank');
      await loadProjects();
    } catch (error) {
      console.error('Error handling download:', error);
    }
  };

  const handleCopyProjectUrl = async (projectId: string) => {
    try {
      await copyProjectUrl(projectId);
      setMessage({ type: 'success', text: t.urlCopied || 'URL copied!' });
      setTimeout(() => setMessage(null), 2000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to copy URL' });
    }
  };

  const canDeleteProject = (project: Project): boolean => {
    if (!user || !profile) return false;
    return project.user_id === user.id || ['admin', 'developer'].includes(profile.user_rank || '');
  };

  const getVerificationBadge = (userProfile: Profile) => {
    if (!userProfile.is_verified && userProfile.user_rank === 'member') return null;

    const badges = {
      admin: <Crown size={14} style={{ color: '#ffd700' }} />,
      developer: <Laptop size={14} style={{ color: '#00ff00' }} />,
      mason_official: <Building2 size={14} style={{ color: '#00bfff' }} />,
      vip: <Gem size={14} style={{ color: '#ff00ff' }} />,
      member: userProfile.is_verified ? <CheckCircle size={14} style={{ color: '#00ff00' }} /> : null
    };

    const badge = badges[userProfile.user_rank || 'member'];
    return badge ? <span title={t.verified}>{badge}</span> : null;
  };

  const filteredProjects = projects.filter(project =>
    project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.profiles?.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="retro-window">
        <div className="window-header">
          <span>{t.projects}</span>
        </div>
        <div className="window-content">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div className="terminal-text blink">{t.loading}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="retro-window">
        <div className="window-header">
          <span>{t.projects}</span>
          <div className="window-buttons">
            <div className="window-button minimize">_</div>
            <div className="window-button maximize">□</div>
            <div className="window-button close">×</div>
          </div>
        </div>
        <div className="window-content">
          <div className="projects-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
            <h3>{t.projects} ({filteredProjects.length})</h3>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <input
                type="text"
                className="form-input"
                placeholder={language === 'en' ? 'Search projects...' : 'ابحث عن مشروع...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '200px' }}
              />
              {user && (
                <button className="retro-button primary" onClick={() => setShowCreateProject(true)}>
                  <Plus size={16} /> {t.createProject}
                </button>
              )}
            </div>
          </div>

          {showCreateProject && (
            <div className="project-form" style={{ marginBottom: '30px', padding: '20px', border: '2px solid #00ff00', background: 'rgba(0,255,0,0.05)' }}>
              <h4>{t.createProject}</h4>
              <form onSubmit={handleCreateProject}>
                <div className="form-group">
                  <label className="form-label">{t.projectTitle}</label>
                  <input type="text" className="form-input" value={projectForm.title} onChange={(e) => setProjectForm(prev => ({ ...prev, title: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">{t.projectDescription} <span style={{ fontSize: '11px', opacity: 0.7 }}>({projectForm.description.length}/200)</span></label>
                  <textarea
                    className="form-textarea"
                    value={projectForm.description}
                    onChange={(e) => {
                      if (e.target.value.length <= 200) {
                        setProjectForm(prev => ({ ...prev, description: e.target.value }));
                      }
                    }}
                    rows={3}
                    maxLength={200}
                    placeholder={language === 'en' ? 'Brief description (max 200 characters)' : 'وصف مختصر (حد أقصى 200 حرف)'}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t.projectLanguage}</label>
                  <input type="text" className="form-input" value={projectForm.language} onChange={(e) => setProjectForm(prev => ({ ...prev, language: e.target.value }))} placeholder="JavaScript, Python, etc." />
                </div>
                <div className="form-group">
                  <label className="form-label">{t.downloadLink}</label>
                  <input type="url" className="form-input" value={projectForm.download_link} onChange={(e) => setProjectForm(prev => ({ ...prev, download_link: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">{t.projectImage}</label>
                  <input type="file" ref={projectImageInputRef} accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                  }} className="form-input" />
                  {projectForm.image_url && <img src={projectForm.image_url} alt="Preview" style={{ width: '100px', marginTop: '8px' }} />}
                </div>
                {profile && ['admin', 'mason_official', 'developer'].includes(profile.user_rank || '') && (
                  <div className="form-group">
                    <label className="form-label">
                      {language === 'en' ? 'Project Type' : 'نوع المشروع'}
                    </label>
                    <select
                      className="form-input"
                      value={projectForm.project_type}
                      onChange={(e) => setProjectForm(prev => ({ ...prev, project_type: e.target.value as 'public' | 'vip' | 'mason' }))}
                    >
                      <option value="public">{language === 'en' ? '🌍 Public' : '🌍 عام'}</option>
                      <option value="vip">{language === 'en' ? 'VIP' : 'VIP'}</option>
                      {['admin', 'mason_official', 'developer'].includes(profile.user_rank || '') && (
                        <option value="mason">{language === 'en' ? 'Mason' : 'فريق الماسون'}</option>
                      )}
                    </select>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="submit" className="retro-button primary" disabled={uploading}>
                    {uploading ? 'Uploading...' : t.createBtn}
                  </button>
                  <button type="button" className="retro-button" onClick={() => setShowCreateProject(false)}>{t.cancel}</button>
                </div>
              </form>
            </div>
          )}

          <div className="projects-grid">
            {filteredProjects.length > 0 ? filteredProjects.map(project => (
              <div key={project.id} className="project-card">
                {project.image_url && <img src={project.image_url} alt={project.title} className="project-image" />}
                <div className="project-header">
                  <div>
                    <h4 className="project-title">{project.title}</h4>
                    {project.is_official && <span style={{ fontSize: '10px', color: '#ffd700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Star size={12} /> {t.official}</span>}
                    {project.featured && <Star className="featured-star" size={16} style={{ color: '#ffd700' }} />}
                  </div>
                  {canDeleteProject(project) && (
                    <button className="delete-btn" onClick={() => handleDeleteProject(project.id)}>
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
                <div className="project-author" style={{ cursor: 'pointer' }} onClick={() => navigate(`/user/${project.profiles?.username}`)}>
                  {language === 'en' ? 'by' : 'بواسطة'} {project.profiles?.display_name || project.profiles?.username} {project.profiles && getVerificationBadge(project.profiles)}
                </div>
                {project.description && (
                  <div className="project-description">
                    {project.description.length > 100 ? `${project.description.substring(0, 100)}...` : project.description}
                    {project.description.length > 100 && (
                      <button className="retro-button secondary" style={{ marginTop: '8px', padding: '4px 8px', fontSize: '10px' }} onClick={() => navigate(`/project/${project.id}`)}>
                        {language === 'en' ? 'View Full' : 'عرض كامل'}
                      </button>
                    )}
                  </div>
                )}
                {project.language && (
                  <div className="project-language">
                    <strong>{language === 'en' ? 'Language:' : 'اللغة:'}</strong> {project.language}
                  </div>
                )}
                <div className="project-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                  <button className="retro-button download-btn" onClick={() => handleDownload(project.id, project.download_link)}>
                    <Download size={16} /> {t.downloadBtn}
                  </button>
                  <button className="retro-button secondary" style={{ padding: '5px 10px', fontSize: '10px' }} onClick={() => handleCopyProjectUrl(project.id)}>
                    <Copy size={12} />
                  </button>
                </div>
              </div>
            )) : (
              <div className="no-projects">{searchTerm ? (language === 'en' ? 'No projects found' : 'لا توجد مشاريع') : t.noProjects}</div>
            )}
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

export default ProjectsPage;
