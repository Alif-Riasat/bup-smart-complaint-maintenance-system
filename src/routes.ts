import { NavItemKey } from './components/Sidebar';

export type PageAccess = 'any' | 'admin' | 'maintenance' | 'operations' | 'filer' | 'community';

export interface PageRoute {
  path: string;
  nav: NavItemKey;
  title: string;
  description: string;
  access: PageAccess;
}

const SITE = 'BUP Smart Complaint & Maintenance';

export const PAGE_ROUTES: PageRoute[] = [
  {
    path: '/overview',
    nav: 'overview',
    title: 'Overview',
    description: 'Track your BUP campus maintenance complaints and their current stage.',
    access: 'any',
  },
  {
    path: '/complaints/new',
    nav: 'new-complaint',
    title: 'Submit a complaint',
    description: 'Submit a campus maintenance complaint with a category, location, priority, and photo proof.',
    access: 'filer',
  },
  {
    path: '/complaints',
    nav: 'my-complaints',
    title: 'My complaints',
    description: 'Review every complaint you have submitted to Bangladesh University of Professionals.',
    access: 'any',
  },
  {
    path: '/campus-map',
    nav: 'campus-map',
    title: 'Campus map',
    description: 'See maintenance complaints by building on the BUP campus.',
    access: 'community',
  },
  {
    path: '/notifications',
    nav: 'notifications',
    title: 'Notifications',
    description: 'In-app updates for your BUP maintenance complaints.',
    access: 'any',
  },
  {
    path: '/settings',
    nav: 'settings',
    title: 'Settings',
    description: 'Review your BUP account. Complaint updates appear in the portal.',
    access: 'any',
  },
  {
    path: '/work-orders',
    nav: 'maintenance-tasks',
    title: 'Assigned work orders',
    description: 'Maintenance officers update assigned complaints as in progress, done, on hold, or escalated.',
    access: 'maintenance',
  },
  {
    path: '/admin/analytics',
    nav: 'admin-analytics',
    title: 'Analytics',
    description: 'Campus maintenance charts for status, priority, locations, and resolution targets.',
    access: 'admin',
  },
  {
    path: '/admin/complaints',
    nav: 'all-complaints',
    title: 'All complaints',
    description: 'Review, assign, and close every campus maintenance complaint.',
    access: 'admin',
  },
  {
    path: '/admin/users',
    nav: 'users-access',
    title: 'Users and access',
    description: 'Review BUP accounts and add maintenance officers.',
    access: 'admin',
  },
  {
    path: '/admin/categories',
    nav: 'categories-locations',
    title: 'Categories and locations',
    description: 'Manage complaint categories and campus locations.',
    access: 'admin',
  },
  {
    path: '/solved',
    nav: 'solved',
    title: 'Solved work',
    description: 'Resolved complaints and officer performance for Bangladesh University of Professionals.',
    access: 'operations',
  },
];

export function normalizePath(pathname: string) {
  if (!pathname || pathname === '/') return '/';
  return pathname.replace(/\/+$/, '') || '/';
}

export function routeForPath(pathname: string) {
  const path = normalizePath(pathname);
  return PAGE_ROUTES.find((route) => route.path === path) || null;
}

export function pathForNav(nav: NavItemKey) {
  return PAGE_ROUTES.find((route) => route.nav === nav)?.path || '/overview';
}

export function documentTitle(title: string) {
  return `${title} · ${SITE}`;
}

export function canOpenRoute(access: PageAccess, role: string) {
  if (access === 'any') return true;
  if (access === 'admin') return role === 'admin' || role === 'authority';
  if (access === 'maintenance') return role === 'maintenance';
  if (access === 'operations') return role === 'admin' || role === 'authority' || role === 'maintenance';
  if (access === 'filer') return role === 'student' || role === 'faculty';
  if (access === 'community') return role !== 'maintenance';
  return false;
}

export function showsLoginWhenSignedOut(access: PageAccess) {
  return access === 'any' || access === 'filer' || access === 'community';
}
