// NeuroScan - TopBar with translations
import React, { useState, useEffect, useRef } from 'react';
import { notificationApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function TopBar({ title }) {
  const { user } = useAuth();
  const { t } = useTheme();
  const [notifs, setNotifs]   = useState([]);
  const [unread, setUnread]   = useState(0);
  const [open, setOpen]       = useState(false);
  const dropdownRef           = useRef(null);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function loadNotifications() {
    try {
      const { data } = await notificationApi.getAll();
      setNotifs(data.notifications || []);
      setUnread(data.unreadCount || 0);
    } catch (_) {}
  }

  async function handleMarkAllRead() {
    try {
      await notificationApi.markAllRead();
      setUnread(0);
      setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (_) {}
  }

  const TYPE_ICONS = {
    connection_request_sent:'🔗', connection_request_accepted:'✅',
    connection_request_rejected:'❌', mri_uploaded:'🧠',
    mri_processing_started:'⚙️', ai_analysis_complete:'🔬',
    diagnosis_ready:'📋', report_available:'📄',
    doctor_assigned:'👨‍⚕️', account_created_for_you:'🎉',
  };

  return (
    <header style={s.header}>
      <h2 style={s.title}>{title}</h2>
      <div style={s.right}>
        <div style={{ position:'relative' }} ref={dropdownRef}>
          <button style={s.iconBtn} onClick={() => setOpen(o => !o)} aria-label={t('notifications')}>
            🔔
            {unread > 0 && <span style={s.badge}>{unread > 9 ? '9+' : unread}</span>}
          </button>
          {open && (
            <div style={s.dropdown}>
              <div style={s.dropHeader}>
                <span style={{ fontWeight:600, fontSize:14, color:'var(--navy)' }}>{t('notifications')}</span>
                {unread > 0 && (
                  <button style={s.markBtn} onClick={handleMarkAllRead}>{t('markAllRead')}</button>
                )}
              </div>
              <div style={{ maxHeight:360, overflowY:'auto' }}>
                {notifs.length === 0 ? (
                  <div style={{ padding:24, textAlign:'center', color:'var(--text-muted)', fontSize:13 }}>
                    {t('noNotifs')}
                  </div>
                ) : notifs.map(n => (
                  <div key={n.id} style={{ ...s.notifItem, background: n.is_read ? 'transparent' : 'var(--blue-pale)' }}>
                    <span style={{ fontSize:18, flexShrink:0 }}>{TYPE_ICONS[n.type] || '📌'}</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)' }}>{n.title}</div>
                      <div style={{ fontSize:12, color:'var(--text-secondary)', marginTop:2 }}>{n.message}</div>
                      <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:3 }}>{formatTime(n.created_at)}</div>
                    </div>
                    {!n.is_read && <div style={s.dot} />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div style={s.userChip}>
          <div style={s.userAv}>{(user?.firstName?.[0]||'') + (user?.lastName?.[0]||'')}</div>
          <span style={{ fontSize:13, fontWeight:500, color:'var(--text-primary)' }}>{user?.firstName}</span>
        </div>
      </div>
    </header>
  );
}

function formatTime(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return new Date(iso).toLocaleDateString();
}

const s = {
  header:   { position:'fixed',top:0,left:'var(--sidebar-w)',right:0,height:'var(--header-h)',background:'rgba(var(--surface-rgb,255,255,255),.95)',backdropFilter:'blur(8px)',borderBottom:'1px solid var(--border-light)',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 32px',zIndex:90,background:'var(--surface)',transition:'background var(--transition)' },
  title:    { fontSize:17, fontWeight:600, color:'var(--navy)', margin:0 },
  right:    { display:'flex', alignItems:'center', gap:12 },
  iconBtn:  { position:'relative',background:'var(--surface-3)',border:'none',borderRadius:8,width:36,height:36,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,transition:'background .15s' },
  badge:    { position:'absolute',top:-5,right:-5,background:'var(--red)',color:'#fff',borderRadius:99,padding:'1px 5px',fontSize:10,fontWeight:700,border:'1.5px solid var(--surface)',lineHeight:1.4 },
  dropdown: { position:'absolute',right:0,top:'110%',width:340,background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',boxShadow:'var(--shadow-lg)',zIndex:200,overflow:'hidden' },
  dropHeader:{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 16px 12px',borderBottom:'1px solid var(--border-light)' },
  markBtn:  { background:'none',border:'none',color:'var(--blue)',fontSize:12,cursor:'pointer',fontWeight:500 },
  notifItem:{ display:'flex',alignItems:'flex-start',gap:10,padding:'12px 16px',borderBottom:'1px solid var(--border-light)',transition:'background .1s' },
  dot:      { width:8,height:8,borderRadius:'50%',background:'var(--blue)',flexShrink:0,marginTop:4 },
  userChip: { display:'flex',alignItems:'center',gap:8,padding:'5px 10px 5px 5px',background:'var(--surface-3)',borderRadius:99 },
  userAv:   { width:28,height:28,borderRadius:'50%',background:'var(--blue)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,textTransform:'uppercase' },
};
