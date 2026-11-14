import React, { useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { LoginPage } from './features/auth/LoginPage';
import { Sidebar, NavItemKey } from './components/Sidebar';
import { Header } from './components/Header';
import { OverviewView } from './features/dashboard/OverviewView';
import { MyComplaintsView } from './features/dashboard/MyComplaintsView';
import { NewComplaintView } from './features/dashboard/NewComplaintView';
import { NotificationsView } from './features/dashboard/NotificationsView';
import { SettingsView } from './features/dashboard/SettingsView';
import { AllComplaintsAdminView } from './features/admin/AllComplaintsAdminView';
import { AdminAnalyticsView } from './features/admin/AdminAnalyticsView';
import { UsersAccessView } from './features/admin/UsersAccessView';
import { CategoriesLocationsView } from './features/admin/CategoriesLocationsView';
import { MaintenanceTasksView } from './features/maintenance/MaintenanceTasksView';
import { ComplaintDetailModal } from './features/user/ComplaintDetailModal';
import { NotificationDrawer } from './components/NotificationDrawer';
import { HelpDeskModal } from './components/HelpDeskModal';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { CampusMapView } from './features/campus/CampusMapView';
import { SolvedPerformanceView } from './features/solved/SolvedPerformanceView';
import { NotFoundPage } from './pages/NotFoundPage';
import { canOpenRoute, documentTitle, normalizePath, pathForNav, routeForPath, showsLoginWhenSignedOut } from './routes';

function setDescription(description: string) {
  const tag = document.querySelector('meta[name="description"]');
  if (tag) tag.setAttribute('content', description);
}

function AppContent() {
  const { isAuthenticated, booting, currentUser } = useApp();
  const [path, setPath] = useState(() => normalizePath(window.location.pathname));
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isHelpDeskOpen, setIsHelpDeskOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const onPop = () => setPath(normalizePath(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const go = (nextPath: string) => {
    const clean = normalizePath(nextPath);
    if (window.location.pathname !== clean) {
      window.history.pushState({}, '', clean);
    }
    setPath(clean);
  };

  const goNav = (nav: NavItemKey) => go(pathForNav(nav));

  const route = routeForPath(path);
  const allowed = route ? canOpenRoute(route.access, currentUser.role) : false;
  const signedOutPrivate = !isAuthenticated && !!route && !showsLoginWhenSignedOut(route.access);
  const hidden =
    path !== '/' &&
    !signedOutPrivate &&
    (!route || (isAuthenticated && !allowed && route.access !== 'filer'));

  useEffect(() => {
    if (booting) return;
    if (isAuthenticated && path === '/') go('/overview');
    if (isAuthenticated && (currentUser.role === 'admin' || currentUser.role === 'authority') && route?.nav === 'my-complaints') {
      go('/admin/complaints');
    }
    if (signedOutPrivate) go('/');
  }, [booting, currentUser.role, isAuthenticated, path, route, signedOutPrivate]);

  useEffect(() => {
    if (booting) {
      document.title = documentTitle('Opening');
      return;
    }
    if (!isAuthenticated && (path === '/' || (route && showsLoginWhenSignedOut(route.access)))) {
      document.title = documentTitle('Sign in');
      setDescription('Sign in or register to submit and track campus maintenance complaints at Bangladesh University of Professionals.');
      return;
    }
    if (hidden) {
      document.title = documentTitle('Page not found');
      setDescription('That page is not part of the BUP maintenance portal.');
      return;
    }
    if (route?.nav === 'my-complaints' && currentUser.role === 'maintenance') {
      document.title = documentTitle('Active tasks');
      setDescription('Open complaints currently assigned to you at Bangladesh University of Professionals.');
      return;
    }
    if (route) {
      document.title = documentTitle(route.title);
      setDescription(route.description);
    }
  }, [booting, currentUser.role, hidden, isAuthenticated, path, route]);

  if (booting) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-black text-white font-black text-xs flex items-center justify-center mx-auto">BUP</div>
          <p className="mt-4 text-sm text-zinc-500">Opening the maintenance portal...</p>
        </div>
      </div>
    );
  }

  if (hidden) {
    return <NotFoundPage onHome={() => go(isAuthenticated ? '/overview' : '/')} />;
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const currentNav = route?.nav || 'overview';
  const pageTitle = currentNav === 'my-complaints' && currentUser.role === 'maintenance'
    ? 'Active tasks'
    : (route?.title || 'Overview');

  return (
    <div className="app-shell min-h-screen bg-[#faf8f5] flex font-sans text-zinc-900 selection:bg-black selection:text-white">
      <Sidebar
        currentNav={currentNav}
        onNavigate={goNav}
        onOpenHelpDesk={() => setIsHelpDeskOpen(true)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Header
          pageTitle={pageTitle}
          onOpenNotifications={() => setIsNotificationOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          onNavigateSettings={() => goNav('settings')}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentNav === 'overview' && (
            <OverviewView
              onNewComplaint={() => goNav('new-complaint')}
              onViewAllComplaints={() => goNav(currentUser.role === 'admin' || currentUser.role === 'authority' ? 'all-complaints' : 'my-complaints')}
              onSelectComplaint={(id) => setSelectedComplaintId(id)}
              onOpenHelpDesk={() => setIsHelpDeskOpen(true)}
            />
          )}

          {currentNav === 'my-complaints' && (
            <MyComplaintsView
              onNewComplaint={() => goNav('new-complaint')}
              onSelectComplaint={(id) => setSelectedComplaintId(id)}
            />
          )}

          {currentNav === 'campus-map' && (
            <CampusMapView
              onSelectComplaint={(id) => setSelectedComplaintId(id)}
              onNewComplaintAtLocation={() => goNav('new-complaint')}
            />
          )}

          {currentNav === 'new-complaint' && !allowed && (
            <div className="max-w-xl p-8 rounded-2xl bg-white border border-zinc-200">
              <h1 className="text-2xl font-extrabold text-zinc-900">Use a general user account</h1>
              <p className="text-sm text-zinc-500 mt-2">Officers and administrators file a complaint by registering as a general user, then signing in with that account.</p>
            </div>
          )}

          {currentNav === 'new-complaint' && allowed && (
            <NewComplaintView
              onSuccess={(id) => {
                setSelectedComplaintId(id);
                goNav('my-complaints');
              }}
              onCancel={() => goNav('overview')}
            />
          )}

          {currentNav === 'notifications' && (
            <NotificationsView onSelectComplaint={(id) => setSelectedComplaintId(id)} />
          )}

          {currentNav === 'admin-analytics' && allowed && <AdminAnalyticsView />}

          {currentNav === 'all-complaints' && allowed && (
            <AllComplaintsAdminView onSelectComplaint={(id) => setSelectedComplaintId(id)} />
          )}

          {currentNav === 'users-access' && allowed && <UsersAccessView />}

          {currentNav === 'categories-locations' && allowed && <CategoriesLocationsView />}

          {currentNav === 'settings' && <SettingsView />}

          {currentNav === 'maintenance-tasks' && allowed && (
            <MaintenanceTasksView onSelectComplaint={(id) => setSelectedComplaintId(id)} />
          )}

          {currentNav === 'solved' && allowed && <SolvedPerformanceView />}
        </main>

        <footer className="px-4 sm:px-8 py-3 text-[11px] text-zinc-400 border-t border-zinc-200 bg-white">
          <a href="https://bup.edu.bd/" target="_blank" rel="noopener noreferrer" className="hover:text-black">
            Bangladesh University of Professionals
          </a>
        </footer>
      </div>

      <ComplaintDetailModal complaintId={selectedComplaintId} onClose={() => setSelectedComplaintId(null)} />
      <NotificationDrawer
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        onSelectComplaint={(id) => setSelectedComplaintId(id)}
      />
      <HelpDeskModal isOpen={isHelpDeskOpen} onClose={() => setIsHelpDeskOpen(false)} />
      <CommandPaletteModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onToggle={() => setIsSearchOpen((open) => !open)}
        onSelectComplaint={(id) => setSelectedComplaintId(id)}
        onNewComplaint={() => goNav('new-complaint')}
      />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
