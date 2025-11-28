import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { uploadImage } from '../lib/imageUpload';
import { Save, Plus, Trash2, CreditCard as Edit, X, Upload, Image as ImageIcon } from 'lucide-react';
import { Profile, Message } from '../types';

interface AnnouncementsPageProps {
  user: any;
  profile: Profile | null;
  language: 'en' | 'ar';
  t: any;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  images: string[];
  created_at: string;
  created_by?: string;
  profiles?: {
    username: string;
    display_name: string;
    user_rank: string;
  };
}

const AnnouncementsPage: React.FC<AnnouncementsPageProps> = ({ user, profile, language, t }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState({ title: '', content: '', images: [] as string[] });
  const [uploadingImages, setUploadingImages] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  const isAdmin = profile?.user_rank === 'admin';

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
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

      setAnnouncements((data || []).map(item => ({
        ...item,
        images: Array.isArray(item.images) ? item.images : []
      })));
    } catch (error) {
      console.error('Error loading announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);

    try {
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const url = await uploadImage(file, 'announcements');
        if (url) {
          uploadedUrls.push(url);
        }
      }

      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls]
      }));

      setMessage({ type: 'success', text: language === 'en' ? `${uploadedUrls.length} image(s) uploaded!` : `تم رفع ${uploadedUrls.length} صورة!` });
      setTimeout(() => setMessage(null), 2000);
    } catch (error: any) {
      console.error('Error uploading images:', error);
      setMessage({ type: 'error', text: error.message });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !isAdmin) {
      setMessage({ type: 'error', text: language === 'en' ? 'Only admins can add announcements' : 'فقط المدراء يمكنهم إضافة الإعلانات' });
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
        .from('announcements')
        .insert({
          title: formData.title,
          content: formData.content,
          images: formData.images,
          created_by: user.id
        });

      if (error) throw error;

      await loadAnnouncements();
      setShowAddForm(false);
      setFormData({ title: '', content: '', images: [] });
      setMessage({ type: 'success', text: language === 'en' ? 'Announcement posted!' : 'تم نشر الإعلان!' });
      setTimeout(() => setMessage(null), 2000);
    } catch (error: any) {
      console.error('Error adding announcement:', error);
      setMessage({ type: 'error', text: error.message });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleUpdateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !isAdmin || !editingAnnouncement) return;

    try {
      const { error } = await supabase
        .from('announcements')
        .update({
          title: formData.title,
          content: formData.content,
          images: formData.images,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingAnnouncement.id);

      if (error) throw error;

      await loadAnnouncements();
      setEditingAnnouncement(null);
      setFormData({ title: '', content: '', images: [] });
      setMessage({ type: 'success', text: language === 'en' ? 'Announcement updated!' : 'تم تحديث الإعلان!' });
      setTimeout(() => setMessage(null), 2000);
    } catch (error: any) {
      console.error('Error updating announcement:', error);
      setMessage({ type: 'error', text: error.message });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleDeleteAnnouncement = async (announcementId: string) => {
    if (!user || !isAdmin) return;

    if (!confirm(language === 'en' ? 'Delete this announcement?' : 'حذف هذا الإعلان؟')) return;

    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', announcementId);

      if (error) throw error;

      await loadAnnouncements();
      setMessage({ type: 'success', text: language === 'en' ? 'Announcement deleted!' : 'تم حذف الإعلان!' });
      setTimeout(() => setMessage(null), 2000);
    } catch (error: any) {
      console.error('Error deleting announcement:', error);
      setMessage({ type: 'error', text: error.message });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const startEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      images: announcement.images || []
    });
    setShowAddForm(false);
  };

  const cancelEdit = () => {
    setEditingAnnouncement(null);
    setFormData({ title: '', content: '', images: [] });
  };

  if (loading) {
    return (
      <div className="retro-window">
        <div className="window-header">
          <span>{language === 'en' ? 'Announcements' : 'الإعلانات'}</span>
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
          <span>{language === 'en' ? 'Announcements' : 'الإعلانات'}</span>
          {isAdmin && !showAddForm && !editingAnnouncement && (
            <button
              className="retro-button primary"
              style={{ marginLeft: '10px', padding: '4px 10px', fontSize: '11px' }}
              onClick={() => setShowAddForm(true)}
            >
              <Plus size={12} /> {language === 'en' ? 'New Announcement' : 'إعلان جديد'}
            </button>
          )}
        </div>
        <div className="window-content">
          {(showAddForm || editingAnnouncement) && isAdmin ? (
            <form onSubmit={editingAnnouncement ? handleUpdateAnnouncement : handleAddAnnouncement} style={{ marginBottom: '30px' }}>
              <div style={{
                background: 'rgba(0,255,0,0.05)',
                border: '2px solid #00ff00',
                padding: '20px',
                borderRadius: '4px'
              }}>
                <h3 style={{ marginBottom: '15px', color: '#00ff00' }}>
                  {editingAnnouncement ? (language === 'en' ? 'Edit Announcement' : 'تعديل الإعلان') : (language === 'en' ? 'New Announcement' : 'إعلان جديد')}
                </h3>

                <div className="form-group">
                  <label className="form-label">
                    {language === 'en' ? 'Title' : 'العنوان'}
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder={language === 'en' ? 'Announcement title...' : 'عنوان الإعلان...'}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {language === 'en' ? 'Content' : 'المحتوى'}
                  </label>
                  <textarea
                    className="form-textarea"
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    rows={12}
                    placeholder={language === 'en' ? 'Write your announcement here...' : 'اكتب إعلانك هنا...'}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <ImageIcon size={16} style={{ display: 'inline', marginRight: '5px' }} />
                    {language === 'en' ? 'Images (Multiple)' : 'الصور (متعددة)'}
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml"
                    multiple
                    onChange={handleImageUpload}
                    disabled={uploadingImages}
                    style={{ marginBottom: '10px' }}
                  />
                  {uploadingImages && <p style={{ fontSize: '12px', opacity: 0.7 }}>{language === 'en' ? 'Uploading...' : 'جاري الرفع...'}</p>}

                  {formData.images.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px', marginTop: '10px' }}>
                      {formData.images.map((url, index) => (
                        <div key={index} style={{ position: 'relative' }}>
                          <img src={url} alt={`Upload ${index + 1}`} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '4px', border: '1px solid rgba(0,255,0,0.3)' }} />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            style={{
                              position: 'absolute',
                              top: '5px',
                              right: '5px',
                              background: 'rgba(255,0,0,0.8)',
                              border: 'none',
                              borderRadius: '50%',
                              width: '24px',
                              height: '24px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white'
                            }}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" className="retro-button primary">
                    <Save size={16} /> {editingAnnouncement ? (language === 'en' ? 'Update' : 'تحديث') : (language === 'en' ? 'Post' : 'نشر')}
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            {announcements.length > 0 ? announcements.map((announcement) => (
              <div
                key={announcement.id}
                style={{
                  background: 'rgba(0,255,0,0.05)',
                  border: '2px solid rgba(0,255,0,0.3)',
                  padding: '25px',
                  borderRadius: '4px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                  <h2 style={{ fontSize: '22px', color: '#00ff00', margin: 0 }}>{announcement.title}</h2>
                  {isAdmin && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="retro-button secondary"
                        style={{ padding: '4px 8px', fontSize: '11px' }}
                        onClick={() => startEdit(announcement)}
                      >
                        <Edit size={12} />
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteAnnouncement(announcement.id)}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>

                {announcement.images && announcement.images.length > 0 && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: announcement.images.length === 1 ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '15px',
                    marginBottom: '20px'
                  }}>
                    {announcement.images.map((imageUrl, index) => (
                      <img
                        key={index}
                        src={imageUrl}
                        alt={`${announcement.title} - ${index + 1}`}
                        style={{
                          width: '100%',
                          height: announcement.images.length === 1 ? '400px' : '250px',
                          objectFit: 'cover',
                          borderRadius: '4px',
                          border: '1px solid rgba(0,255,0,0.3)'
                        }}
                      />
                    ))}
                  </div>
                )}

                <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', fontSize: '15px', marginBottom: '20px' }}>
                  {announcement.content}
                </div>

                <div style={{
                  paddingTop: '15px',
                  borderTop: '1px solid rgba(0,255,0,0.2)',
                  fontSize: '12px',
                  opacity: 0.7,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    {language === 'en' ? 'Posted: ' : 'تاريخ النشر: '}
                    {new Date(announcement.created_at).toLocaleString()}
                  </div>
                  {announcement.profiles && (
                    <div style={{ color: '#00ff00', fontSize: '13px' }}>
                      {language === 'en' ? 'By Admin: ' : 'بواسطة الإدارة: '}
                      <strong>@{announcement.profiles.username}</strong>
                    </div>
                  )}
                </div>
              </div>
            )) : (
              <div style={{
                textAlign: 'center',
                padding: '50px',
                background: 'rgba(0,255,0,0.05)',
                border: '1px solid rgba(0,255,0,0.3)',
                borderRadius: '4px'
              }}>
                <p style={{ fontSize: '16px', opacity: 0.7, marginBottom: '20px' }}>
                  {language === 'en' ? 'No announcements yet' : 'لا توجد إعلانات بعد'}
                </p>
                {isAdmin && (
                  <button
                    className="retro-button primary"
                    onClick={() => setShowAddForm(true)}
                  >
                    <Plus size={16} /> {language === 'en' ? 'Post First Announcement' : 'أضف أول إعلان'}
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

export default AnnouncementsPage;
