'use client';
import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import BottomNav from './BottomNav';

export default function AppShell({ children, breadcrumbs = [] }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--bg-app)' }}>
      {/* Sidebar */}
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main column */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header
          onMenuOpen={() => setSidebarOpen(true)}
          breadcrumbs={breadcrumbs}
        />
        <main className="flex-1 overflow-y-auto">
          {/* fade-in on each render */}
          <div
            key={breadcrumbs.map(b => b.label).join('-')}
            className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 lg:pb-8 animate-fade-in"
          >
            {children}
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  );
}
