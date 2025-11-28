import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { User, Eye, Settings, Crown, Building2, Gem, CheckCircle, Laptop } from 'lucide-react';
import { Profile } from '../types';

interface MembersPageProps {
  user: any;
  profile: Profile | null;
  language: 'en' | 'ar';
  t: any;
  onSelectProfile?: (profile: Profile) => void;
}

const MembersPage: React.FC<MembersPageProps> = ({ user, profile, language, t, onSelectProfile }) => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error loading profiles:', error);
    } finally {
      setLoading(false);
    }
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
    return badge ? <span title={t.verified} style={{ display: 'inline-flex', alignItems: 'center' }}>{badge}</span> : null;
  };

  const filteredProfiles = profiles.filter(p => {
    const matchesSearch = p.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.display_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="retro-window">
        <div className="window-header">
          <span>{t.membersTitle}</span>
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
        <span>{t.membersTitle}</span>
        <div className="window-buttons">
          <div className="window-button minimize">_</div>
          <div className="window-button maximize">□</div>
          <div className="window-button close">×</div>
        </div>
      </div>
      <div className="window-content">
        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <h3>{t.membersTitle} ({filteredProfiles.length})</h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input
              type="text"
              className="form-input"
              placeholder={language === 'en' ? 'Search members...' : 'ابحث عن عضو...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '250px' }}
            />
          </div>
        </div>

        <div className="profiles-grid">
          {filteredProfiles.length > 0 ? filteredProfiles.map(memberProfile => (
            <div key={memberProfile.id} className="profile-card">
              <div className="profile-header">
                <div className="profile-avatar" style={{ cursor: 'pointer' }} onClick={() => navigate(`/user/${memberProfile.username}`)}>
                  {memberProfile.avatar_url ? (
                    <img src={memberProfile.avatar_url} alt={memberProfile.username} style={{ width: '48px', height: '48px', borderRadius: '4px', objectFit: 'cover' }} />
                  ) : (
                    <User size={32} />
                  )}
                </div>
                <div className="profile-info">
                  <h3 style={{ cursor: 'pointer' }} onClick={() => navigate(`/user/${memberProfile.username}`)}>
                    {memberProfile.display_name || memberProfile.username}
                  </h3>
                  <div className="profile-rank">{t[memberProfile.user_rank || 'member']} {getVerificationBadge(memberProfile)}</div>
                  {memberProfile.mason_badge && (
                    <div className="mason-badge" style={{ fontSize: '10px', padding: '2px 8px', background: 'rgba(0,255,0,0.1)', borderRadius: '3px', marginTop: '5px' }}>
                      {memberProfile.mason_badge}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <button className="retro-button" onClick={() => navigate(`/user/${memberProfile.username}`)}>
                    <Eye size={12} /> {t.visit}
                  </button>
                  {profile?.user_rank === 'admin' && memberProfile.id !== user?.id && (
                    <button className="retro-button secondary" onClick={() => onSelectProfile && onSelectProfile(memberProfile)}>
                      <Settings size={12} /> {t.manage}
                    </button>
                  )}
                </div>
              </div>
              {memberProfile.bio && <div className="profile-bio" style={{ marginTop: '10px', fontSize: '12px', opacity: 0.8 }}>{memberProfile.bio}</div>}
              <div className="profile-date" style={{ marginTop: '10px', fontSize: '11px', opacity: 0.6 }}>
                {t.joinedOn}: {new Date(memberProfile.created_at || '').toLocaleDateString()}
              </div>
            </div>
          )) : (
            <div className="no-projects">{searchTerm ? (language === 'en' ? 'No members found' : 'لا يوجد أعضاء') : t.noMembers}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MembersPage;
