import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { User, Eye, Building, Crown, Building2, Gem, CheckCircle, Laptop } from 'lucide-react';
import { Profile } from '../types';

interface MasonPageProps {
  user: any;
  profile: Profile | null;
  language: 'en' | 'ar';
  t: any;
}

const MasonPage: React.FC<MasonPageProps> = ({ user, profile, language, t }) => {
  const navigate = useNavigate();
  const [masonMembers, setMasonMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadMasonMembers();
  }, []);

  const loadMasonMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('user_rank', ['admin', 'developer', 'mason_official'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMasonMembers(data || []);
    } catch (error) {
      console.error('Error loading mason members:', error);
    } finally {
      setLoading(false);
    }
  };

  const getVerificationBadge = (userProfile: Profile) => {
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

  const filteredMembers = masonMembers.filter(p => {
    const matchesSearch = p.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.display_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

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

  return (
    <div className="retro-window">
      <div className="window-header">
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Building2 size={18} /> {t.masonTitle}</span>
        <div className="window-buttons">
          <div className="window-button minimize">_</div>
          <div className="window-button maximize">□</div>
          <div className="window-button close">×</div>
        </div>
      </div>
      <div className="window-content">
        <div className="terminal-section" style={{ marginBottom: '20px' }}>
          <div className="terminal-title">{language === 'en' ? 'MASON HIERARCHY' : 'التسلسل الهرمي للماسون'}</div>
          <div className="terminal-line">
            {language === 'en'
              ? '> Admins - Full system control and authority'
              : '> المدراء - سيطرة كاملة على النظام'}
          </div>
          <div className="terminal-line">
            {language === 'en'
              ? '> Developers'
              : '> المطورين'}
          </div>
          <div className="terminal-line">
            {language === 'en'
              ? '> Mason Team - Trusted community leaders'
              : '> فريق الماسونية - قادة المجتمع الموثوقون'}
          </div>
        </div>

        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <h3>{t.masonTitle} ({filteredMembers.length})</h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input
              type="text"
              className="form-input"
              placeholder={language === 'en' ? 'Search mason members...' : 'ابحث عن أعضاء الماسون...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '250px' }}
            />
          </div>
        </div>

        {filteredMembers.length > 0 ? (
          <div className="profiles-grid">
            {filteredMembers.map(masonProfile => (
              <div key={masonProfile.id} className="profile-card" style={{ border: '2px solid #ffd700', background: 'rgba(255, 215, 0, 0.05)' }}>
                <div className="profile-header">
                  <div className="profile-avatar" style={{ cursor: 'pointer' }} onClick={() => navigate(`/user/${masonProfile.username}`)}>
                    {masonProfile.avatar_url ? (
                      <img src={masonProfile.avatar_url} alt={masonProfile.username} style={{ width: '48px', height: '48px', borderRadius: '4px', objectFit: 'cover' }} />
                    ) : (
                      <User size={32} />
                    )}
                  </div>
                  <div className="profile-info">
                    <h3 style={{ cursor: 'pointer' }} onClick={() => navigate(`/user/${masonProfile.username}`)}>
                      {masonProfile.display_name || masonProfile.username}
                    </h3>
                    <div className="profile-rank" style={{ color: '#ffd700' }}>
                      {t[masonProfile.user_rank || 'member']} {getVerificationBadge(masonProfile)}
                    </div>
                    {masonProfile.mason_badge && (
                      <div className="mason-badge" style={{ fontSize: '10px', padding: '2px 8px', background: 'rgba(255,215,0,0.2)', borderRadius: '3px', marginTop: '5px', color: '#ffd700' }}>
                        {masonProfile.mason_badge}
                      </div>
                    )}
                  </div>
                  <button className="retro-button secondary" onClick={() => navigate(`/user/${masonProfile.username}`)}>
                    <Eye size={12} /> {t.visit}
                  </button>
                </div>
                {masonProfile.bio && (
                  <div className="profile-bio" style={{ marginTop: '10px', fontSize: '12px', opacity: 0.8 }}>
                    {masonProfile.bio}
                  </div>
                )}
                <div className="profile-date" style={{ marginTop: '10px', fontSize: '11px', opacity: 0.6 }}>
                  {t.joinedOn}: {new Date(masonProfile.created_at || '').toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-projects">
            {searchTerm
              ? (language === 'en' ? 'No mason members found' : 'لا يوجد أعضاء ماسون')
              : (language === 'en' ? 'No mason members yet' : 'لا يوجد أعضاء ماسون بعد')}
          </div>
        )}

        <div className="separator" style={{ margin: '30px 0' }}></div>

        <div className="info-section" style={{ padding: '20px', border: '2px solid #ffd700', background: 'rgba(255,215,0,0.05)' }}>
          <h3 style={{ color: '#ffd700', marginBottom: '15px' }}>
            <Building size={20} style={{ display: 'inline', marginRight: '8px' }} />
            {language === 'en' ? 'About Mason' : 'عن الماسون'}
          </h3>
          <p style={{ fontSize: '13px', lineHeight: '1.6', opacity: 0.9 }}>
            {language === 'en'
              ? 'The Mason hierarchy represents the leadership and core team of Mason Team. These members have special privileges and responsibilities to maintain, develop, and guide the community. They are trusted individuals who help shape the platform and ensure a positive experience for all members.'
              : 'التسلسل الهرمي للماسون يمثل القيادة والفريق الأساسي لـ Mason Team. هؤلاء الأعضاء لديهم امتيازات ومسؤوليات خاصة للحفاظ على المنصة وتطويرها وتوجيه المجتمع. هم أفراد موثوقون يساعدون في تشكيل المنصة وضمان تجربة إيجابية لجميع الأعضاء.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MasonPage;
