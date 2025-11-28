import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Message } from '../types';
import { Mail, AlertTriangle, CheckCircle } from 'lucide-react';

interface AuthPageProps {
  language: 'en' | 'ar';
  t: any;
}

const Captcha: React.FC<{
  value: string;
  onChange: (value: string) => void;
  onRefresh: () => void;
  captchaText: string;
  language: 'en' | 'ar';
}> = ({ value, onChange, onRefresh, captchaText, language }) => {
  return (
    <div className="captcha-container" style={{ marginBottom: '15px' }}>
      <h4 style={{ marginBottom: '10px' }}>
        {language === 'en' ? 'Security Verification' : 'التحقق الأمني'}
      </h4>
      <div
        className="captcha-display"
        style={{
          background: 'rgba(0,255,0,0.1)',
          border: '2px solid #00ff00',
          padding: '20px',
          textAlign: 'center',
          fontSize: '24px',
          letterSpacing: '8px',
          fontWeight: 'bold',
          marginBottom: '10px',
          userSelect: 'none'
        }}
      >
        {captchaText}
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          placeholder={language === 'en' ? 'Enter the code above' : 'أدخل الرمز أعلاه'}
          className="form-input"
          maxLength={6}
          style={{ flex: 1 }}
        />
        <button type="button" onClick={onRefresh} className="retro-button secondary">
          {language === 'en' ? 'Refresh' : 'تحديث'}
        </button>
      </div>
    </div>
  );
};

