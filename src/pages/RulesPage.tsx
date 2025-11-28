import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Save, Plus, Trash2, CreditCard as Edit, X } from 'lucide-react';
import { Profile, Message } from '../types';

interface RulesPageProps {
  user: any;
  profile: Profile | null;
  language: 'en' | 'ar';
  t: any;
}

interface Rule {
  id: string;
  title: string;
  content: string;
  created_at: string;
  created_by?: string;
  profiles?: {
    username: string;
    display_name: string;
    user_rank: string;
  };
}

const RulesPage: React.FC<RulesPageProps> = ({ user, profile, language, t }) => {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [formData, setFormData] = useState({ title: '', content: '' });
  const [message, setMessage] = useState<Message | null>(null);

  const isAdmin = profile?.user_rank === 'admin';

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      const { data, error } = await supabase
        .from('rules')
        .select(`
          *,
          profiles:created_by (
            username,
            display_name,
            user_rank
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setRules(data || []);
    } catch (error) {
      console.error('Error loading rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !isAdmin) {
      setMessage({ type: 'error', text: language === 'en' ? 'Only admins can add rules' : 'فقط المدراء يمكنهم إضافة القوانين' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    if (!formData.title.trim() || !formData.content.trim()) {
      setMessage({ type: 'error', text: language === 'en' ? 'Please fill all fields' : 'يرجى ملء جميع الحقول' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    try {
      const { error } = await supabase
        .from('rules')
        .insert({
          title: formData.title,
          content: formData.content,
          created_by: user.id
        });

      if (error) throw error;

      await loadRules();
      setShowAddForm(false);
      setFormData({ title: '', content: '' });
      setMessage({ type: 'success', text: language === 'en' ? 'Rule added successfully!' : 'تم إضافة القانون بنجاح!' });
      setTimeout(() => setMessage(null), 2000);
    } catch (error: any) {
      console.error('Error adding rule:', error);
      setMessage({ type: 'error', text: error.message });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleUpdateRule = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !isAdmin || !editingRule) return;

    try {
      const { error } = await supabase
        .from('rules')
        .update({
          title: formData.title,
          content: formData.content,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingRule.id);

      if (error) throw error;

      await loadRules();
      setEditingRule(null);
      setFormData({ title: '', content: '' });
      setMessage({ type: 'success', text: language === 'en' ? 'Rule updated successfully!' : 'تم تحديث القانون بنجاح!' });
      setTimeout(() => setMessage(null), 2000);
    } catch (error: any) {
      console.error('Error updating rule:', error);
      setMessage({ type: 'error', text: error.message });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!user || !isAdmin) return;

    if (!confirm(language === 'en' ? 'Delete this rule?' : 'حذف هذا القانون؟')) return;

    try {
      const { error } = await supabase
        .from('rules')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;

      await loadRules();
      setMessage({ type: 'success', text: language === 'en' ? 'Rule deleted!' : 'تم حذف القانون!' });
      setTimeout(() => setMessage(null), 2000);
    } catch (error: any) {
      console.error('Error deleting rule:', error);
      setMessage({ type: 'error', text: error.message });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const startEdit = (rule: Rule) => {
    setEditingRule(rule);
    setFormData({ title: rule.title, content: rule.content });
    setShowAddForm(false);
  };

  const cancelEdit = () => {
    setEditingRule(null);
    setFormData({ title: '', content: '' });
  };

  if (loading) {
    return (
      <div className="retro-window">
        <div className="window-header">
          <span>{language === 'en' ? 'Rules' : 'القوانين'}</span>
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
      {message && (
        <div className={`notification ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="retro-window">
        <div className="window-header">
          <span>{language === 'en' ? 'Platform Rules' : 'قوانين المنصة'}</span>
          {isAdmin && !showAddForm && !editingRule && (
            <button
              className="retro-button primary"
              style={{ marginLeft: '10px', padding: '4px 10px', fontSize: '11px' }}
              onClick={() => setShowAddForm(true)}
            >
              <Plus size={12} /> {language === 'en' ? 'Add Rule' : 'إضافة قانون'}
            </button>
          )}
        </div>
        <div className="window-content">
          {(showAddForm || editingRule) && isAdmin ? (
            <form onSubmit={editingRule ? handleUpdateRule : handleAddRule} style={{ marginBottom: '30px' }}>
              <div style={{
                background: 'rgba(0,255,0,0.05)',
                border: '2px solid #00ff00',
                padding: '20px',
                borderRadius: '4px'
              }}>
                <h3 style={{ marginBottom: '15px', color: '#00ff00' }}>
                  {editingRule ? (language === 'en' ? 'Edit Rule' : 'تعديل القانون') : (language === 'en' ? 'Add New Rule' : 'إضافة قانون جديد')}
                </h3>

                <div className="form-group">
                  <label className="form-label">
                    {language === 'en' ? 'Rule Title' : 'عنوان القانون'}
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder={language === 'en' ? 'e.g., Respect Everyone' : 'مثال: احترم الجميع'}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {language === 'en' ? 'Rule Content (Markdown supported)' : 'محتوى القانون (يدعم Markdown)'}
                  </label>
                  <textarea
                    className="form-textarea"
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    rows={10}
                    style={{ fontFamily: 'monospace', fontSize: '13px' }}
                    placeholder={language === 'en' ? 'Enter rule details...' : 'أدخل تفاصيل القانون...'}
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" className="retro-button primary">
                    <Save size={16} /> {editingRule ? (language === 'en' ? 'Update' : 'تحديث') : (language === 'en' ? 'Add Rule' : 'إضافة')}
                  </button>
                  <button
                    type="button"
                    className="retro-button secondary"
                    onClick={() => {
                      setShowAddForm(false);
                      cancelEdit();
                    }}
                  >
                    <X size={16} /> {language === 'en' ? 'Cancel' : 'إلغاء'}
                  </button>
                </div>
              </div>
            </form>
          ) : null}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {rules.length > 0 ? rules.map((rule) => (
              <div
                key={rule.id}
                style={{
                  background: 'rgba(0,255,0,0.05)',
                  border: '1px solid rgba(0,255,0,0.3)',
                  padding: '20px',
                  borderRadius: '4px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                  <h3 style={{ fontSize: '18px', color: '#00ff00', margin: 0 }}>{rule.title}</h3>
                  {isAdmin && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="retro-button secondary"
                        style={{ padding: '4px 8px', fontSize: '11px' }}
                        onClick={() => startEdit(rule)}
                      >
                        <Edit size={12} />
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteRule(rule.id)}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>

                <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', marginBottom: '15px' }}>
                  {rule.content.split('\n').map((line, index) => {
                    if (line.startsWith('## ')) {
                      return <h4 key={index} style={{ fontSize: '16px', marginTop: '10px', marginBottom: '8px' }}>{line.substring(3)}</h4>;
                    } else if (line.startsWith('- ')) {
                      return <li key={index} style={{ marginLeft: '20px', marginBottom: '5px' }}>{line.substring(2)}</li>;
                    } else if (line.trim() === '') {
                      return <br key={index} />;
                    } else {
                      return <p key={index} style={{ marginBottom: '8px' }}>{line}</p>;
                    }
                  })}
                </div>

                <div style={{
                  paddingTop: '10px',
                  borderTop: '1px solid rgba(0,255,0,0.2)',
                  fontSize: '11px',
                  opacity: 0.7,
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    {language === 'en' ? 'Posted: ' : 'تاريخ النشر: '}
                    {new Date(rule.created_at).toLocaleDateString()}
                  </div>
                  {rule.profiles && (
                    <div style={{ color: '#00ff00' }}>
                      {language === 'en' ? 'By: ' : 'بواسطة: '}
                      <strong>@{rule.profiles.username}</strong>
                    </div>
                  )}
                </div>
              </div>
            )) : (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                background: 'rgba(0,255,0,0.05)',
                border: '1px solid rgba(0,255,0,0.3)',
                borderRadius: '4px'
              }}>
                <p style={{ opacity: 0.7, marginBottom: '15px' }}>
                  {language === 'en' ? 'No rules have been posted yet' : 'لم يتم نشر أي قوانين بعد'}
                </p>
                {isAdmin && (
                  <button
                    className="retro-button primary"
                    onClick={() => setShowAddForm(true)}
                  >
                    <Plus size={16} /> {language === 'en' ? 'Add First Rule' : 'إضافة أول قانون'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default RulesPage;
