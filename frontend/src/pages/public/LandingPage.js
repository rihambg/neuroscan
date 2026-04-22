// NeuroScan - Landing Page
import React from 'react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div style={s.page}>
      {/* Header */}
      <header style={s.header}>
        <div style={s.logo}>
          <div style={s.logoIcon}>N</div>
          <span style={s.logoText}>NeuroScan</span>
        </div>
        <nav style={s.nav}>
          <Link to="/login"    style={s.navLink}>Sign in</Link>
          <Link to="/register" style={s.ctaBtn}>Get started</Link>
        </nav>
      </header>

      {/* Hero */}
      <main style={s.hero}>
        <div style={s.heroBadge}>🏥 Brain MRI Consultation Platform</div>
        <h1 style={s.heroTitle}>
          Precision diagnosis,<br />
          <span style={s.heroAccent}>one scan at a time.</span>
        </h1>
        <p style={s.heroSub}>
          NeuroScan connects patients with specialist neurologists for
          seamless MRI review, secure reporting, and expert diagnosis — 
          all on a single professional platform.
        </p>
        <div style={s.heroBtns}>
          <Link to="/register" style={s.heroCtaBtn}>Request a consultation</Link>
          <Link to="/login"    style={s.heroSecBtn}>Sign in to your account</Link>
        </div>

        {/* Stats row */}
        <div style={s.stats}>
          {[
            { n: '3 000+', l: 'Scans reviewed' },
            { n: '150+',   l: 'Specialist doctors' },
            { n: '99.8%',  l: 'Platform uptime' },
            { n: '< 48h',  l: 'Average report time' },
          ].map(item => (
            <div key={item.l} style={s.stat}>
              <div style={s.statNum}>{item.n}</div>
              <div style={s.statLbl}>{item.l}</div>
            </div>
          ))}
        </div>
      </main>

      {/* Features */}
      <section style={s.features}>
        <h2 style={{ textAlign:'center', marginBottom: 12, color:'var(--navy)' }}>How it works</h2>
        <p style={{ textAlign:'center', color:'var(--text-secondary)', marginBottom: 40, maxWidth: 520, margin:'0 auto 40px' }}>
          A straightforward consultation workflow built for both patients and doctors.
        </p>
        <div style={s.featureGrid}>
          {FEATURES.map(f => (
            <div key={f.title} style={s.featureCard}>
              <div style={s.featureIcon}>{f.icon}</div>
              <h3 style={{ fontSize: 15, marginBottom: 6 }}>{f.title}</h3>
              <p style={{ fontSize: 13.5, lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA strip */}
      <section style={s.ctaStrip}>
        <h2 style={{ color:'#fff', marginBottom: 8 }}>Ready to get started?</h2>
        <p style={{ color:'rgba(255,255,255,.7)', marginBottom: 24 }}>
          Register as a patient or a specialist doctor today.
        </p>
        <Link to="/register" style={s.ctaStripBtn}>Create your account →</Link>
      </section>

      {/* Footer */}
      <footer style={s.footer}>
        <div style={s.footerLogo}>
          <div style={s.logoIcon}>N</div>
          <span style={{ fontWeight:600, color:'var(--navy)' }}>NeuroScan</span>
        </div>
        <p style={{ fontSize: 12, color:'var(--text-muted)' }}>
          © {new Date().getFullYear()} NeuroScan · BRISC 2025 Academic Project
        </p>
      </footer>
    </div>
  );
}

const FEATURES = [
  { icon:'👤', title:'Create your profile', desc:'Register as a patient or specialist doctor. Secure, verified, and confidential.' },
  { icon:'🔗', title:'Connect with a doctor', desc:'Search for available neurologists and send a consultation request in seconds.' },
  { icon:'🧠', title:'Upload your MRI', desc:'Drag & drop your MRI files securely. Supports JPEG, PNG, and DICOM formats.' },
  { icon:'📋', title:'Receive your report', desc:'Your doctor reviews the scan and shares a detailed diagnosis directly with you.' },
];

const s = {
  page:      { minHeight:'100vh', background:'#fff', fontFamily:'Inter, sans-serif' },
  header:    { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 64px', borderBottom:'1px solid var(--border-light)', position:'sticky', top:0, background:'rgba(255,255,255,.97)', backdropFilter:'blur(8px)', zIndex:50 },
  logo:      { display:'flex', alignItems:'center', gap:10 },
  logoIcon:  { width:36, height:36, background:'linear-gradient(135deg,#2d7dd2,#0e8a7c)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:18 },
  logoText:  { fontWeight:700, fontSize:18, color:'var(--navy)' },
  nav:       { display:'flex', alignItems:'center', gap:16 },
  navLink:   { fontSize:14, color:'var(--text-secondary)', fontWeight:500, textDecoration:'none' },
  ctaBtn:    { background:'var(--blue)', color:'#fff', padding:'8px 20px', borderRadius:8, fontSize:14, fontWeight:500, textDecoration:'none' },
  hero:      { padding:'96px 64px 80px', maxWidth:860, margin:'0 auto', textAlign:'center' },
  heroBadge: { display:'inline-block', background:'var(--blue-light)', color:'var(--blue)', padding:'5px 14px', borderRadius:99, fontSize:13, fontWeight:500, marginBottom:24 },
  heroTitle: { fontSize:'clamp(2rem,5vw,3.25rem)', fontWeight:700, color:'var(--navy)', lineHeight:1.15, marginBottom:24 },
  heroAccent:{ color:'var(--blue-mid)' },
  heroSub:   { fontSize:17, color:'var(--text-secondary)', lineHeight:1.7, maxWidth:600, margin:'0 auto 36px' },
  heroBtns:  { display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap', marginBottom:64 },
  heroCtaBtn:{ background:'var(--blue)', color:'#fff', padding:'13px 30px', borderRadius:10, fontSize:15, fontWeight:600, textDecoration:'none', boxShadow:'0 4px 14px rgba(26,86,160,.35)' },
  heroSecBtn:{ background:'var(--surface)', color:'var(--blue)', border:'1.5px solid var(--border)', padding:'13px 30px', borderRadius:10, fontSize:15, fontWeight:500, textDecoration:'none' },
  stats:     { display:'flex', justifyContent:'center', gap:40, flexWrap:'wrap' },
  stat:      { textAlign:'center' },
  statNum:   { fontSize:28, fontWeight:700, color:'var(--navy)' },
  statLbl:   { fontSize:13, color:'var(--text-secondary)', marginTop:4 },
  features:  { padding:'80px 64px', background:'var(--surface-2)' },
  featureGrid:{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:24, maxWidth:960, margin:'0 auto' },
  featureCard:{ background:'#fff', borderRadius:16, padding:28, border:'1px solid var(--border-light)', boxShadow:'var(--shadow-sm)' },
  featureIcon:{ fontSize:32, marginBottom:14 },
  ctaStrip:  { background:'linear-gradient(135deg,var(--navy),var(--blue))', padding:'72px 64px', textAlign:'center' },
  ctaStripBtn:{ background:'#fff', color:'var(--blue)', padding:'13px 30px', borderRadius:10, fontSize:15, fontWeight:600, textDecoration:'none', display:'inline-block' },
  footer:    { padding:'28px 64px', display:'flex', alignItems:'center', justifyContent:'space-between', borderTop:'1px solid var(--border-light)' },
  footerLogo:{ display:'flex', alignItems:'center', gap:8 },
};