const AuthPage: React.FC<AuthPageProps> = ({ language, t }) => {
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot' | 'verify-code'>('login');
  const [message, setMessage] = useState<Message | null>(null);
  const [captchaText, setCaptchaText] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [resetEmail, setResetEmail] = useState('');

  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    username: ''
  });

  const [newPasswordForm, setNewPasswordForm] = useState({
    password: '',
    confirmPassword: ''
  });

  React.useEffect(() => {
    generateCaptcha();
  }, []);

  const generateCaptcha = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaText(result);
    setCaptchaInput('');
  };

  const validateUsername = (username: string): boolean => {
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    return usernameRegex.test(username);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    if (captchaInput !== captchaText) {
      setMessage({ type: 'error', text: language === 'en' ? 'Invalid captcha code' : 'رمز التحقق غير صحيح' });
      setTimeout(() => setMessage(null), 3000);
      generateCaptcha();
      return;
    }

    if (authMode === 'register') {
      if (!validateUsername(authForm.username)) {
        setMessage({
          type: 'error',
          text: language === 'en'
            ? 'Username must be 3-30 characters (letters, numbers, underscore only)'
            : 'اسم المستخدم يجب أن يكون 3-30 حرف (حروف، أرقام، شرطة سفلية فقط)'
        });
        setTimeout(() => setMessage(null), 4000);
        return;
      }
    }

    try {
      if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: authForm.email,
          password: authForm.password
        });
        if (error) throw error;
        setMessage({ type: 'success', text: language === 'en' ? 'Login successful!' : 'تم تسجيل الدخول بنجاح!' });
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      } else {
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', authForm.username.toLowerCase())
          .maybeSingle();

        if (existingUser) {
          setMessage({
            type: 'error',
            text: language === 'en'
              ? 'Username already taken. Please choose another one.'
              : 'اسم المستخدم مستخدم بالفعل. الرجاء اختيار اسم آخر.'
          });
          setTimeout(() => setMessage(null), 4000);
          generateCaptcha();
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: authForm.email,
          password: authForm.password
        });
        if (error) throw error;

        if (data.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              username: authForm.username.toLowerCase(),
              email: authForm.email,
              user_rank: 'member'
            });
          if (profileError) throw profileError;
        }
        setMessage({ type: 'success', text: language === 'en' ? 'Registration successful!' : 'تم التسجيل بنجاح!' });
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      }

      setAuthForm({ email: '', password: '', username: '' });
      setCaptchaInput('');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
      setTimeout(() => setMessage(null), 4000);
      generateCaptcha();
    }
  };

  const generateVerificationCode = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    return code;
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!authForm.email) {
      setMessage({
        type: 'error',
        text: language === 'en' ? 'Please enter your email' : 'الرجاء إدخال بريدك الإلكتروني'
      });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    setResettingPassword(true);
    try {
      const { data: user, error } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', authForm.email)
        .maybeSingle();

      if (error) throw error;

      if (!user) {
        setMessage({
          type: 'error',
          text: language === 'en' ? 'Email not found' : 'البريد الإلكتروني غير موجود'
        });
        setTimeout(() => setMessage(null), 3000);
        return;
      }

      const code = generateVerificationCode();
      setGeneratedCode(code);
      setResetEmail(authForm.email);

      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      const { error: insertError } = await supabase
        .from('password_reset_codes')
        .insert({
          email: authForm.email,
          code: code,
          expires_at: expiresAt,
          used: false
        });

      if (insertError) {
        console.error('Failed to save code:', insertError);
      }

      console.log('\n' + '═'.repeat(60));
      console.log('✉ PASSWORD RESET VERIFICATION CODE');
      console.log('═'.repeat(60));
      console.log(`\nTo: ${authForm.email}`);
      console.log('Subject: Password Reset - Verification Code\n');
      console.log('─'.repeat(60));
      console.log('\n  You requested to reset your password.\n');
      console.log('  Your verification code is:\n');
      console.log(`      ${code.split('').join('  ')}\n`);
      console.log('  This code will expire in 10 minutes.\n');
      console.log('  If you did not request this, please ignore this email.\n');
      console.log('─'.repeat(60));
      console.log('\n⚠ NOTE: In production, this email would be sent');
      console.log('   via your email service (e.g., Resend, SendGrid)');
      console.log('   For demo purposes, copy the code above.\n');
      console.log('═'.repeat(60) + '\n');

      setMessage({
        type: 'success',
        text: language === 'en'
          ? 'Code generated! Check browser console (F12) for the verification code.'
          : 'تم إنشاء الرمز! افتح console المتصفح (F12) لرؤية رمز التحقق.'
      });

      setTimeout(() => setMessage(null), 8000);
      setAuthMode('verify-code');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
      setTimeout(() => setMessage(null), 4000);
    } finally {
      setResettingPassword(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!verificationCode || verificationCode.length !== 6) {
      setMessage({
        type: 'error',
        text: language === 'en' ? 'Please enter a valid 6-digit code' : 'الرجاء إدخال رمز صالح مكون من 6 أرقام'
      });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    if (newPasswordForm.password.length < 6) {
      setMessage({
        type: 'error',
        text: language === 'en' ? 'Password must be at least 6 characters' : 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
      });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    if (newPasswordForm.password !== newPasswordForm.confirmPassword) {
      setMessage({
        type: 'error',
        text: language === 'en' ? 'Passwords do not match' : 'كلمات المرور غير متطابقة'
      });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    setResettingPassword(true);
    try {
      const { data: resetCode, error: codeError } = await supabase
        .from('password_reset_codes')
        .select('*')
        .eq('email', resetEmail)
        .eq('code', verificationCode)
        .eq('used', false)
        .maybeSingle();

      if (codeError) throw codeError;

      if (!resetCode) {
        setMessage({
          type: 'error',
          text: language === 'en' ? 'Invalid or expired verification code' : 'رمز التحقق غير صحيح أو منتهي الصلاحية'
        });
        setTimeout(() => setMessage(null), 3000);
        setResettingPassword(false);
        return;
      }

      const now = new Date();
      const expiresAt = new Date(resetCode.expires_at);

      if (now > expiresAt) {
        setMessage({
          type: 'error',
          text: language === 'en' ? 'Verification code has expired' : 'رمز التحقق منتهي الصلاحية'
        });
        setTimeout(() => setMessage(null), 3000);
        setResettingPassword(false);
        return;
      }

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: resetEmail,
        password: 'temp_password_for_reset_' + Date.now()
      });

      if (signInError) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('password')
          .eq('email', resetEmail)
          .maybeSingle();

        if (profile) {
          const { error: loginError } = await supabase.auth.signInWithPassword({
            email: resetEmail,
            password: profile.password
          });

          if (loginError) {
            throw new Error('Authentication failed. Please try again.');
          }
        }
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPasswordForm.password
      });

      if (updateError) {
        throw updateError;
      }

      await supabase
        .from('profiles')
        .update({ password: newPasswordForm.password })
        .eq('email', resetEmail);

      await supabase
        .from('password_reset_codes')
        .update({ used: true })
        .eq('id', resetCode.id);

      await supabase.auth.signOut();

      setMessage({
        type: 'success',
        text: language === 'en'
          ? 'Password changed successfully! You can now login with your new password.'
          : 'تم تغيير كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.'
      });

      setTimeout(() => {
        setAuthMode('login');
        setVerificationCode('');
        setGeneratedCode('');
        setResetEmail('');
        setNewPasswordForm({ password: '', confirmPassword: '' });
        setMessage(null);
      }, 5000);
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message
      });
      setTimeout(() => setMessage(null), 4000);
    } finally {
      setResettingPassword(false);
    }
  };

  return (
    <>
      <div className="retro-window" style={{ maxWidth: '500px', margin: '0 auto' }}>
        <div className="window-header">
          <span>
            {authMode === 'login' ? t.loginTitle : authMode === 'register' ? t.registerTitle : (language === 'en' ? 'Reset Password' : 'استعادة كلمة المرور')}
          </span>
          <div className="window-buttons">
            <div className="window-button close" onClick={() => navigate('/')}>×</div>
          </div>
        </div>
        <div className="window-content">
          {authMode !== 'forgot' && (
            <div className="auth-tabs" style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <button
                className={`retro-button ${authMode === 'login' ? 'primary' : ''}`}
                onClick={() => setAuthMode('login')}
                style={{ flex: 1 }}
              >
                {t.login}
              </button>
              <button
                className={`retro-button ${authMode === 'register' ? 'primary' : ''}`}
                onClick={() => {
                  setAuthMode('register');
                  generateCaptcha();
                }}
                style={{ flex: 1 }}
              >
                {t.registerBtn}
              </button>
            </div>
          )}

          {authMode === 'forgot' ? (
            <form onSubmit={handleSendCode}>
              <div className="form-group">
                <label className="form-label">{t.email}</label>
                <input
                  type="email"
                  className="form-input"
                  value={authForm.email}
                  onChange={(e) => setAuthForm(prev => ({ ...prev, email: e.target.value }))}
                  required
                  placeholder={language === 'en' ? 'your.email@example.com' : 'بريدك@example.com'}
                />
              </div>
              <button
                type="submit"
                className="retro-button primary"
                disabled={resettingPassword}
                style={{ width: '100%' }}
              >
                {resettingPassword
                  ? (language === 'en' ? 'Sending...' : 'جاري الإرسال...')
                  : (language === 'en' ? 'Send Verification Code' : 'إرسال رمز التحقق')
                }
              </button>

              <div className="separator" style={{ margin: '20px 0' }}></div>

              <div style={{ textAlign: 'center', fontSize: '12px' }}>
                <span
                  onClick={() => setAuthMode('login')}
                  style={{ color: '#00ff00', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  {language === 'en' ? 'Back to Login' : 'العودة لتسجيل الدخول'}
                </span>
              </div>
            </form>
          ) : authMode === 'verify-code' ? (
            <form onSubmit={handleVerifyCode}>
              <div style={{ background: 'rgba(0,255,0,0.1)', border: '2px solid #00ff00', padding: '15px', marginBottom: '20px', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6' }}>
                  {language === 'en'
                    ? 'A 6-digit verification code has been sent to your email. Please check your inbox and enter it below.'
                    : 'تم إرسال رمز تحقق مكون من 6 أرقام إلى بريدك الإلكتروني. يرجى التحقق من صندوق الوارد وإدخاله أدناه.'}
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">
                  {language === 'en' ? 'Enter Verification Code' : 'أدخل رمز التحقق'}
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  required
                  maxLength={6}
                  placeholder="000000"
                  style={{ textAlign: 'center', fontSize: '20px', letterSpacing: '4px' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  {language === 'en' ? 'New Password' : 'كلمة المرور الجديدة'}
                </label>
                <input
                  type="password"
                  className="form-input"
                  value={newPasswordForm.password}
                  onChange={(e) => setNewPasswordForm(prev => ({ ...prev, password: e.target.value }))}
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
                  value={newPasswordForm.confirmPassword}
                  onChange={(e) => setNewPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  required
                  minLength={6}
                  placeholder={language === 'en' ? 'Re-enter password' : 'أعد إدخال كلمة المرور'}
                />
              </div>

              <button
                type="submit"
                className="retro-button primary"
                disabled={resettingPassword}
                style={{ width: '100%' }}
              >
                {resettingPassword
                  ? (language === 'en' ? 'Resetting...' : 'جاري التغيير...')
                  : (language === 'en' ? 'Reset Password' : 'تغيير كلمة المرور')
                }
              </button>

              <div className="separator" style={{ margin: '20px 0' }}></div>

              <div style={{ textAlign: 'center', fontSize: '12px' }}>
                <span
                  onClick={() => {
                    setAuthMode('forgot');
                    setVerificationCode('');
                    setGeneratedCode('');
                  }}
                  style={{ color: '#00ff00', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  {language === 'en' ? 'Resend Code' : 'إعادة إرسال الرمز'}
                </span>
              </div>
            </form>
          ) : authMode !== 'forgot' && authMode !== 'verify-code' && (
            <form onSubmit={handleAuth}>
            <div className="form-group">
              <label className="form-label">{t.email}</label>
              <input
                type="email"
                className="form-input"
                value={authForm.email}
                onChange={(e) => setAuthForm(prev => ({ ...prev, email: e.target.value }))}
                required
                placeholder={language === 'en' ? 'your.email@example.com' : 'بريدك@example.com'}
              />
            </div>

            {authMode === 'register' && (
              <div className="form-group">
                <label className="form-label">{t.username}</label>
                <input
                  type="text"
                  className="form-input"
                  value={authForm.username}
                  onChange={(e) => setAuthForm(prev => ({ ...prev, username: e.target.value }))}
                  required
                  placeholder={language === 'en' ? 'Choose a unique username' : 'اختر اسم مستخدم فريد'}
                  minLength={3}
                  maxLength={30}
                />
                <small style={{ fontSize: '11px', opacity: 0.7, display: 'block', marginTop: '5px' }}>
                  {language === 'en'
                    ? '3-30 characters: letters, numbers, underscore only'
                    : '3-30 حرف: حروف، أرقام، شرطة سفلية فقط'}
                </small>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">{t.password}</label>
              <input
                type="password"
                className="form-input"
                value={authForm.password}
                onChange={(e) => setAuthForm(prev => ({ ...prev, password: e.target.value }))}
                required
                minLength={authMode === 'register' ? 6 : undefined}
                placeholder={authMode === 'register' ? (language === 'en' ? 'Minimum 6 characters' : 'على الأقل 6 أحرف') : (language === 'en' ? 'Enter your password' : 'أدخل كلمة المرور')}
              />
            </div>

            <Captcha
              value={captchaInput}
              onChange={setCaptchaInput}
              onRefresh={generateCaptcha}
              captchaText={captchaText}
              language={language}
            />

            <button type="submit" className="retro-button primary" style={{ width: '100%' }}>
              {authMode === 'login' ? t.loginBtn : t.registerBtn}
            </button>
            </form>
          )}

          {authMode === 'login' && (
            <div style={{ textAlign: 'center', marginTop: '15px', fontSize: '12px' }}>
              <span
                onClick={() => setAuthMode('forgot')}
                style={{ color: '#00ff00', cursor: 'pointer', textDecoration: 'underline' }}
              >
                {language === 'en' ? 'Forgot Password?' : 'نسيت كلمة المرور؟'}
              </span>
            </div>
          )}

          <div className="separator" style={{ margin: '20px 0' }}></div>

          {authMode !== 'forgot' && (
            <div style={{ textAlign: 'center', fontSize: '12px', opacity: 0.8 }}>
              {authMode === 'login' ? (
                <p>
                  {language === 'en' ? "Don't have an account? " : 'ليس لديك حساب؟ '}
                  <span
                    onClick={() => {
                      setAuthMode('register');
                      generateCaptcha();
                    }}
                    style={{ color: '#00ff00', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    {language === 'en' ? 'Register here' : 'سجل هنا'}
                  </span>
                </p>
              ) : (
                <p>
                  {language === 'en' ? 'Already have an account? ' : 'لديك حساب بالفعل؟ '}
                  <span
                    onClick={() => setAuthMode('login')}
                    style={{ color: '#00ff00', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    {language === 'en' ? 'Login here' : 'سجل دخول هنا'}
                  </span>
                </p>
              )}
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

export default AuthPage;
