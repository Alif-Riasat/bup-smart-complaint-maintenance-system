export type UserRole = 'student' | 'faculty' | 'officer' | 'maintenance' | 'admin' | 'authority';

export type ComplaintPriority = 'Low' | 'Normal' | 'High' | 'Urgent' | 'Medium' | 'Emergency';

export type ComplaintStatus = 'Pending' | 'Assigned' | 'In Progress' | 'On Hold' | 'Escalated' | 'Resolved' | 'Closed' | 'Rejected';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  userType: 'student' | 'faculty' | 'officer' | 'staff' | 'admin';
  role: UserRole;
  studentOrEmployeeId: string;
  departmentName: string;
  avatar?: string;
  
  // Anti-Spam & Student Red-Flag Tracking
  isRedFlagged?: boolean;
  flagReason?: string;
  flaggedDate?: string;
  spamReportCount?: number;
  notifyEmail?: boolean;
  notifySms?: boolean;
  securityQuestion?: string;
  staffId?: string;
}

export interface ComplaintCategory {
  id: string;
  name: string;
  description: string;
  iconName: string;
  departmentId: string;
  defaultPriority: ComplaintPriority;
}

export interface CampusLocation {
  id: string;
  buildingName: string;
  floor: string;
  roomArea: string;
  zone?: 'North' | 'South' | 'East' | 'West' | 'Central';
}

export interface EscalationRecord {
  id: string;
  complaintId: string;
  complaintTitle: string;
  fromStaffId: string;
  fromStaffName: string;
  toStaffName: string;
  toStaffRole?: string;
  kind: 'auto' | 'manual';
  remarks: string;
  date: string;
}

export interface StatusHistoryItem {
  id: string;
  complaintId: string;
  status: ComplaintStatus;
  updatedBy: string;
  updatedByName: string;
  role: string;
  updatedDate: string;
  remarks: string;
}

export interface ComplaintAssignment {
  id: string;
  complaintId: string;
  staffId: string;
  staffName: string;
  departmentId: string;
  assignedDate: string;
  assignmentStatus?: string;
  notes?: string;
}

export interface Complaint {
  id: string; // e.g. BUP-CMP-2026-001
  title: string;
  description: string;
  categoryId: string;
  categoryName: string;
  locationId: string;
  buildingName: string;
  floor: string;
  roomArea: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  escalated?: boolean;
  imageUrl?: string;
  resolutionImageUrl?: string;
  
  // Submitter details
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  userType: string;
  studentOrEmployeeId: string;
  submissionDate: string;
  submitterRedFlagged?: boolean;
  
  // Assignment details
  assignedStaffId?: string;
  assignedStaffName?: string;
  assignedStaffRole?: string;
  departmentId?: string;
  departmentName?: string;
  assignedDate?: string;
  
  // Resolution details
  resolvedDate?: string;
  resolutionRemarks?: string;
  closedDate?: string;
  rejectionReason?: string;
  
  // Feedback
  feedbackRating?: number; // 1 to 5
  feedbackComment?: string;
  feedbackDate?: string;

  isEmergency?: boolean;
  followUpCount?: number;
  lastFollowUpAt?: string;
  slaDueAt?: string;
  slaBreached?: boolean;
  acknowledgement?: string;
  canFollowUp?: boolean;
  followUpEligibleAt?: string;
  attachmentType?: 'none' | 'photo' | 'video';
  videoUrl?: string;
}

export interface MaintenanceStaff {
  id: string;
  name: string;
  email: string;
  phone: string;
  departmentId: string;
  departmentName: string;
  specialization: string;
  activeTasksCount: number;
}

export interface Department {
  id: string;
  name: string;
  contactInfo: string;
  headName: string;
  email: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  complaintId: string;
  message: string;
  notificationDate: string;
  isRead: boolean;
  type: 'status_update' | 'assignment' | 'resolution' | 'rejection' | 'feedback' | 'spam_warning' | 'acknowledgement' | 'follow_up' | 'emergency' | 'sla_breach';
  channel?: 'in_app' | 'email' | 'sms' | 'phone';
}

export interface EmergencyContactItem {
  id: string;
  category: 'West Campus Lifts' | 'East Campus Lifts' | 'Engineering Services' | 'Important Contacts';
  name: string;
  designation?: string;
  contactNumber: string;
  altContact?: string;
  email?: string;
  instruction?: string;
}

export interface FunctionalRequirement {
  id: string; // e.g. FR-01
  title: string;
  description: string;
  priority: 'Mandatory' | 'Desirable' | 'Optional';
  status: 'Implemented' | 'Verified';
  implementedIn: string;
  actionKey?: string;
}
