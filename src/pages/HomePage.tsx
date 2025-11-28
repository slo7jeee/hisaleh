import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Profile } from '../types';
import { CheckCircle, Star } from 'lucide-react';

interface HomePageProps {
  user: any;
  profile: Profile | null;
  language: 'en' | 'ar';
  t: any;
}

const HomePage: React.FC<HomePageProps> = ({ user, profile, language, t }) => {
  const navigate = useNavigate();

  return (
    <div className="retro-window">
      <div className="window-header">
        <span>MasonHub - {language === 'en' ? 'Rock Collectors Community' : 'مجتمع هواة جمع الأحجار'}</span>
        <div className="window-buttons">
          <div className="window-button minimize">_</div>
          <div className="window-button maximize">□</div>
          <div className="window-button close">×</div>
        </div>
      </div>
      <div className="window-content">
        <div className="terminal-section">
          <div className="terminal-title">{language === 'en' ? 'WELCOME TO MASONHUB' : 'مرحباً بك في MasonHub'}</div>
          <div className="terminal-line">{language === 'en' ? '> Initializing rock collectors community platform...' : '> جاري تهيئة منصة مجتمع هواة جمع الأحجار...'}</div>
          <div className="terminal-line">{language === 'en' ? '> Loading member profiles and projects...' : '> جاري تحميل ملفات الأعضاء والمشاريع...'}</div>
          <div className="terminal-line">{language === 'en' ? '> System ready. Welcome to the community!' : '> النظام جاهز. مرحباً بك في المجتمع!'}</div>
        </div>

        {user && profile && (
          <div className="user-info">
            <h3>{language === 'en' ? 'Welcome back' : 'مرحباً بعودتك'}, {profile.display_name || profile.username}!</h3>
            <div className="user-details">
              <p><strong>{language === 'en' ? 'Rank' : 'الرتبة'}:</strong> {t[profile.user_rank || 'member']}</p>
              {profile.mason_badge && (
                <p><strong>{language === 'en' ? 'Badge' : 'الشارة'}:</strong> {profile.mason_badge}</p>
              )}
              {profile.is_verified && (
                <p className="verified-text" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><CheckCircle size={14} /> {t.verified}</p>
              )}
            </div>
            <div style={{ marginTop: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button className="retro-button primary" onClick={() => navigate('/projects')}>
                {language === 'en' ? 'Browse Projects' : 'تصفح المشاريع'}
              </button>
              <button className="retro-button secondary" onClick={() => navigate('/members')}>
                {language === 'en' ? 'View Members' : 'عرض الأعضاء'}
              </button>
              <button className="retro-button" onClick={() => navigate(`/user/${profile.username}`)}>
                {language === 'en' ? 'My Profile' : 'ملفي الشخصي'}
              </button>
            </div>
          </div>
        )}

        {!user && (
          <div className="guest-info">
            <h3>{language === 'en' ? 'Welcome to MasonHub' : 'مرحباً بك في MasonHub'}</h3>
            <p>{language === 'en'
              ? 'Join our community of rock and mineral collectors. Share your projects and connect with fellow enthusiasts!'
              : 'انضم إلى مجتمعنا من هواة جمع الأحجار والمعادن. شارك مشاريعك وتواصل مع المهتمين!'}</p>
            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
              <button className="retro-button primary" onClick={() => navigate('/login')}>
                {language === 'en' ? 'Get Started' : 'ابدأ الآن'}
              </button>
              <button className="retro-button secondary" onClick={() => navigate('/projects')}>
                {language === 'en' ? 'Browse Projects' : 'تصفح المشاريع'}
              </button>
            </div>
          </div>
        )}

        <div className="separator" style={{ margin: '30px 0' }}></div>

        <div className="features-section">
          <h3>{language === 'en' ? 'Platform Features' : 'مميزات المنصة'}</h3>
          <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginTop: '20px' }}>
            <div className="feature-card" style={{ padding: '15px', border: '2px solid #00ff00', background: 'rgba(0, 255, 0, 0.05)' }}>
              <h4 style={{ color: '#00ff00', marginBottom: '10px' }}>📦 {language === 'en' ? 'Share Projects' : 'مشاركة المشاريع'}</h4>
              <p style={{ fontSize: '12px', opacity: 0.8 }}>
                {language === 'en'
                  ? 'Upload and share your rock collection projects with the community'
                  : 'ارفع وشارك مشاريع مجموعتك من الأحجار مع المجتمع'}
              </p>
            </div>
            <div className="feature-card" style={{ padding: '15px', border: '2px solid #00ff00', background: 'rgba(0, 255, 0, 0.05)' }}>
              <h4 style={{ color: '#00ff00', marginBottom: '10px' }}>👥 {language === 'en' ? 'Community' : 'المجتمع'}</h4>
              <p style={{ fontSize: '12px', opacity: 0.8 }}>
                {language === 'en'
                  ? 'Connect with fellow collectors and enthusiasts worldwide'
                  : 'تواصل مع هواة جمع الأحجار والمهتمين حول العالم'}
              </p>
            </div>
            <div className="feature-card" style={{ padding: '15px', border: '2px solid #00ff00', background: 'rgba(0, 255, 0, 0.05)' }}>
              <h4 style={{ color: '#00ff00', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}><Star size={16} /> {language === 'en' ? 'Ranking System' : 'نظام الرتب'}</h4>
              <p style={{ fontSize: '12px', opacity: 0.8 }}>
                {language === 'en'
                  ? 'Earn ranks and badges as you contribute to the community'
                  : 'احصل على رتب وشارات مع مساهمتك في المجتمع'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
