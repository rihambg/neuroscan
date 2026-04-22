// NeuroScan - App Layout Wrapper
import React from 'react';
import Sidebar from './Sidebar';
import TopBar  from './TopBar';

export default function AppLayout({ title, children, pendingCount }) {
  return (
    <div className="app-layout">
      <Sidebar pendingCount={pendingCount} />
      <div className="main-content">
        <TopBar title={title} />
        <div className="page-content page-enter">
          {children}
        </div>
      </div>
    </div>
  );
}
