// NeuroScan - Sidebar with dark mode, language switcher, logout
import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const DOCTOR_NAV = [
  { to: '/doctor',           label: 'dashboard',  icon: '▦',  exact: true },
  { to: '/doctor/patients',  label: 'patients',   icon: '👤' },
  { to: '/doctor/requests',  label: 'requests',   icon: '🔗' },
  { to: '/doctor/profile',   label: 'profile',    icon: '⚙'  },
];
const PATIENT_NAV = [
  { to: '/patient',          label: 'overview',   icon: '▦',  exact: true },
  { to: '/patient/mri',      label: 'myScans',    icon: '🧠' },
  { to: '/patient/reports',  label: 'reports',    icon: '📋' },
  { to: '/patient/doctors',  label: 'findDoctor', icon: '🔍' },
  { to: '/patient/profile',  label: 'profile',    icon: '⚙'  },
];

const LANGS = [
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'fr', label: 'FR', name: 'Français' },
  { code: 'ar', label: 'ع',  name: 'العربية' },
];

export default function Sidebar({ pendingCount = 0 }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, language, setLanguage, t } = useTheme();
  const navigate = useNavigate();
  const [showLang, setShowLang] = useState(false);

  const navItems = user?.role === 'doctor' ? DOCTOR_NAV : PATIENT_NAV;
  const initials = user ? `${user.firstName?.[0]||''}${user.lastName?.[0]||''}`.toUpperCase() : '?';
  const isDark = theme === 'dark';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside style={s.sidebar}>
      {/* Logo */}
      <div style={s.logo}>
        <div style={s.logoIcon}>N</div>
        <div>
          <div style={s.logoText}>NeuroScan</div>
          <div style={s.logoSub}>Medical Platform</div>
        </div>
      </div>

      <div style={s.divider} />

      {/* Role badge */}
      <div style={{ padding: '8px 16px' }}>
        <span style={{ ...s.roleChip, background: user?.role === 'doctor' ? 'rgba(96,165,250,.2)' : 'rgba(52,211,153,.2)', color: user?.role === 'doctor' ? '#93c5fd' : '#6ee7b7' }}>
          {user?.role === 'doctor' ? '🩺 Doctor' : '🏥 Patient'}
        </span>
      </div>

      {/* Navigation */}
      <nav style={s.nav}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            style={({ isActive }) => ({ ...s.navItem, ...(isActive ? s.navActive : {}) })}
          >
            <span style={s.navIcon}>{item.icon}</span>
            <span style={{ flex: 1 }}>{t(item.label)}</span>
            {item.label === 'requests' && pendingCount > 0 && (
              <span style={s.badge}>{pendingCount}</span>
            )}
          </NavLink>
        ))}
      </nav>

      <div style={{ flex: 1 }} />
      <div style={s.divider} />

      {/* Settings row: dark mode + language */}
      <div style={s.settingsRow}>
        {/* Dark mode toggle */}
        <button style={s.settingBtn} onClick={toggleTheme} title={t('darkMode')}>
          <span style={{ fontSize: 16 }}>{isDark ? '☀️' : '🌙'}</span>
        </button>

        {/* Language switcher */}
        <div style={{ position: 'relative' }}>
          <button style={s.settingBtn} onClick={() => setShowLang(p => !p)} title={t('language')}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,.8)' }}>
              {LANGS.find(l => l.code === language)?.label || 'EN'}
            </span>
          </button>
          {showLang && (
            <div style={s.langMenu}>
              {LANGS.map(lang => (
                <button key={lang.code} style={{ ...s.langItem, ...(language === lang.code ? s.langActive : {}) }}
                  onClick={() => { setLanguage(lang.code); setShowLang(false); }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{lang.label}</span>
                  <span style={{ fontSize: 12, opacity: .7 }}>{lang.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* User card + logout */}
      <div style={s.userCard}>
        <div style={s.userAvatar}>{initials}</div>
        <div style={s.userInfo}>
          <div style={s.userName}>{user?.firstName} {user?.lastName}</div>
          <div style={s.userEmail}>{user?.email}</div>
        </div>
        <button onClick={handleLogout} style={s.logoutBtn} title={t('logout')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>
    </aside>
  );
}

const s = {
  sidebar: { position:'fixed',top:0,left:0,bottom:0,width:'var(--sidebar-w)',background:'linear-gradient(180deg,#0b1e35 0%,#0d2540 100%)',display:'flex',flexDirection:'column',zIndex:100,boxShadow:'2px 0 20px rgba(0,0,0,.25)' },
  logo:    { display:'flex',alignItems:'center',gap:10,padding:'20px 20px 16px' },
  logoIcon:{ width:36,height:36,background:'linear-gradient(135deg,#2d7dd2,#0e8a7c)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,fontSize:18,flexShrink:0 },
  logoText:{ color:'#fff',fontWeight:700,fontSize:16,lineHeight:1.2 },
  logoSub: { color:'rgba(255,255,255,.4)',fontSize:10,fontWeight:400,textTransform:'uppercase',letterSpacing:'.06em' },
  divider: { height:1,background:'rgba(255,255,255,.07)',margin:'0 16px' },
  roleChip:{ padding:'4px 12px',borderRadius:99,fontSize:12,fontWeight:600,display:'inline-block' },
  nav:     { display:'flex',flexDirection:'column',padding:'8px 12px',gap:2 },
  navItem: { display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:8,color:'rgba(255,255,255,.55)',fontSize:14,fontWeight:500,textDecoration:'none',transition:'all .15s',cursor:'pointer' },
  navActive:{ background:'rgba(255,255,255,.12)',color:'#fff' },
  navIcon: { fontSize:16,width:20,textAlign:'center',flexShrink:0 },
  badge:   { background:'#ef4444',color:'#fff',borderRadius:99,padding:'1px 7px',fontSize:11,fontWeight:700 },
  settingsRow:{ display:'flex',alignItems:'center',gap:8,padding:'10px 16px' },
  settingBtn: { background:'rgba(255,255,255,.08)',border:'none',borderRadius:8,width:36,height:36,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'rgba(255,255,255,.7)',transition:'background .15s',':hover':{background:'rgba(255,255,255,.15)'} },
  langMenu: { position:'absolute',bottom:'calc(100% + 8px)',left:0,background:'#1e293b',border:'1px solid rgba(255,255,255,.1)',borderRadius:10,overflow:'hidden',minWidth:140,boxShadow:'0 8px 24px rgba(0,0,0,.4)',zIndex:200 },
  langItem: { display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px',background:'none',border:'none',cursor:'pointer',width:'100%',color:'rgba(255,255,255,.7)',transition:'background .15s',gap:8 },
  langActive:{ background:'rgba(45,125,210,.3)',color:'#fff' },
  userCard: { display:'flex',alignItems:'center',gap:10,padding:'14px 16px 18px' },
  userAvatar:{ width:34,height:34,borderRadius:'50%',background:'rgba(255,255,255,.15)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:600,fontSize:13,flexShrink:0 },
  userInfo: { flex:1,minWidth:0 },
  userName: { color:'#fff',fontSize:13,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' },
  userEmail:{ color:'rgba(255,255,255,.4)',fontSize:11,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' },
  logoutBtn:{ background:'rgba(239,68,68,.15)',border:'1px solid rgba(239,68,68,.3)',borderRadius:8,color:'#f87171',cursor:'pointer',padding:'7px',display:'flex',alignItems:'center',justifyContent:'center',transition:'all .15s',flexShrink:0 },
};
