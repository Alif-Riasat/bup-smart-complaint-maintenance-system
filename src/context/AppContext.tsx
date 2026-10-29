import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import { BUP_EMERGENCY_CONTACTS, FUNCTIONAL_REQUIREMENTS } from '../data/seedData';
import {
  CampusLocation,
  Complaint,
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
  Department,
  EmergencyContactItem,
  EscalationRecord,
  FunctionalRequirement,
  MaintenanceStaff,
  NotificationItem,
  StatusHistoryItem,
  User,
} from '../types/complaint';

const IDLE_MS = 30 * 60 * 1000;
const EMPTY_USER: User = {
  id: '',
  name: 'BUP User',
  email: '',
  phone: '',
  userType: 'student',
  role: 'student',
  studentOrEmployeeId: '',
  departmentName: '',
};

interface PortalState {
  user: User;
  complaints: Complaint[];
  categories: ComplaintCategory[];
  locations: CampusLocation[];
  departments: Department[];
  maintenanceStaff: MaintenanceStaff[];
  statusHistory: StatusHistoryItem[];
  notifications: NotificationItem[];
  emergencyContacts: EmergencyContactItem[];
  escalations?: EscalationRecord[];
  users: User[];
}

interface AppContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  availableUsers: User[];
  isAuthenticated: boolean;
  booting: boolean;
  sessionNotice: string;
  clearSessionNotice: () => void;
  lastSyncedAt: string;
  login: (identifier: string, password: string, remember?: boolean) => Promise<void>;
  logout: () => void;
  registerUser: (userData: {
    name: string;
    email: string;
    phone: string;
    password: string;
    studentOrEmployeeId: string;
    departmentName: string;
    role: 'student' | 'faculty' | 'officer';
    securityQuestion: string;
    securityAnswer: string;
  }) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<string>;
  saveSecurityQuestion: (currentPassword: string, securityQuestion: string, securityAnswer: string) => Promise<void>;
  complaints: Complaint[];
  categories: ComplaintCategory[];
  locations: CampusLocation[];
  departments: Department[];
  maintenanceStaff: MaintenanceStaff[];
  statusHistory: StatusHistoryItem[];
  notifications: NotificationItem[];
  emergencyContacts: EmergencyContactItem[];
  escalations: EscalationRecord[];
  functionalRequirements: FunctionalRequirement[];
  toggleUserFlag: (userId: string, reason?: string) => Promise<void>;
  submitComplaint: (data: {
    title: string;
    description: string;
    categoryId: string;
    locationId: string;
    priority: ComplaintPriority;
    imageUrl?: string;
    videoUrl?: string;
    isEmergency?: boolean;
  }) => Promise<Complaint>;
  assignComplaint: (complaintId: string, staffId: string, priority?: ComplaintPriority, notes?: string) => Promise<void>;
  updateStaffProgress: (
    complaintId: string,
    newStatus: 'In Progress' | 'Resolved' | 'On Hold' | 'Escalated',
    remarks: string,
    resolutionImageUrl?: string
  ) => Promise<void>;
  rejectComplaint: (complaintId: string, reason: string) => Promise<void>;
  closeComplaint: (complaintId: string, remarks?: string) => Promise<void>;
  submitFeedback: (complaintId: string, rating: number, comment?: string) => Promise<void>;
  requestFollowUp: (complaintId: string, note: string) => Promise<void>;
  logPhoneUpdate: (complaintId: string, note: string) => Promise<void>;
  sendProgressUpdate: (complaintId: string, note: string) => Promise<void>;
  passToHigherAuthority: (complaintId: string, remarks: string) => Promise<void>;
  addMaintenanceOfficer: (data: {
    name: string;
    email: string;
    phone: string;
    employeeId: string;
    departmentId: string;
    specialization: string;
    password: string;
  }) => Promise<void>;
  updateNotificationPrefs: (prefs: { notifyEmail: boolean; notifySms: boolean }) => Promise<void>;
  addCategory: (category: Omit<ComplaintCategory, 'id'>) => Promise<void>;
  addLocation: (location: Omit<CampusLocation, 'id'>) => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  resetToDefaultData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function readToken() {
  return sessionStorage.getItem('bup_token') || localStorage.getItem('bup_token') || '';
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [booting, setBooting] = useState(true);
  const [sessionNotice, setSessionNotice] = useState('');
  const [lastSyncedAt, setLastSyncedAt] = useState('');
  const [currentUser, setCurrentUser] = useState<User>(EMPTY_USER);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [categories, setCategories] = useState<ComplaintCategory[]>([]);
  const [locations, setLocations] = useState<CampusLocation[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [maintenanceStaff, setMaintenanceStaff] = useState<MaintenanceStaff[]>([]);
  const [statusHistory, setStatusHistory] = useState<StatusHistoryItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [escalations, setEscalations] = useState<EscalationRecord[]>([]);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContactItem[]>(BUP_EMERGENCY_CONTACTS);

  const clearSession = useCallback((notice?: string) => {
    sessionStorage.removeItem('bup_token');
    localStorage.removeItem('bup_token');
    setIsAuthenticated(false);
    setCurrentUser(EMPTY_USER);
    if (notice) setSessionNotice(notice);
  }, []);

  const applyState = useCallback((data: PortalState) => {
    setCurrentUser(data.user);
    setAvailableUsers(data.users || []);
    setComplaints(data.complaints || []);
    setCategories(data.categories || []);
    setLocations(data.locations || []);
    setDepartments(data.departments || []);
    setMaintenanceStaff(data.maintenanceStaff || []);
    setStatusHistory(data.statusHistory || []);
    setNotifications(data.notifications || []);
    setEscalations(data.escalations || []);
    if (data.emergencyContacts?.length) setEmergencyContacts(data.emergencyContacts);
    setLastSyncedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  }, []);

  const call = useCallback(async <T,>(path: string, options?: RequestInit): Promise<T> => {
    try {
      return await api<T>(path, options);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401 && !path.includes('/api/auth/login')) {
        clearSession(error.message);
      }
      throw error;
    }
  }, [clearSession]);

  const refresh = useCallback(async (touch = false) => {
    const data = await call<PortalState>('/api/state', {
      headers: { 'X-Session-Touch': touch ? '1' : '0' },
    });
    applyState(data);
  }, [applyState, call]);

  useEffect(() => {
    const token = readToken();
    if (!token) {
      setBooting(false);
      return;
    }
    sessionStorage.setItem('bup_token', token);
    refresh(true)
      .then(() => setIsAuthenticated(true))
      .catch(() => clearSession())
      .finally(() => setBooting(false));
  }, [clearSession, refresh]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const poll = window.setInterval(() => {
      refresh(false).catch(() => undefined);
    }, 8000);
    return () => window.clearInterval(poll);
  }, [isAuthenticated, refresh]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let idleTimer = window.setTimeout(() => {
      clearSession('Your session ended after 30 minutes of inactivity.');
    }, IDLE_MS);
    let lastTouch = 0;
    const onActivity = () => {
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        clearSession('Your session ended after 30 minutes of inactivity.');
      }, IDLE_MS);
      const now = Date.now();
      if (now - lastTouch > 60 * 1000) {
        lastTouch = now;
        call('/api/auth/touch', { method: 'POST' }).catch(() => undefined);
      }
    };
    const events = ['pointerdown', 'keydown'] as const;
    events.forEach((eventName) => window.addEventListener(eventName, onActivity));
    return () => {
      window.clearTimeout(idleTimer);
      events.forEach((eventName) => window.removeEventListener(eventName, onActivity));
    };
  }, [call, clearSession, isAuthenticated]);

  const login = async (identifier: string, password: string, remember = true) => {
    const data = await call<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
    sessionStorage.setItem('bup_token', data.token);
    if (remember) localStorage.setItem('bup_token', data.token);
    else localStorage.removeItem('bup_token');
    setSessionNotice('');
    await refresh(true);
    setIsAuthenticated(true);
  };

  const logout = () => {
    call('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
    clearSession();
  };

  const registerUser = async (userData: {
    name: string;
    email: string;
    phone: string;
    password: string;
    studentOrEmployeeId: string;
    departmentName: string;
    role: 'student' | 'faculty' | 'officer';
    securityQuestion: string;
    securityAnswer: string;
  }) => {
    await call('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    const data = await call<{ message: string }>('/api/auth/password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return data.message;
  };

  const saveSecurityQuestion = async (currentPassword: string, securityQuestion: string, securityAnswer: string) => {
    takeState(await call('/api/auth/security-question', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, securityQuestion, securityAnswer }),
    }));
  };

  const takeState = (data: PortalState | { state: PortalState }) => {
    if ('state' in data && data.state?.complaints) applyState(data.state);
    else if ('complaints' in data) applyState(data as PortalState);
  };

  const submitComplaint: AppContextType['submitComplaint'] = async (payload) => {
    const data = await call<{ complaint: Complaint; state: PortalState }>('/api/complaints', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    applyState(data.state);
    return data.complaint;
  };

  const assignComplaint: AppContextType['assignComplaint'] = async (complaintId, staffId, priority, notes) => {
    takeState(await call(`/api/complaints/${complaintId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ staffId, priority, notes }),
    }));
  };

  const updateStaffProgress: AppContextType['updateStaffProgress'] = async (complaintId, newStatus, remarks) => {
    const status: ComplaintStatus = newStatus;
    takeState(await call(`/api/complaints/${complaintId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status, remarks }),
    }));
  };

  const rejectComplaint = async (complaintId: string, reason: string) => {
    takeState(await call(`/api/complaints/${complaintId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }));
  };

  const closeComplaint = async (complaintId: string, remarks?: string) => {
    takeState(await call(`/api/complaints/${complaintId}/close`, {
      method: 'POST',
      body: JSON.stringify({ remarks }),
    }));
  };

  const submitFeedback = async (complaintId: string, rating: number, comment?: string) => {
    takeState(await call(`/api/complaints/${complaintId}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ rating, comment }),
    }));
  };

  const requestFollowUp = async (complaintId: string, note: string) => {
    takeState(await call(`/api/complaints/${complaintId}/follow-up`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    }));
  };

  const logPhoneUpdate = async (complaintId: string, note: string) => {
    takeState(await call(`/api/complaints/${complaintId}/phone`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    }));
  };

  const sendProgressUpdate = async (complaintId: string, note: string) => {
    takeState(await call(`/api/complaints/${complaintId}/progress`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    }));
  };

  const passToHigherAuthority = async (complaintId: string, remarks: string) => {
    takeState(await call(`/api/complaints/${complaintId}/escalate`, {
      method: 'POST',
      body: JSON.stringify({ remarks }),
    }));
  };

  const addMaintenanceOfficer: AppContextType['addMaintenanceOfficer'] = async (data) => {
    takeState(await call('/api/officers', { method: 'POST', body: JSON.stringify(data) }));
  };

  const toggleUserFlag = async (userId: string, reason?: string) => {
    takeState(await call(`/api/users/${userId}/flag`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }));
  };

  const updateNotificationPrefs = async (prefs: { notifyEmail: boolean; notifySms: boolean }) => {
    takeState(await call('/api/me/notifications', {
      method: 'PATCH',
      body: JSON.stringify(prefs),
    }));
  };

  const addCategory: AppContextType['addCategory'] = async (category) => {
    takeState(await call('/api/categories', { method: 'POST', body: JSON.stringify(category) }));
  };

  const addLocation: AppContextType['addLocation'] = async (location) => {
    takeState(await call('/api/locations', { method: 'POST', body: JSON.stringify(location) }));
  };

  const markNotificationAsRead = async (notificationId: string) => {
    takeState(await call(`/api/notifications/${notificationId}/read`, { method: 'POST' }));
  };

  const markAllNotificationsAsRead = async () => {
    takeState(await call('/api/notifications/read-all', { method: 'POST' }));
  };

  const resetToDefaultData = async () => {
    await call('/api/admin/reset', { method: 'POST' });
    clearSession('Demo data was restored. Sign in again.');
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        availableUsers,
        isAuthenticated,
        booting,
        sessionNotice,
        clearSessionNotice: () => setSessionNotice(''),
        lastSyncedAt,
        login,
        logout,
        registerUser,
        changePassword,
        saveSecurityQuestion,
        complaints,
        categories,
        locations,
        departments,
        maintenanceStaff,
        statusHistory,
        notifications,
        emergencyContacts,
        escalations,
        functionalRequirements: FUNCTIONAL_REQUIREMENTS,
        toggleUserFlag,
        submitComplaint,
        assignComplaint,
        updateStaffProgress,
        rejectComplaint,
        closeComplaint,
        submitFeedback,
        requestFollowUp,
        logPhoneUpdate,
        sendProgressUpdate,
        passToHigherAuthority,
        addMaintenanceOfficer,
        updateNotificationPrefs,
        addCategory,
        addLocation,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        resetToDefaultData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
