import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation, Routes, Route } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { User, Settings, LogOut, Building2 } from 'lucide-react';
import { Profile, Message } from './types';
import HomePage from './pages/HomePage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectViewPage from './pages/ProjectViewPage';
import MembersPage from './pages/MembersPage';
import ProfileViewPage from './pages/ProfileViewPage';
import MyProfilePage from './pages/MyProfilePage';
import AuthPage from './pages/AuthPage';
import MasonPage from './pages/MasonPage';
import AdminPanel from './pages/AdminPanel';
import VIPRoom from './pages/VIPRoom';
import MasonRoom from './pages/MasonRoom';
import RulesPage from './pages/RulesPage';
import AnnouncementsPage from './pages/AnnouncementsPage';

const translations = {
  en: {
    home: 'Home',
    projects: 'Projects',
    members: 'Members',
    rules: 'Rules',
    announcements: 'Announcements',
    mason: 'Mason Team',
    vipProjects: 'VIP Projects',
    masonProjects: 'Mason Projects',
    profile: 'Profile',
    adminPanel: 'Admin Panel',
    logout: 'Logout',
    login: 'Login',
    loginTitle: 'Login to MasonHub',
    registerTitle: 'Join MasonHub',
    email: 'Email',
    password: 'Password',
    username: 'Username',
    loginBtn: 'Login',
    registerBtn: 'Register',
    displayName: 'Display Name',
    bio: 'Bio',
    backgroundImage: 'Background Image',
    backgroundColor: 'Background Color',
    socialLinks: 'Social Links',
    platform: 'Platform',
    url: 'URL',
    addLink: 'Add Link',
    saveProfile: 'Save Profile',
    createProject: 'Create Project',
    projectTitle: 'Project Title',
    projectDescription: 'Description',
    projectLanguage: 'Programming Language',
    downloadLink: 'Download Link',
    projectImage: 'Project Image',
    uploadImage: 'Upload Image',
    createBtn: 'Create',
    downloadBtn: 'Download',
    deleteBtn: 'Delete',
    membersTitle: 'Community Members',
    masonTitle: 'Mason Members',
    joinedOn: 'Joined',
    visit: 'Visit',
    manage: 'Manage',
    promoteToAdmin: 'Promote to Admin',
    promoteToMason: 'Promote to Mason',
    promoteToDeveloper: 'Promote to Developer',
    promoteToVip: 'Promote to VIP',
    demoteToMember: 'Demote to Member',
    verifyUser: 'Verify User',
    unverifyUser: 'Unverify User',
    banUser: 'Ban User',
    unbanUser: 'Unban User',
    deleteUser: 'Delete User',
    editEmail: 'Edit Email',
    banDays: 'Ban Days',
    admin: 'Admin',
    developer: 'Developer',
    mason_official: 'Mason Team',
    vip: 'VIP',
    member: 'Member',
    verified: 'Verified',
    official: 'Official',
    featured: 'Featured',
    downloads: 'Downloads',
    captchaTitle: 'Security Verification',
    captchaPlaceholder: 'Enter the code above',
    refreshCaptcha: 'Refresh',
    loading: 'Loading...',
    noProjects: 'No projects found',
    noMembers: 'No members found',
    close: 'Close',
    cancel: 'Cancel',
    userProjects: 'User Projects',
    copyProfileUrl: 'Copy Profile URL',
    copyProjectUrl: 'Copy Project URL',
    urlCopied: 'URL copied to clipboard!'
  },
  ar: {
    home: 'الرئيسية',
    projects: 'المشاريع',
    members: 'الأعضاء',
    rules: 'القوانين',
    announcements: 'الإعلانات',
    mason: 'الماسون',
    vipProjects: 'مشاريع VIP',
    masonProjects: 'مشاريع الماسون',
    profile: 'الملف الشخصي',
    adminPanel: 'لوحة الإدارة',
    logout: 'تسجيل الخروج',
    login: 'تسجيل الدخول',
    loginTitle: 'تسجيل الدخول إلى MasonHub',
    registerTitle: 'انضم إلى MasonHub',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    username: 'اسم المستخدم',
    loginBtn: 'دخول',
    registerBtn: 'تسجيل',
    displayName: 'الاسم المعروض',
    bio: 'النبذة الشخصية',
    backgroundImage: 'صورة الخلفية',
    backgroundColor: 'لون الخلفية',
    socialLinks: 'الروابط الاجتماعية',
    platform: 'المنصة',
    url: 'الرابط',
    addLink: 'إضافة رابط',
    saveProfile: 'حفظ الملف الشخصي',
    createProject: 'إنشاء مشروع',
    projectTitle: 'عنوان المشروع',
    projectDescription: 'الوصف',
    projectLanguage: 'لغة البرمجة',
    downloadLink: 'رابط التحميل',
    projectImage: 'صورة المشروع',
    uploadImage: 'رفع صورة',
    createBtn: 'إنشاء',
    downloadBtn: 'تحميل',
    deleteBtn: 'حذف',
    membersTitle: 'أعضاء المجتمع',
    masonTitle: 'أعضاء الماسون',
    joinedOn: 'انضم في',
    visit: 'زيارة',
    manage: 'إدارة',
    promoteToAdmin: 'ترقية لمدير',
    promoteToMason: 'ترقية لماسون',
    promoteToDeveloper: 'ترقية لمطور',
    promoteToVip: 'ترقية لـ VIP',
    demoteToMember: 'تخفيض لعضو',
    verifyUser: 'توثيق المستخدم',
    unverifyUser: 'إلغاء التوثيق',
    banUser: 'حظر المستخدم',
    unbanUser: 'إلغاء الحظر',
    deleteUser: 'حذف المستخدم',
    editEmail: 'تعديل الإيميل',
    banDays: 'أيام الحظر',
    admin: 'Admin',
    developer: 'مطور',
    mason_official: 'ماسون رسمي',
    vip: 'مميز',
    member: 'عضو',
    verified: 'موثق',
    official: 'رسمي',
    featured: 'مميز',
    downloads: 'التحميلات',
    captchaTitle: 'التحقق الأمني',
    captchaPlaceholder: 'أدخل الرمز أعلاه',
    refreshCaptcha: 'تحديث',
    loading: 'جاري التحميل...',
    noProjects: 'لا توجد مشاريع',
    noMembers: 'لا يوجد أعضاء',
    close: 'إغلاق',
    cancel: 'إلغاء',
    userProjects: 'مشاريع المستخدم',
    copyProfileUrl: 'نسخ رابط الملف',
    copyProjectUrl: 'نسخ رابط المشروع',
    urlCopied: 'تم نسخ الرابط!'
  }
};

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<'en' | 'ar'>('en');
  const [message, setMessage] = useState<Message | null>(null);
  const isInitialized = useRef(false);

  const t = translations[language];

  const loadUserProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      if (data) setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  }, []);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    const initializeApp = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          await loadUserProfile(session.user.id);
        }
        setLoading(false);
      } catch (error) {
        console.error('Initialization error:', error);
        setLoading(false);
      }
    };

    initializeApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          await loadUserProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, [loadUserProfile]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="retro-loading">
        <div className="terminal-text blink">{t.loading}</div>
      </div>
    );
  }

  const currentPath = location.pathname;

  return (
    <div className={`retro-app crt-flicker ${language === 'ar' ? 'rtl' : ''}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="matrix-bg"></div>
      <div className="scan-lines"></div>

      <nav className="retro-navbar">
          <div className="nav-container">
            <div className="retro-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>MasonHub</div>
            <div className="nav-links">
              <button className={`nav-btn ${currentPath === '/' ? 'active' : ''}`} onClick={() => navigate('/')}>{t.home}</button>
              <button className={`nav-btn ${currentPath === '/projects' ? 'active' : ''}`} onClick={() => navigate('/projects')}>{t.projects}</button>
              <button className={`nav-btn ${currentPath === '/members' ? 'active' : ''}`} onClick={() => navigate('/members')}>{t.members}</button>
              <button className={`nav-btn ${currentPath === '/announcements' ? 'active' : ''}`} onClick={() => navigate('/announcements')}>{t.announcements}</button>
              <button className={`nav-btn ${currentPath === '/mason' ? 'active' : ''}`} onClick={() => navigate('/mason')}>{t.mason}</button>
              <button className={`nav-btn ${currentPath === '/rules' ? 'active' : ''}`} onClick={() => navigate('/rules')}>{t.rules}</button>
              {user && profile && ['admin', 'developer', 'mason_official', 'vip'].includes(profile.user_rank || '') && (
                <button className={`nav-btn ${currentPath === '/vip' ? 'active' : ''}`} onClick={() => navigate('/vip')} style={{ background: 'rgba(255,215,0,0.05)', border: '1px solid #ffd700' }}>
                  VIP
                </button> 
              )}
              {user && profile && ['admin', 'developer', 'mason_official'].includes(profile.user_rank || '') && (
                <button className={`nav-btn ${currentPath === '/mason-room' ? 'active' : ''}`} onClick={() => navigate('/MasonTeam')} style={{ background: 'rgba(255,215,0,0.05)', border: '1px solid #ffd700' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Building2 size={16} /> Mason Projects</span>
                </button>
              )}
              {user && profile && (
                <button className={`nav-btn ${currentPath === '/profile' ? 'active' : ''}`} onClick={() => navigate('/profile')}>
                  <User size={16} /> {t.profile}
                </button>
              )}
              {user && profile && profile.user_rank === 'admin' && (
                <button className={`nav-btn ${currentPath === '/masonadmin' ? 'active' : ''}`} onClick={() => navigate('/masonadmin')} style={{ background: 'rgba(255,215,0,0.2)', border: '1px solid #ffd700' }}>
                  <Settings size={16} /> {t.adminPanel}
                </button>
              )}
              <button className="language-btn nav-btn" onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}>
                {language === 'en' ? 'العربية' : 'English'}
              </button>
              {user ? (
                <button className="nav-btn logout" onClick={handleLogout}>
                  <LogOut size={16} /> {t.logout}
                </button>
              ) : (
                <button className={`nav-btn ${currentPath === '/login' ? 'active' : ''}`} onClick={() => navigate('/login')}>
                  {t.login}
                </button>
              )}
            </div>
          </div>
        </nav>

      <main className="retro-main">
        <Routes>
          <Route path="/" element={<HomePage user={user} profile={profile} language={language} t={t} />} />
          <Route path="/projects" element={<ProjectsPage user={user} profile={profile} language={language} t={t} />} />
          <Route path="/members" element={<MembersPage user={user} profile={profile} language={language} t={t} />} />
          <Route path="/mason" element={<MasonPage user={user} profile={profile} language={language} t={t} />} />
          <Route path="/vip" element={<VIPRoom user={user} profile={profile} language={language} t={t} />} />
          <Route path="/MasonTeam" element={<MasonRoom user={user} profile={profile} language={language} t={t} />} />
          <Route path="/masonadmin" element={<AdminPanel user={user} profile={profile} language={language} t={t} />} />
          <Route path="/user/:username" element={<ProfileViewPage language={language} t={t} />} />
          <Route path="/profile" element={<MyProfilePage user={user} profile={profile} language={language} t={t} onProfileUpdate={() => user && loadUserProfile(user.id)} />} />
          <Route path="/project/:id" element={<ProjectViewPage user={user} profile={profile} language={language} t={t} />} />
          <Route path="/rules" element={<RulesPage user={user} profile={profile} language={language} t={t} />} />
          <Route path="/announcements" element={<AnnouncementsPage user={user} profile={profile} language={language} t={t} />} />
          <Route path="/login" element={<AuthPage language={language} t={t} />} />
        </Routes>
      </main>

      {message && (
        <div className={`retro-message ${message.type}`} onClick={() => setMessage(null)}>
          {message.text}
        </div>
      )}
    </div>
  );
};

export default AppContent;
