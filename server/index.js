import crypto from 'crypto';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import { DB_NAME, mysqlOptions } from './db.js';
import {
  ACADEMIC_DEPARTMENTS,
  SECURITY_QUESTIONS,
  SECTION_AUTHORITIES,
  escalationTarget,
  ensureAuthorityRecords,
  ensureCanteenOfficer,
  normalizeCampusLocations,
} from './catalog.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 4000);
const IDLE_MS = Number(process.env.SESSION_IDLE_MINUTES || 30) * 60 * 1000;
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const BACKUP_DIR = path.join(__dirname, 'backups');

const SLA_HOURS = { Urgent: 2, High: 8, Normal: 24, Low: 72 };
const FOLLOWUP_HOURS = { Urgent: 0.5, High: 2, Normal: 8, Low: 24 };
const CATEGORY_DEPT = {
  'cat-elec': 'dept-electrical',
  'cat-ac': 'dept-electrical',
  'cat-lift': 'dept-electrical',
  'cat-ict': 'dept-ict',
  'cat-water': 'dept-estate',
  'cat-civil': 'dept-estate',
  'cat-sports': 'dept-estate',
  'cat-medical': 'dept-staff-medical',
  'cat-library': 'dept-staff-library',
  'cat-classroom': 'dept-estate',
  'cat-canteen': 'dept-canteen',
  'cat-office': 'dept-estate',
  'cat-other': 'dept-misc',
  'cat-harassment': 'dept-harassment',
  'cat-drug': 'dept-drug',
  'cat-bullying': 'dept-security-control',
  'cat-racism': 'dept-security-control',
  'cat-violation': 'dept-security-control',
  'cat-ragging': 'dept-security-control',
};
const CATEGORY_STAFF = {
  'cat-harassment': 'staff-ayesha',
  'cat-drug': 'staff-kamrul',
  'cat-bullying': 'staff-hasan',
  'cat-racism': 'staff-hasan',
  'cat-violation': 'staff-hasan',
  'cat-ragging': 'staff-hasan',
  'cat-other': 'staff-minhaz',
  'cat-canteen': 'staff-canteen',
  'cat-medical': 'staff-medical',
  'cat-library': 'staff-library',
  'cat-classroom': 'staff-academic',
  'cat-office': 'staff-establishment',
  'cat-sports': 'staff-sports-centre',
};
for (const office of SECTION_AUTHORITIES) {
  if (office.categoryId) CATEGORY_STAFF[office.categoryId] = office.id;
}
const CATEGORY_META = {
  'cat-elec': { iconName: 'Zap', defaultPriority: 'High' },
  'cat-ac': { iconName: 'Fan', defaultPriority: 'Normal' },
  'cat-ict': { iconName: 'Wifi', defaultPriority: 'Normal' },
  'cat-water': { iconName: 'Droplets', defaultPriority: 'Normal' },
  'cat-lift': { iconName: 'Building2', defaultPriority: 'Urgent' },
  'cat-civil': { iconName: 'Hammer', defaultPriority: 'Low' },
  'cat-sports': { iconName: 'Trophy', defaultPriority: 'Normal' },
  'cat-medical': { iconName: 'HeartPulse', defaultPriority: 'High' },
  'cat-library': { iconName: 'Library', defaultPriority: 'Normal' },
  'cat-classroom': { iconName: 'School', defaultPriority: 'Normal' },
  'cat-canteen': { iconName: 'Utensils', defaultPriority: 'Normal' },
  'cat-office': { iconName: 'Briefcase', defaultPriority: 'Normal' },
  'cat-harassment': { iconName: 'ShieldAlert', defaultPriority: 'Urgent' },
  'cat-drug': { iconName: 'Pill', defaultPriority: 'Urgent' },
  'cat-bullying': { iconName: 'UserX', defaultPriority: 'High' },
  'cat-racism': { iconName: 'Flag', defaultPriority: 'High' },
  'cat-violation': { iconName: 'Scale', defaultPriority: 'High' },
  'cat-ragging': { iconName: 'Users', defaultPriority: 'Urgent' },
  'cat-other': { iconName: 'MoreHorizontal', defaultPriority: 'Normal' },
};
const SELF_REGISTER_ROLES = new Set(['student', 'faculty', 'officer']);
const ROLE_IDS = {
  student: 'ROLE-STU',
  faculty: 'ROLE-FAC',
  officer: 'ROLE-OFF',
  maintenance: 'ROLE-MNT',
  admin: 'ROLE-ADM',
};
const OPEN_STATUSES = new Set(['Pending', 'Assigned', 'In Progress', 'On Hold', 'Escalated']);
const OFFICER_STATUSES = new Set(['In Progress', 'Resolved', 'On Hold', 'Escalated']);

const pool = mysql.createPool(mysqlOptions(DB_NAME));
let dbReady = false;

const app = express();
app.use(express.json({ limit: '15mb' }));
app.use('/uploads', express.static(UPLOAD_DIR));

function pad(n) {
  return String(n).padStart(2, '0');
}

function formatSql(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function parseSql(value) {
  if (!value) return new Date();
  const parsed = new Date(String(value).replace(' ', 'T'));
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function nowSql() {
  return formatSql(new Date());
}

function issueFacedSql(value) {
  const raw = String(value || '').trim();
  if (!raw) return { error: 'Choose the date and time you faced the issue.' };
  const match = raw.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})(?::(\d{2}))?/);
  if (!match) return { error: 'Choose a valid date and time for when you faced the issue.' };
  const sql = `${match[1]} ${match[2]}:${match[3] || '00'}`;
  const when = new Date(`${match[1]}T${match[2]}:${match[3] || '00'}`);
  if (Number.isNaN(when.getTime())) return { error: 'Choose a valid date and time for when you faced the issue.' };
  if (when.getTime() > Date.now() + 60 * 1000) {
    return { error: 'The time you faced the issue cannot be in the future.' };
  }
  return { sql };
}

function addHours(sqlValue, hours) {
  const date = parseSql(sqlValue);
  date.setTime(date.getTime() + hours * 3600000);
  return formatSql(date);
}

function normalizePriority(priority) {
  if (priority === 'Medium') return 'Normal';
  if (priority === 'Emergency') return 'Urgent';
  return SLA_HOURS[priority] ? priority : 'Normal';
}

function nid() {
  return `NOT-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`;
}

function hid() {
  return `HIS-${Date.now().toString(36)}-${crypto.randomBytes(2).toString('hex')}`;
}

function mapUser(row) {
  return {
    id: row.User_ID_PK,
    name: row.Name,
    email: row.Email,
    phone: row.Phone,
    userType: row.User_Type,
    role: row.Role_Name,
    studentOrEmployeeId: row.Student_Or_Employee_ID,
    departmentName: row.Department_Name,
    isRedFlagged: !!row.Is_Flagged_Spammer,
    flagReason: row.Flag_Reason || undefined,
    flaggedDate: row.Flagged_Date || undefined,
    notifyEmail: row.Notify_Email !== 0 && row.Notify_Email !== false,
    notifySms: row.Notify_SMS !== 0 && row.Notify_SMS !== false,
    securityQuestion: row.Security_Question || undefined,
    staffId: row.Staff_ID_PK || undefined,
  };
}

function mapComplaint(row, viewer) {
  const priority = normalizePriority(row.Priority);
  const eligibleAt = addHours(row.Submission_Date, FOLLOWUP_HOURS[priority] || 8);
  const open = OPEN_STATUSES.has(row.Current_Status);
  const isOwner = viewer && row.User_ID_FK === viewer.id;
  return {
    id: row.Complaint_ID_PK,
    title: row.Title,
    description: row.Description,
    categoryId: row.Category_ID_FK,
    categoryName: row.Category_Name,
    locationId: row.Location_ID_FK,
    buildingName: row.Building_Name,
    floor: row.Floor,
    roomArea: row.Room_Area,
    priority,
    status: row.Current_Status === 'Escalated' && isOwner ? 'In Progress' : row.Current_Status,
    escalated: row.Current_Status === 'Escalated',
    imageUrl: row.Image_URL || undefined,
    videoUrl: row.Video_URL || undefined,
    attachmentType: row.Attachment_Type || 'none',
    resolutionRemarks: row.Resolution_Remarks || undefined,
    userId: row.User_ID_FK,
    userName: row.Submitter_Name,
    userEmail: row.Submitter_Email,
    userPhone: row.Submitter_Phone,
    userType: row.User_Type,
    studentOrEmployeeId: row.Student_Or_Employee_ID,
    submissionDate: row.Submission_Date,
    issueFacedAt: row.Issue_Faced_At || undefined,
    submitterRedFlagged: !!row.Is_Flagged_Spammer,
    assignedStaffId: row.Staff_ID_PK || undefined,
    assignedStaffName: row.Staff_Name || undefined,
    assignedStaffRole: row.Staff_Role || undefined,
    departmentId: row.Department_ID_PK || undefined,
    departmentName: row.Department_Name || undefined,
    assignedDate: row.Assigned_Date || undefined,
    resolvedDate: row.Resolved_Date || undefined,
    rejectionReason: row.Rejection_Reason || undefined,
    feedbackRating: row.Feedback_Rating || undefined,
    feedbackComment: row.Feedback_Comment || undefined,
    isEmergency: !!row.Is_Emergency,
    followUpCount: row.Follow_Up_Count || 0,
    lastFollowUpAt: row.Last_Follow_Up_At || undefined,
    slaDueAt: row.Sla_Due_At || undefined,
    slaBreached: !!row.Sla_Breached,
    escalationLevel: row.Escalation_Level || 0,
    acknowledgement: row.Acknowledgement_Message || undefined,
    canFollowUp: !!(open && isOwner && nowSql() >= eligibleAt),
    followUpEligibleAt: eligibleAt,
  };
}

function canSeeComplaint(user, row, involvedIds) {
  if (user.role === 'admin' || user.role === 'authority') return true;
  if (row.User_ID_FK === user.id) return true;
  if (user.role === 'maintenance' && user.staffId) {
    if (row.Staff_ID_PK === user.staffId) return true;
    if (involvedIds?.has(row.Complaint_ID_PK)) return true;
  }
  return false;
}

async function assignmentIdsForStaff(staffId) {
  if (!staffId) return new Set();
  const [rows] = await pool.query(
    'SELECT DISTINCT Complaint_ID_FK AS id FROM COMPLAINT_ASSIGNMENT WHERE Staff_ID_FK = ?',
    [staffId]
  );
  return new Set(rows.map((row) => row.id));
}

async function earlierOfficerIds(complaintId, currentStaffId) {
  const [rows] = await pool.query(
    'SELECT DISTINCT Staff_ID_FK AS id FROM COMPLAINT_ASSIGNMENT WHERE Complaint_ID_FK = ?',
    [complaintId]
  );
  const userIds = [];
  for (const row of rows) {
    if (!row.id || row.id === currentStaffId) continue;
    userIds.push(await userIdForStaff(row.id));
  }
  return userIds.filter(Boolean);
}

function normalizeSecret(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

async function findUserByIdentifier(identifier) {
  const [rows] = await pool.query(
    `SELECT u.*, r.Role_Name, m.Staff_ID_PK
     FROM USER u
     JOIN ROLE r ON r.Role_ID_PK = u.Role_ID_FK
     LEFT JOIN MAINTENANCE_STAFF m ON m.Email = u.Email
     WHERE LOWER(u.Email) = LOWER(?) OR LOWER(u.Student_Or_Employee_ID) = LOWER(?)
     LIMIT 1`,
    [identifier, identifier]
  );
  return rows[0] || null;
}

async function passwordMatches(stored, given) {
  if (!stored || !given) return false;
  if (String(stored).startsWith('$2')) return bcrypt.compare(given, stored);
  return stored === given;
}

async function auth(req, res, next) {
  try {
    if (!dbReady) {
      return res.status(503).json({
        message: 'MySQL is not connected. Check .env and run npm run db:setup.',
      });
    }
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    if (!token) return res.status(401).json({ message: 'Sign in to continue.' });

    const [sessions] = await pool.query(
      `SELECT s.Last_Activity, u.*, r.Role_Name, m.Staff_ID_PK
       FROM USER_SESSION s
       JOIN USER u ON u.User_ID_PK = s.User_ID_FK
       JOIN ROLE r ON r.Role_ID_PK = u.Role_ID_FK
       LEFT JOIN MAINTENANCE_STAFF m ON m.Email = u.Email
       WHERE s.Session_ID_PK = ?`,
      [token]
    );
    const row = sessions[0];
    if (!row) {
      return res.status(401).json({ message: 'Your session is no longer valid. Please sign in again.' });
    }
    const idleFor = Date.now() - parseSql(row.Last_Activity).getTime();
    if (idleFor > IDLE_MS) {
      await pool.query('DELETE FROM USER_SESSION WHERE Session_ID_PK = ?', [token]);
      return res.status(401).json({
        message: 'Your session ended after 30 minutes of inactivity. Please sign in again.',
      });
    }
    if (req.headers['x-session-touch'] !== '0') {
      const stamp = nowSql();
      await pool.query(
        'UPDATE USER_SESSION SET Last_Activity = ?, Expires_At = ? WHERE Session_ID_PK = ?',
        [stamp, addHours(stamp, IDLE_MS / 3600000), token]
      );
    }
    req.user = mapUser(row);
    req.token = token;
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'The session could not be verified. Try signing in again.' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin' && req.user.role !== 'authority') {
    return res.status(403).json({ message: 'This action is limited to administrators.' });
  }
  next();
}

async function insertHistory(complaintId, status, user, remarks, channel = 'portal') {
  await pool.query(
    `INSERT INTO COMPLAINT_STATUS_HISTORY
      (History_ID_PK, Complaint_ID_FK, Status, Updated_By, Updated_Date, Remarks, Update_Channel)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [hid(), complaintId, status, user.name, nowSql(), remarks, channel]
  );
}

async function notifyUsers(userIds, complaintId, message, type, channels) {
  const unique = [...new Set(userIds.filter(Boolean))];
  for (const userId of unique) {
    for (const channel of channels) {
      await pool.query(
        `INSERT INTO NOTIFICATION
          (Notification_ID_PK, User_ID_FK, Complaint_ID_FK, Message, Notification_Date, Is_Read, Notification_Type, Channel)
         VALUES (?, ?, ?, ?, ?, FALSE, ?, ?)`,
        [nid(), userId, complaintId, message, nowSql(), type, channel]
      );
    }
  }
}

function channelsForUser() {
  return ['in_app'];
}

async function adminIds() {
  const [rows] = await pool.query(
    `SELECT u.User_ID_PK
     FROM USER u
     JOIN ROLE r ON r.Role_ID_PK = u.Role_ID_FK
     WHERE r.Role_Name = 'admin'`
  );
  return rows.map((row) => row.User_ID_PK);
}

async function userIdForStaff(staffId) {
  const [rows] = await pool.query(
    `SELECT u.User_ID_PK
     FROM MAINTENANCE_STAFF s
     JOIN USER u ON u.Email = s.Email
     WHERE s.Staff_ID_PK = ?`,
    [staffId]
  );
  return rows[0]?.User_ID_PK || null;
}

function storeDataUrl(dataUrl) {
  const match = /^data:(image|video)\/([a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)$/.exec(dataUrl || '');
  if (!match) return null;
  const kind = match[1] === 'video' ? 'video' : 'photo';
  const ext = kind === 'video' ? 'mp4' : 'jpg';
  const buffer = Buffer.from(match[3], 'base64');
  if (buffer.length > 12 * 1024 * 1024) {
    const error = new Error('The attachment is larger than 12MB.');
    error.status = 400;
    throw error;
  }
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const filename = `${kind}-${Date.now()}-${crypto.randomBytes(3).toString('hex')}.${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, filename), buffer);
  return { url: `/uploads/${filename}`, type: kind };
}

async function complaintRows() {
  const [rows] = await pool.query(
    `SELECT c.*, cat.Category_Name, loc.Building_Name, loc.Floor, loc.Room_Area,
            u.Name AS Submitter_Name, u.Email AS Submitter_Email, u.Phone AS Submitter_Phone,
            u.User_Type, u.Student_Or_Employee_ID, u.Is_Flagged_Spammer,
            s.Staff_ID_PK, s.Name AS Staff_Name, s.Specialization AS Staff_Role,
            d.Department_ID_PK, d.Department_Name,
            a.Assigned_Date
     FROM COMPLAINT c
     JOIN COMPLAINT_CATEGORY cat ON cat.Category_ID_PK = c.Category_ID_FK
     JOIN LOCATION loc ON loc.Location_ID_PK = c.Location_ID_FK
     JOIN USER u ON u.User_ID_PK = c.User_ID_FK
     LEFT JOIN COMPLAINT_ASSIGNMENT a ON a.Assignment_ID_PK = (
       SELECT Assignment_ID_PK FROM COMPLAINT_ASSIGNMENT
       WHERE Complaint_ID_FK = c.Complaint_ID_PK
       ORDER BY Assigned_Date DESC LIMIT 1
     )
     LEFT JOIN MAINTENANCE_STAFF s ON s.Staff_ID_PK = a.Staff_ID_FK
     LEFT JOIN DEPARTMENT d ON d.Department_ID_PK = s.Department_ID_FK
     ORDER BY c.Submission_Date DESC`
  );
  return rows;
}

async function loadState(user) {
  const rows = await complaintRows();
  const involvedIds = user.role === 'maintenance' ? await assignmentIdsForStaff(user.staffId) : new Set();
  const visible = rows.filter((row) => canSeeComplaint(user, row, involvedIds));
  const visibleIds = new Set(visible.map((row) => row.Complaint_ID_PK));

  const [categories] = await pool.query('SELECT * FROM COMPLAINT_CATEGORY ORDER BY Category_Name');
  const [locations] = await pool.query('SELECT * FROM LOCATION ORDER BY Building_Name, Room_Area');
  const [departments] = await pool.query('SELECT * FROM DEPARTMENT ORDER BY Department_Name');
  const [staff] = await pool.query(
    `SELECT s.*, d.Department_Name
     FROM MAINTENANCE_STAFF s
     JOIN DEPARTMENT d ON d.Department_ID_PK = s.Department_ID_FK
     ORDER BY s.Name`
  );
  const [history] = await pool.query(
    'SELECT * FROM COMPLAINT_STATUS_HISTORY ORDER BY Updated_Date ASC'
  );
  const [handoffs] = await pool.query(
    `SELECT a.Assignment_ID_PK, a.Complaint_ID_FK, a.From_Staff_ID, a.Handoff_Kind, a.Handoff_Remarks, a.Assigned_Date,
            c.Title, fs.Name AS From_Name, ts.Name AS To_Name, ts.Specialization AS To_Role
     FROM COMPLAINT_ASSIGNMENT a
     JOIN COMPLAINT c ON c.Complaint_ID_PK = a.Complaint_ID_FK
     LEFT JOIN MAINTENANCE_STAFF fs ON fs.Staff_ID_PK = a.From_Staff_ID
     JOIN MAINTENANCE_STAFF ts ON ts.Staff_ID_PK = a.Staff_ID_FK
     WHERE a.Handoff_Kind IN ('auto', 'manual')
     ORDER BY a.Assigned_Date DESC`
  );
  const [notifications] = await pool.query(
    'SELECT * FROM NOTIFICATION ORDER BY Notification_Date DESC'
  );
  const [contacts] = await pool.query('SELECT * FROM EMERGENCY_CONTACTS ORDER BY Category, Name');
  const [users] = await pool.query(
    `SELECT u.*, r.Role_Name, m.Staff_ID_PK
     FROM USER u
     JOIN ROLE r ON r.Role_ID_PK = u.Role_ID_FK
     LEFT JOIN MAINTENANCE_STAFF m ON m.Email = u.Email
     ORDER BY u.Name`
  );

  const mappedUsers = users.map(mapUser);
  return {
    user: mappedUsers.find((item) => item.id === user.id) || user,
    complaints: visible.map((row) => mapComplaint(row, user)),
    categories: categories.map((cat) => ({
      id: cat.Category_ID_PK,
      name: cat.Category_Name,
      description: cat.Description || '',
      iconName: CATEGORY_META[cat.Category_ID_PK]?.iconName || 'Wrench',
      departmentId: CATEGORY_DEPT[cat.Category_ID_PK] || 'dept-estate',
      defaultPriority: CATEGORY_META[cat.Category_ID_PK]?.defaultPriority || 'Normal',
    })),
    locations: locations.map((loc) => ({
      id: loc.Location_ID_PK,
      buildingName: loc.Building_Name,
      floor: loc.Floor,
      roomArea: loc.Room_Area,
      zone: loc.Campus_Zone,
    })),
    departments: departments.map((dept) => ({
      id: dept.Department_ID_PK,
      name: dept.Department_Name,
      contactInfo: dept.Contact_Info,
      headName: dept.Head_Name || '',
      email: dept.Email || '',
    })),
    maintenanceStaff: staff.map((member) => ({
      id: member.Staff_ID_PK,
      name: member.Name,
      email: member.Email,
      phone: member.Phone,
      departmentId: member.Department_ID_FK,
      departmentName: member.Department_Name,
      specialization: member.Specialization,
      activeTasksCount: member.Active_Tasks || 0,
    })),
    statusHistory: history
      .filter((item) => visibleIds.has(item.Complaint_ID_FK))
      .map((item) => ({
        id: item.History_ID_PK,
        complaintId: item.Complaint_ID_FK,
        status: item.Status,
        updatedBy: item.Updated_By,
        updatedByName: item.Updated_By,
        role: item.Update_Channel || 'portal',
        updatedDate: item.Updated_Date,
        remarks: item.Remarks || '',
      })),
    escalations: handoffs
      .filter((item) => {
        if (user.role === 'admin' || user.role === 'authority') return true;
        return user.role === 'maintenance' && item.From_Staff_ID === user.staffId;
      })
      .map((item) => ({
        id: item.Assignment_ID_PK,
        complaintId: item.Complaint_ID_FK,
        complaintTitle: item.Title,
        fromStaffId: item.From_Staff_ID || '',
        fromStaffName: item.From_Name || 'Unassigned',
        toStaffName: item.To_Name,
        toStaffRole: item.To_Role || '',
        kind: item.Handoff_Kind,
        remarks: item.Handoff_Remarks || '',
        date: item.Assigned_Date,
      })),
    notifications: notifications
      .filter((item) => {
        if (user.role === 'admin' || user.role === 'authority') return true;
        return item.User_ID_FK === user.id;
      })
      .map((item) => ({
        id: item.Notification_ID_PK,
        userId: item.User_ID_FK,
        complaintId: item.Complaint_ID_FK || '',
        message: item.Message,
        notificationDate: item.Notification_Date,
        isRead: !!item.Is_Read,
        type: item.Notification_Type || 'status_update',
        channel: item.Channel || 'in_app',
      })),
    emergencyContacts: contacts.map((item) => ({
      id: item.Contact_ID_PK,
      category: item.Category,
      name: item.Name,
      designation: item.Designation || undefined,
      contactNumber: item.Contact_Number,
      altContact: item.Alt_Contact || undefined,
      email: item.Email || undefined,
      instruction: item.Telephone_Instruction || undefined,
    })),
    users: user.role === 'admin' || user.role === 'authority' ? mappedUsers : mappedUsers.filter((item) => item.id === user.id),
  };
}

async function pickStaff(categoryId) {
  const directId = CATEGORY_STAFF[categoryId];
  if (directId) {
    const [direct] = await pool.query('SELECT * FROM MAINTENANCE_STAFF WHERE Staff_ID_PK = ? LIMIT 1', [directId]);
    if (direct[0]) return direct[0];
  }
  const departmentId = CATEGORY_DEPT[categoryId] || 'dept-estate';
  const [rows] = await pool.query(
    `SELECT * FROM MAINTENANCE_STAFF
     WHERE Department_ID_FK = ?
     ORDER BY Active_Tasks ASC, Name ASC
     LIMIT 1`,
    [departmentId]
  );
  return rows[0] || null;
}

async function assignToStaff(complaintId, staff, actor, notes, priority) {
  const stamp = nowSql();
  await pool.query(
    `INSERT INTO COMPLAINT_ASSIGNMENT
      (Assignment_ID_PK, Complaint_ID_FK, Staff_ID_FK, Assigned_Date, Assignment_Status, Assignment_Notes)
     VALUES (?, ?, ?, ?, 'Assigned', ?)`,
    [`ASN-${Date.now().toString(36)}`, complaintId, staff.Staff_ID_PK, stamp, notes || null]
  );
  await pool.query(
    `UPDATE COMPLAINT
     SET Current_Status = 'Assigned', Priority = ?
     WHERE Complaint_ID_PK = ?`,
    [priority, complaintId]
  );
  await pool.query(
    'UPDATE MAINTENANCE_STAFF SET Active_Tasks = Active_Tasks + 1 WHERE Staff_ID_PK = ?',
    [staff.Staff_ID_PK]
  );
  await insertHistory(
    complaintId,
    'Assigned',
    actor,
    `Automatically assigned to ${staff.Name} from the category's responsible department. ${notes || ''}`.trim()
  );
  return stamp;
}

app.get('/api/health', async (_req, res) => {
  if (!dbReady) {
    return res.status(503).json({
      message: 'MySQL is not connected. Set DB_PASSWORD in .env and run npm run db:setup.',
    });
  }
  res.json({ ok: true, database: DB_NAME });
});

app.post('/api/auth/register', async (req, res) => {
  try {
    if (!dbReady) {
      return res.status(503).json({ message: 'Registration is unavailable until MySQL is connected.' });
    }
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const phone = String(req.body.phone || '').trim();
    const password = String(req.body.password || '');
    const studentOrEmployeeId = String(req.body.studentOrEmployeeId || '').trim();
    const departmentName = String(req.body.departmentName || '').trim();
    const securityQuestion = String(req.body.securityQuestion || '').trim();
    const securityAnswer = normalizeSecret(req.body.securityAnswer);

    if (name.length < 3) return res.status(400).json({ message: 'Enter your full name.' });
    if (!/@bup\.edu\.bd$/i.test(email)) {
      return res.status(400).json({ message: 'Use your BUP email address ending in @bup.edu.bd.' });
    }
    if (studentOrEmployeeId.length < 4) {
      return res.status(400).json({ message: 'Enter your BUP student or employee ID.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }
    if (!ACADEMIC_DEPARTMENTS.includes(departmentName)) {
      return res.status(400).json({ message: 'Select your department from the list.' });
    }
    if (!SECURITY_QUESTIONS.includes(securityQuestion)) {
      return res.status(400).json({ message: 'Choose a security question from the list.' });
    }
    if (securityAnswer.length < 2) {
      return res.status(400).json({ message: 'Enter an answer to your security question.' });
    }

    const userId = `user-${Date.now()}`;
    const hash = await bcrypt.hash(password, 10);
    const answerHash = await bcrypt.hash(securityAnswer, 10);
    await pool.query(
      `INSERT INTO USER
        (User_ID_PK, Name, Email, Phone, Password, User_Type, Role_ID_FK, Student_Or_Employee_ID, Department_Name, Security_Question, Security_Answer)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, name, email, phone || '+880 1700-000000', hash, 'student', ROLE_IDS.student, studentOrEmployeeId, departmentName, securityQuestion, answerHash]
    );
    res.status(201).json({
      message: `Account created for ${name}. Sign in with your BUP ID.`,
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'An account with this email or ID already exists. Sign in instead.' });
    }
    console.error(error);
    res.status(500).json({ message: 'The account could not be created. Check the form and try again.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    if (!dbReady) {
      return res.status(503).json({ message: 'Sign-in is unavailable until MySQL is connected.' });
    }
    const identifier = String(req.body.identifier || '').trim();
    const password = String(req.body.password || '');
    if (!identifier || !password) {
      return res.status(400).json({ message: 'Enter your BUP ID or email and your password.' });
    }
    const row = await findUserByIdentifier(identifier);
    if (!row || !(await passwordMatches(row.Password, password))) {
      return res.status(401).json({ message: 'Those BUP credentials were not recognised. Check the ID and password.' });
    }
    if (!String(row.Password).startsWith('$2')) {
      const hash = await bcrypt.hash(password, 10);
      await pool.query('UPDATE USER SET Password = ? WHERE User_ID_PK = ?', [hash, row.User_ID_PK]);
    }
    const token = crypto.randomBytes(24).toString('hex');
    const stamp = nowSql();
    await pool.query(
      `INSERT INTO USER_SESSION (Session_ID_PK, User_ID_FK, Created_At, Last_Activity, Expires_At)
       VALUES (?, ?, ?, ?, ?)`,
      [token, row.User_ID_PK, stamp, stamp, addHours(stamp, IDLE_MS / 3600000)]
    );
    await pool.query('UPDATE USER SET Last_Login = ? WHERE User_ID_PK = ?', [stamp, row.User_ID_PK]);
    res.json({ token, user: mapUser(row) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Sign-in could not be completed. Try again in a moment.' });
  }
});

app.post('/api/auth/password', auth, async (req, res) => {
  try {
    const currentPassword = String(req.body.currentPassword || '');
    const newPassword = String(req.body.newPassword || '');
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'The new password must be at least 6 characters.' });
    }
    const row = await findUserByIdentifier(req.user.email);
    if (!row || !(await passwordMatches(row.Password, currentPassword))) {
      return res.status(400).json({ message: 'The current password is incorrect.' });
    }
    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE USER SET Password = ? WHERE User_ID_PK = ?', [hash, req.user.id]);
    await pool.query(
      'DELETE FROM USER_SESSION WHERE User_ID_FK = ? AND Session_ID_PK <> ?',
      [req.user.id, req.token]
    );
    res.json({ message: 'Password updated.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'The password could not be changed.' });
  }
});

app.post('/api/auth/security-question', auth, async (req, res) => {
  try {
    const currentPassword = String(req.body.currentPassword || '');
    const securityQuestion = String(req.body.securityQuestion || '').trim();
    const securityAnswer = normalizeSecret(req.body.securityAnswer);
    if (!SECURITY_QUESTIONS.includes(securityQuestion)) {
      return res.status(400).json({ message: 'Choose a security question from the list.' });
    }
    if (securityAnswer.length < 2) {
      return res.status(400).json({ message: 'Enter an answer to your security question.' });
    }
    const row = await findUserByIdentifier(req.user.email);
    if (!row || !(await passwordMatches(row.Password, currentPassword))) {
      return res.status(400).json({ message: 'The current password is incorrect.' });
    }
    const answerHash = await bcrypt.hash(securityAnswer, 10);
    await pool.query(
      'UPDATE USER SET Security_Question = ?, Security_Answer = ? WHERE User_ID_PK = ?',
      [securityQuestion, answerHash, req.user.id]
    );
    res.json(await loadState(req.user));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'The security question could not be saved.' });
  }
});

app.post('/api/auth/forgot', async (req, res) => {
  try {
    if (!dbReady) return res.status(503).json({ message: 'Password reset is unavailable until MySQL is connected.' });
    const identifier = String(req.body.identifier || '').trim();
    if (!identifier) return res.status(400).json({ message: 'Enter your BUP ID or email.' });
    const row = await findUserByIdentifier(identifier);
    if (!row) return res.status(404).json({ message: 'No account matches that BUP ID or email.' });
    if (!row.Security_Question || !row.Security_Answer) {
      return res.status(400).json({ message: 'This account has no security question yet. Sign in and add one under Settings.' });
    }
    res.json({ question: row.Security_Question });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'The security question could not be loaded.' });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    if (!dbReady) return res.status(503).json({ message: 'Password reset is unavailable until MySQL is connected.' });
    const identifier = String(req.body.identifier || '').trim();
    const answer = normalizeSecret(req.body.answer);
    const newPassword = String(req.body.password || '');
    if (!identifier || answer.length < 2) {
      return res.status(400).json({ message: 'Enter your BUP ID and the answer to your security question.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'The new password must be at least 6 characters.' });
    }
    const row = await findUserByIdentifier(identifier);
    if (!row || !row.Security_Answer) {
      return res.status(400).json({ message: 'This account cannot be reset until a security question is saved.' });
    }
    const matches = await passwordMatches(row.Security_Answer, answer);
    if (!matches) {
      return res.status(400).json({ message: 'That answer does not match the one saved on this account.' });
    }
    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE USER SET Password = ? WHERE User_ID_PK = ?', [hash, row.User_ID_PK]);
    await pool.query('DELETE FROM USER_SESSION WHERE User_ID_FK = ?', [row.User_ID_PK]);
    res.json({ message: 'Password updated. Sign in with the new password.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'The password could not be reset.' });
  }
});

app.post('/api/auth/logout', auth, async (req, res) => {
  await pool.query('DELETE FROM USER_SESSION WHERE Session_ID_PK = ?', [req.token]);
  res.json({ ok: true });
});

app.post('/api/auth/touch', auth, (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/state', auth, async (req, res) => {
  try {
    res.json(await loadState(req.user));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Campus records could not be loaded.' });
  }
});

app.post('/api/complaints', auth, async (req, res) => {
  try {
    if (req.user.role === 'admin' || req.user.role === 'authority' || req.user.role === 'maintenance' || req.user.role === 'officer') {
      return res.status(403).json({
        message: 'Officers and administrators cannot file a complaint from this account. Register as a general user, then sign in with that account.',
      });
    }
    const title = String(req.body.title || '').trim();
    const description = String(req.body.description || '').trim();
    const categoryId = String(req.body.categoryId || '');
    const locationId = String(req.body.locationId || '');
    let priority = normalizePriority(req.body.priority);
    const isEmergency = !!req.body.isEmergency || priority === 'Urgent';
    if (req.body.isEmergency) priority = 'Urgent';

    if (title.length < 5 || title.length > 180) {
      return res.status(400).json({ message: 'Give the complaint a title between 5 and 180 characters.' });
    }
    if (description.length < 20) {
      return res.status(400).json({ message: 'Describe the issue in at least 20 characters so the officer knows what to inspect.' });
    }
    if (!categoryId) return res.status(400).json({ message: 'Select a complaint category.' });
    if (!locationId) return res.status(400).json({ message: 'Select the campus location.' });
    if (!SLA_HOURS[priority]) return res.status(400).json({ message: 'Choose a priority of Low, Normal, High, or Urgent.' });
    const faced = issueFacedSql(req.body.issueFacedAt);
    if (faced.error) return res.status(400).json({ message: faced.error });

    const [categoryRows] = await pool.query('SELECT Category_ID_PK FROM COMPLAINT_CATEGORY WHERE Category_ID_PK = ?', [categoryId]);
    if (!categoryRows.length) return res.status(400).json({ message: 'That category is not available.' });
    const [locationRows] = await pool.query('SELECT Location_ID_PK FROM LOCATION WHERE Location_ID_PK = ?', [locationId]);
    if (!locationRows.length) return res.status(400).json({ message: 'That location is not available.' });

    let imageUrl = null;
    let videoUrl = null;
    let attachmentType = 'none';
    const rawImage = req.body.imageUrl ? String(req.body.imageUrl) : '';
    const rawVideo = req.body.videoUrl ? String(req.body.videoUrl) : '';
    if (rawVideo.startsWith('data:')) {
      const stored = storeDataUrl(rawVideo);
      if (!stored || stored.type !== 'video') {
        return res.status(400).json({ message: 'The video attachment could not be read. Use an MP4 or a photo instead.' });
      }
      videoUrl = stored.url;
      attachmentType = 'video';
    }
    if (rawImage.startsWith('data:')) {
      const stored = storeDataUrl(rawImage);
      if (!stored) return res.status(400).json({ message: 'The photo attachment could not be read.' });
      if (stored.type === 'video' && !videoUrl) {
        videoUrl = stored.url;
        attachmentType = 'video';
      } else {
        imageUrl = stored.url;
        if (attachmentType === 'none') attachmentType = 'photo';
      }
    } else if (rawImage.startsWith('http')) {
      imageUrl = rawImage.slice(0, 500);
      attachmentType = attachmentType === 'none' ? 'photo' : attachmentType;
    }

    const [selfRows] = await pool.query('SELECT Is_Flagged_Spammer, User_Type FROM USER WHERE User_ID_PK = ?', [req.user.id]);
    const roleName = selfRows[0]?.User_Type;
    const spamChecked = roleName !== 'admin';
    if (spamChecked && selfRows[0]?.Is_Flagged_Spammer) {
      return res.status(429).json({
        message: 'This account is paused for repeated complaints. An administrator has to clear the flag before you can submit again.',
      });
    }
    if (spamChecked) {
      const [recent] = await pool.query(
        `SELECT COUNT(*) AS total FROM COMPLAINT
         WHERE User_ID_FK = ? AND Submission_Date >= DATE_SUB(NOW(), INTERVAL 10 MINUTE)`,
        [req.user.id]
      );
      const [todayRows] = await pool.query(
        `SELECT COUNT(*) AS total FROM COMPLAINT
         WHERE User_ID_FK = ? AND Submission_Date >= CURDATE()`,
        [req.user.id]
      );
      const [duplicateRows] = await pool.query(
        `SELECT COUNT(*) AS total FROM COMPLAINT
         WHERE User_ID_FK = ? AND LOWER(TRIM(Title)) = LOWER(?)
           AND Submission_Date >= DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
        [req.user.id, title]
      );
      if (duplicateRows[0].total > 0) {
        return res.status(429).json({
          message: 'You already submitted this complaint in the last 24 hours. Wait for an update instead of sending it again.',
        });
      }
      if (recent[0].total >= 3 || todayRows[0].total >= 8) {
        await pool.query(
          `UPDATE USER SET Is_Flagged_Spammer = TRUE, Flag_Reason = ?, Flagged_Date = ? WHERE User_ID_PK = ?`,
          ['Automated anti-spam: too many complaints in a short time.', nowSql(), req.user.id]
        );
        return res.status(429).json({
          message: recent[0].total >= 3
            ? 'You can submit 3 complaints every 10 minutes. This one was blocked.'
            : 'You have reached the daily limit of 8 complaints.',
        });
      }
    }
    const year = new Date().getFullYear();
    const stamp = nowSql();
    const slaDue = addHours(stamp, SLA_HOURS[priority]);
    let complaintId = '';
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const [idRows] = await pool.query(
        `SELECT COALESCE(MAX(CAST(SUBSTRING_INDEX(Complaint_ID_PK, '-', -1) AS UNSIGNED)), 0) AS lastNo
         FROM COMPLAINT
         WHERE Complaint_ID_PK LIKE ?`,
        [`CMP-${year}-%`]
      );
      complaintId = `CMP-${year}-${String(Number(idRows[0].lastNo) + 1).padStart(3, '0')}`;
      const acknowledgement = `Complaint ${complaintId} is registered. Keep this ID. The acknowledgement is in your portal notifications.`;
      try {
        await pool.query(
          `INSERT INTO COMPLAINT (
            Complaint_ID_PK, User_ID_FK, Category_ID_FK, Location_ID_FK, Title, Description, Priority,
            Submission_Date, Issue_Faced_At, Current_Status, Image_URL, Video_URL, Attachment_Type, Is_Emergency,
            Sla_Due_At, Acknowledgement_Message
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?, ?, ?, ?, ?)`,
          [
            complaintId, req.user.id, categoryId, locationId, title, description, priority,
            stamp, faced.sql, imageUrl, videoUrl, attachmentType, isEmergency, slaDue, acknowledgement,
          ]
        );
        break;
      } catch (error) {
        if (error.code !== 'ER_DUP_ENTRY' || attempt === 4) throw error;
      }
    }
    const acknowledgement = `Complaint ${complaintId} is registered. Keep this ID. The acknowledgement is in your portal notifications.`;
    await insertHistory(complaintId, 'Pending', req.user, 'Complaint registered and acknowledged.');

    const ownerChannels = channelsForUser();
    await notifyUsers([req.user.id], complaintId, acknowledgement, 'acknowledgement', ownerChannels);

    const staff = await pickStaff(categoryId);
    if (staff) {
        await assignToStaff(
          complaintId,
          staff,
          { name: 'Category router', role: 'system' },
          isEmergency
            ? 'Emergency flag: notify the officer immediately.'
            : CATEGORY_STAFF[categoryId]
              ? `Sent directly to ${staff.Name}, ${staff.Specialization}.`
              : 'Routed by complaint category.',
          priority
        );
        const staffUserId = await userIdForStaff(staff.Staff_ID_PK);
        const supervisors = await adminIds();
        const dispatchMessage = isEmergency
          ? `Emergency ${complaintId}: ${title}. Assigned to ${staff.Name}. Respond now.`
          : `${complaintId} was assigned to ${staff.Name} (${staff.Specialization}).`;
        await notifyUsers(
          [req.user.id],
          complaintId,
          dispatchMessage,
          'assignment',
          ownerChannels
        );
        await notifyUsers(
          [staffUserId, ...supervisors],
          complaintId,
          dispatchMessage,
          isEmergency ? 'emergency' : 'assignment',
          ['in_app']
        );
    }

    const state = await loadState(req.user);
    const created = state.complaints.find((item) => item.id === complaintId);
    res.status(201).json({ complaint: created, acknowledgement, state });
  } catch (error) {
    console.error(error);
    res.status(error.status || 500).json({
      message: error.status ? error.message : 'The complaint could not be submitted. Check the form and try again.',
    });
  }
});

app.post('/api/complaints/:id/follow-up', auth, async (req, res) => {
  try {
    const complaintId = req.params.id;
    const note = String(req.body.note || '').trim();
    if (note.length < 8) {
      return res.status(400).json({ message: 'Write at least 8 characters.' });
    }
    const rows = await complaintRows();
    const row = rows.find((item) => item.Complaint_ID_PK === complaintId);
    if (!row || row.User_ID_FK !== req.user.id) {
      return res.status(404).json({ message: 'That complaint is not on your account.' });
    }
    const mapped = mapComplaint(row, req.user);
    if (!OPEN_STATUSES.has(row.Current_Status)) {
      return res.status(400).json({ message: 'This complaint is already closed, so a follow-up is not needed.' });
    }
    if (!mapped.canFollowUp) {
      return res.status(400).json({
        message: `A follow-up opens after the waiting period, at ${mapped.followUpEligibleAt}.`,
      });
    }
    await pool.query(
      `UPDATE COMPLAINT
       SET Follow_Up_Count = Follow_Up_Count + 1, Last_Follow_Up_At = ?
       WHERE Complaint_ID_PK = ?`,
      [nowSql(), complaintId]
    );
    await insertHistory(complaintId, row.Current_Status, req.user, `Follow-up requested: ${note}`, 'portal');
    const staffUserId = row.Staff_ID_PK ? await userIdForStaff(row.Staff_ID_PK) : null;
    const supervisors = await adminIds();
    await notifyUsers(
      [staffUserId, ...supervisors, req.user.id],
      complaintId,
      `Follow-up on ${complaintId}: ${note}`,
      'follow_up',
      ['in_app']
    );
    res.json(await loadState(req.user));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'The follow-up could not be sent.' });
  }
});

app.post('/api/complaints/:id/status', auth, async (req, res) => {
  try {
    const complaintId = req.params.id;
    const status = String(req.body.status || '');
    const remarks = String(req.body.remarks || '').trim();
    const rows = await complaintRows();
    const row = rows.find((item) => item.Complaint_ID_PK === complaintId);
    if (!row) return res.status(404).json({ message: 'Complaint not found.' });

    const isAdmin = req.user.role === 'admin' || req.user.role === 'authority';
    const isAssignedOfficer = req.user.role === 'maintenance' && req.user.staffId && row.Staff_ID_PK === req.user.staffId;
    if (!isAdmin && !isAssignedOfficer) {
      return res.status(403).json({ message: 'Only the assigned maintenance officer or an administrator can update this complaint.' });
    }
    if (!OFFICER_STATUSES.has(status)) {
      return res.status(400).json({ message: 'Set the complaint to In Progress, Resolved, On Hold, or Escalated.' });
    }
    if (status !== 'In Progress' && remarks.length < 8) {
      return res.status(400).json({ message: 'Add remarks of at least 8 characters for this update.' });
    }
    if (!OPEN_STATUSES.has(row.Current_Status) && row.Current_Status !== 'Resolved') {
      return res.status(400).json({ message: 'This complaint can no longer be updated.' });
    }

    const stamp = nowSql();
    const wasOpen = OPEN_STATUSES.has(row.Current_Status);
    await pool.query(
      `UPDATE COMPLAINT
       SET Current_Status = ?,
           Resolved_Date = CASE WHEN ? = 'Resolved' THEN ? ELSE Resolved_Date END,
           Resolution_Remarks = CASE WHEN ? <> '' THEN ? ELSE Resolution_Remarks END
       WHERE Complaint_ID_PK = ?`,
      [status, status, stamp, remarks, remarks, complaintId]
    );
    if (row.Staff_ID_PK && wasOpen && (status === 'Resolved' || status === 'Closed' || status === 'Rejected')) {
      await pool.query(
        'UPDATE MAINTENANCE_STAFF SET Active_Tasks = GREATEST(Active_Tasks - 1, 0) WHERE Staff_ID_PK = ?',
        [row.Staff_ID_PK]
      );
    }
    const label = status === 'Resolved' ? 'Done' : status;
    await insertHistory(
      complaintId,
      status,
      req.user,
      remarks || `Maintenance officer marked the complaint ${label}.`
    );
    const ownerChannels = channelsForUser();
    const progressNote = `${complaintId} is now ${label}. ${remarks}`.trim();
    await notifyUsers(
      [row.User_ID_FK],
      complaintId,
      progressNote,
      status === 'Resolved' ? 'resolution' : 'status_update',
      ownerChannels
    );
    await notifyUsers(
      [...(await adminIds()), ...(await earlierOfficerIds(complaintId, row.Staff_ID_PK))],
      complaintId,
      `${req.user.name} updated ${complaintId} to ${label}. ${remarks}`.trim(),
      'status_update',
      ['in_app']
    );
    res.json(await loadState(req.user));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'The status could not be updated.' });
  }
});

app.post('/api/complaints/:id/escalate', auth, async (req, res) => {
  try {
    const rows = await complaintRows();
    const row = rows.find((item) => item.Complaint_ID_PK === req.params.id);
    if (!row) return res.status(404).json({ message: 'Complaint not found.' });
    const isAdmin = req.user.role === 'admin' || req.user.role === 'authority';
    const isOfficer = req.user.role === 'maintenance' && req.user.staffId === row.Staff_ID_PK;
    if (!isAdmin && !isOfficer) {
      return res.status(403).json({ message: 'Only the assigned officer or an administrator can pass this complaint up.' });
    }
    if (!OPEN_STATUSES.has(row.Current_Status)) {
      return res.status(400).json({ message: 'A closed complaint cannot be passed to a higher office.' });
    }
    const remarks = String(req.body.remarks || '').trim();
    if (remarks.length < 8) {
      return res.status(400).json({ message: 'Explain why this complaint is being passed to the next authority.' });
    }
    await escalateComplaint(row, req.user, { kind: 'manual', remarks });
    res.json(await loadState(req.user));
  } catch (error) {
    console.error(error);
    res.status(error.status || 500).json({ message: error.status ? error.message : 'The complaint could not be passed up.' });
  }
});

app.post('/api/complaints/:id/progress', auth, async (req, res) => {
  try {
    const note = String(req.body.note || '').trim();
    if (note.length < 8) return res.status(400).json({ message: 'Write at least 8 characters so the complainant knows what changed.' });
    const rows = await complaintRows();
    const row = rows.find((item) => item.Complaint_ID_PK === req.params.id);
    if (!row) return res.status(404).json({ message: 'Complaint not found.' });
    const isAdmin = req.user.role === 'admin' || req.user.role === 'authority';
    const isOfficer = req.user.role === 'maintenance' && req.user.staffId === row.Staff_ID_PK;
    if (!isAdmin && !isOfficer) {
      return res.status(403).json({ message: 'Only the assigned officer can send a progress update.' });
    }
    await insertHistory(req.params.id, row.Current_Status, req.user, `Progress update: ${note}`, 'portal');
    const message = `${req.user.name} updated ${req.params.id}: ${note}`;
    await notifyUsers([row.User_ID_FK], req.params.id, message, 'status_update', channelsForUser());
    await notifyUsers(
      [...(await adminIds()), ...(await earlierOfficerIds(req.params.id, row.Staff_ID_PK))],
      req.params.id,
      message,
      'status_update',
      ['in_app']
    );
    res.json(await loadState(req.user));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'The progress update could not be sent.' });
  }
});

app.post('/api/complaints/:id/phone', auth, async (req, res) => {
  try {
    const note = String(req.body.note || '').trim();
    if (note.length < 8) return res.status(400).json({ message: 'Record what was said on the phone call.' });
    const rows = await complaintRows();
    const row = rows.find((item) => item.Complaint_ID_PK === req.params.id);
    if (!row) return res.status(404).json({ message: 'Complaint not found.' });
    const isAdmin = req.user.role === 'admin';
    const isOfficer = req.user.role === 'maintenance' && req.user.staffId === row.Staff_ID_PK;
    if (!isAdmin && !isOfficer) {
      return res.status(403).json({ message: 'Only the assigned officer can log a phone update.' });
    }
    await insertHistory(req.params.id, row.Current_Status, req.user, `Phone update: ${note}`, 'phone');
    await notifyUsers([row.User_ID_FK], req.params.id, `Phone update for ${req.params.id}: ${note}`, 'status_update', ['in_app']);
    await notifyUsers(await adminIds(), req.params.id, `${req.user.name} logged a phone update on ${req.params.id}: ${note}`, 'status_update', ['in_app']);
    res.json(await loadState(req.user));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'The phone update could not be saved.' });
  }
});

app.post('/api/complaints/:id/assign', auth, requireAdmin, async (req, res) => {
  try {
    const staffId = String(req.body.staffId || '');
    const priority = normalizePriority(req.body.priority);
    const notes = String(req.body.notes || '').trim();
    const [staffRows] = await pool.query('SELECT * FROM MAINTENANCE_STAFF WHERE Staff_ID_PK = ?', [staffId]);
    if (!staffRows.length) return res.status(400).json({ message: 'Select a maintenance officer.' });
    const rows = await complaintRows();
    const row = rows.find((item) => item.Complaint_ID_PK === req.params.id);
    if (!row) return res.status(404).json({ message: 'Complaint not found.' });
    if (row.Staff_ID_PK && OPEN_STATUSES.has(row.Current_Status)) {
      await pool.query(
        'UPDATE MAINTENANCE_STAFF SET Active_Tasks = GREATEST(Active_Tasks - 1, 0) WHERE Staff_ID_PK = ?',
        [row.Staff_ID_PK]
      );
    }
    await pool.query('UPDATE COMPLAINT SET Priority = ?, Is_Emergency = ? WHERE Complaint_ID_PK = ?', [
      priority,
      priority === 'Urgent',
      req.params.id,
    ]);
    await assignToStaff(req.params.id, staffRows[0], req.user, notes, priority);
    const staffUserId = await userIdForStaff(staffId);
    await notifyUsers(
      [row.User_ID_FK, staffUserId],
      req.params.id,
      `${req.params.id} assigned to ${staffRows[0].Name}.`,
      'assignment',
      ['in_app']
    );
    res.json(await loadState(req.user));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'The complaint could not be assigned.' });
  }
});

app.post('/api/complaints/:id/reject', auth, requireAdmin, async (req, res) => {
  try {
    const reason = String(req.body.reason || '').trim();
    if (reason.length < 8) return res.status(400).json({ message: 'Give a clear reason for the rejection.' });
    const rows = await complaintRows();
    const row = rows.find((item) => item.Complaint_ID_PK === req.params.id);
    if (!row) return res.status(404).json({ message: 'Complaint not found.' });
    await pool.query(
      `UPDATE COMPLAINT SET Current_Status = 'Rejected', Rejection_Reason = ? WHERE Complaint_ID_PK = ?`,
      [reason, req.params.id]
    );
    if (row.Staff_ID_PK && OPEN_STATUSES.has(row.Current_Status)) {
      await pool.query('UPDATE MAINTENANCE_STAFF SET Active_Tasks = GREATEST(Active_Tasks - 1, 0) WHERE Staff_ID_PK = ?', [row.Staff_ID_PK]);
    }
    await insertHistory(req.params.id, 'Rejected', req.user, `Rejected: ${reason}`);
    await notifyUsers([row.User_ID_FK], req.params.id, `${req.params.id} was rejected. Reason: ${reason}`, 'rejection', channelsForUser());
    res.json(await loadState(req.user));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'The complaint could not be rejected.' });
  }
});

app.post('/api/complaints/:id/close', auth, requireAdmin, async (req, res) => {
  try {
    const remarks = String(req.body.remarks || 'Verified and closed by administration.').trim();
    const rows = await complaintRows();
    const row = rows.find((item) => item.Complaint_ID_PK === req.params.id);
    if (!row) return res.status(404).json({ message: 'Complaint not found.' });
    await pool.query(
      `UPDATE COMPLAINT SET Current_Status = 'Closed' WHERE Complaint_ID_PK = ?`,
      [req.params.id]
    );
    if (row.Staff_ID_PK && OPEN_STATUSES.has(row.Current_Status)) {
      await pool.query(
        'UPDATE MAINTENANCE_STAFF SET Active_Tasks = GREATEST(Active_Tasks - 1, 0) WHERE Staff_ID_PK = ?',
        [row.Staff_ID_PK]
      );
    }
    await insertHistory(req.params.id, 'Closed', req.user, remarks);
    await notifyUsers(
      [row.User_ID_FK],
      req.params.id,
      `${req.params.id} was closed. ${remarks}`,
      'status_update',
      channelsForUser()
    );
    res.json(await loadState(req.user));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'The complaint could not be closed.' });
  }
});

app.post('/api/complaints/:id/feedback', auth, async (req, res) => {
  try {
    const rating = Number(req.body.rating);
    const comment = String(req.body.comment || '').trim();
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Choose a rating from 1 to 5.' });
    }
    if (comment.length < 8) {
      return res.status(400).json({ message: 'Write at least 8 characters.' });
    }
    const rows = await complaintRows();
    const row = rows.find((item) => item.Complaint_ID_PK === req.params.id);
    if (!row || row.User_ID_FK !== req.user.id) {
      return res.status(403).json({ message: 'Only the person who submitted this complaint can rate it.' });
    }
    if (row.Current_Status !== 'Resolved' && row.Current_Status !== 'Closed') {
      return res.status(400).json({ message: 'You can rate a complaint after it is marked done.' });
    }
    await pool.query(
      `UPDATE COMPLAINT
       SET Feedback_Rating = ?, Feedback_Comment = ?, Current_Status = 'Closed'
       WHERE Complaint_ID_PK = ?`,
      [rating, comment || null, req.params.id]
    );
    await insertHistory(req.params.id, 'Closed', req.user, `Feedback ${rating}/5. ${comment}`.trim());
    res.json(await loadState(req.user));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'The rating could not be saved.' });
  }
});

app.post('/api/officers', auth, requireAdmin, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const phone = String(req.body.phone || '').trim();
    const employeeId = String(req.body.employeeId || '').trim();
    const departmentId = String(req.body.departmentId || '');
    const specialization = String(req.body.specialization || '').trim();
    const password = String(req.body.password || '');
    if (String(req.body.role || '').toLowerCase() === 'admin') {
      return res.status(403).json({ message: 'Administrator accounts cannot be created here. Use the MySQL command in scripts/add-admin.sql.' });
    }
    if (!name || !/@bup\.edu\.bd$/i.test(email) || employeeId.length < 3 || !departmentId || password.length < 6) {
      return res.status(400).json({ message: 'Name, @bup.edu.bd email, employee ID, department, and a password of at least 6 characters are required.' });
    }
    const [dept] = await connection.query('SELECT Department_ID_PK, Department_Name FROM DEPARTMENT WHERE Department_ID_PK = ?', [departmentId]);
    if (!dept.length) return res.status(400).json({ message: 'Select a valid maintenance department.' });

    const staffId = `staff-${Date.now()}`;
    const userId = `user-${Date.now()}`;
    const hash = await bcrypt.hash(password, 10);
    await connection.beginTransaction();
    await connection.query(
      `INSERT INTO MAINTENANCE_STAFF
        (Staff_ID_PK, Name, Email, Phone, Department_ID_FK, Specialization, Active_Tasks)
       VALUES (?, ?, ?, ?, ?, ?, 0)`,
      [staffId, name, email, phone || '01769-028797', departmentId, specialization || 'General maintenance']
    );
    await connection.query(
      `INSERT INTO USER
        (User_ID_PK, Name, Email, Phone, Password, User_Type, Role_ID_FK, Student_Or_Employee_ID, Department_Name)
       VALUES (?, ?, ?, ?, ?, 'staff', 'ROLE-MNT', ?, ?)`,
      [userId, name, email, phone || '01769-028797', hash, employeeId, dept[0].Department_Name]
    );
    await connection.commit();
    res.status(201).json(await loadState(req.user));
  } catch (error) {
    await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'An officer with this email or ID already exists.' });
    }
    console.error(error);
    res.status(500).json({ message: 'The maintenance officer could not be added.' });
  } finally {
    connection.release();
  }
});

app.post('/api/users/:id/flag', auth, requireAdmin, async (req, res) => {
  try {
    const reason = String(req.body.reason || 'Flagged by campus administration.').trim();
    const [rows] = await pool.query('SELECT Is_Flagged_Spammer FROM USER WHERE User_ID_PK = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'User not found.' });
    const next = !rows[0].Is_Flagged_Spammer;
    await pool.query(
      `UPDATE USER SET Is_Flagged_Spammer = ?, Flag_Reason = ?, Flagged_Date = ? WHERE User_ID_PK = ?`,
      [next, next ? reason : null, next ? nowSql() : null, req.params.id]
    );
    res.json(await loadState(req.user));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'The account flag could not be changed.' });
  }
});

app.patch('/api/me/notifications', auth, async (req, res) => {
  try {
    const notifyEmail = req.body.notifyEmail !== false;
    const notifySms = req.body.notifySms !== false;
    await pool.query('UPDATE USER SET Notify_Email = ?, Notify_SMS = ? WHERE User_ID_PK = ?', [
      notifyEmail,
      notifySms,
      req.user.id,
    ]);
    res.json(await loadState(req.user));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Notification preferences could not be saved.' });
  }
});

app.post('/api/notifications/:id/read', auth, async (req, res) => {
  await pool.query(
    'UPDATE NOTIFICATION SET Is_Read = TRUE WHERE Notification_ID_PK = ? AND (User_ID_FK = ? OR ? IN (\'admin\', \'authority\'))',
    [req.params.id, req.user.id, req.user.role]
  );
  res.json(await loadState(req.user));
});

app.post('/api/notifications/read-all', auth, async (req, res) => {
  if (req.user.role === 'admin' || req.user.role === 'authority') {
    await pool.query('UPDATE NOTIFICATION SET Is_Read = TRUE');
  } else {
    await pool.query('UPDATE NOTIFICATION SET Is_Read = TRUE WHERE User_ID_FK = ?', [req.user.id]);
  }
  res.json(await loadState(req.user));
});

app.post('/api/categories', auth, requireAdmin, async (req, res) => {
  const name = String(req.body.name || '').trim();
  const description = String(req.body.description || '').trim();
  if (name.length < 3) return res.status(400).json({ message: 'Enter a category name.' });
  await pool.query(
    'INSERT INTO COMPLAINT_CATEGORY (Category_ID_PK, Category_Name, Description) VALUES (?, ?, ?)',
    [`cat-${Date.now()}`, name, description]
  );
  res.status(201).json(await loadState(req.user));
});

app.post('/api/locations', auth, requireAdmin, async (req, res) => {
  const buildingName = String(req.body.buildingName || '').trim();
  const floor = String(req.body.floor || '').trim();
  const roomArea = String(req.body.roomArea || '').trim();
  const zone = ['North', 'South', 'East', 'West', 'Central'].includes(req.body.zone) ? req.body.zone : 'Central';
  if (!buildingName || !floor || !roomArea) {
    return res.status(400).json({ message: 'Building, floor, and room are required.' });
  }
  await pool.query(
    'INSERT INTO LOCATION (Location_ID_PK, Building_Name, Floor, Room_Area, Campus_Zone) VALUES (?, ?, ?, ?, ?)',
    [`loc-${Date.now()}`, buildingName, floor, roomArea, zone]
  );
  res.status(201).json(await loadState(req.user));
});

function sqlLiteral(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'NULL';
  if (typeof value === 'bigint') return value.toString();
  if (Buffer.isBuffer(value)) return value[0] ? '1' : '0';
  return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "''")}'`;
}

async function buildBackupSql() {
  const tables = [
    'ROLE', 'DEPARTMENT', 'USER', 'MAINTENANCE_STAFF', 'COMPLAINT_CATEGORY', 'LOCATION',
    'COMPLAINT', 'COMPLAINT_ASSIGNMENT', 'COMPLAINT_STATUS_HISTORY', 'NOTIFICATION', 'EMERGENCY_CONTACTS',
  ];
  let sql = `-- BUP maintenance backup ${nowSql()}\nSET FOREIGN_KEY_CHECKS=0;\n`;
  for (const table of tables) {
    const [rows] = await pool.query(`SELECT * FROM \`${table}\``);
    for (const row of rows) {
      const columns = Object.keys(row);
      sql += `REPLACE INTO \`${table}\` (${columns.map((column) => `\`${column}\``).join(', ')}) VALUES (${columns.map((column) => sqlLiteral(row[column])).join(', ')});\n`;
    }
  }
  sql += 'SET FOREIGN_KEY_CHECKS=1;\n';
  return sql;
}

async function writeBackupFile() {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const sql = await buildBackupSql();
  const filename = `bup-maintenance-${Date.now()}.sql`;
  fs.writeFileSync(path.join(BACKUP_DIR, filename), sql);
  const files = fs.readdirSync(BACKUP_DIR).filter((name) => name.endsWith('.sql')).sort();
  while (files.length > 8) {
    fs.unlinkSync(path.join(BACKUP_DIR, files.shift()));
  }
  return filename;
}

app.get('/api/admin/backup', auth, requireAdmin, async (_req, res) => {
  try {
    const filename = await writeBackupFile();
    res.setHeader('Content-Type', 'application/sql');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(fs.readFileSync(path.join(BACKUP_DIR, filename)));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'The backup could not be created.' });
  }
});

app.post('/api/admin/reset', auth, requireAdmin, async (req, res) => {
  try {
    const schema = fs.readFileSync(path.join(__dirname, '..', 'database_schema.sql'), 'utf8');
    const connection = await mysql.createConnection(mysqlOptions());
    await connection.query(schema);
    await connection.end();
    res.json({ message: 'Demo records were restored from the MySQL schema.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'The database could not be restored.' });
  }
});

async function escalateComplaint(row, actor, handoff) {
  const level = Number(row.Escalation_Level || 0);
  const target = escalationTarget(row.Category_ID_FK, level, row.Staff_ID_PK || null);
  if (!target) {
    const error = new Error('This complaint is already with the final office.');
    error.status = 400;
    throw error;
  }
  const [staffRows] = await pool.query('SELECT * FROM MAINTENANCE_STAFF WHERE Staff_ID_PK = ? LIMIT 1', [target.staffId]);
  const staff = staffRows[0];
  if (!staff) {
    const error = new Error('The next office is not available yet.');
    error.status = 500;
    throw error;
  }
  let stamp = nowSql();
  const [previous] = await pool.query(
    'SELECT MAX(Assigned_Date) AS latest FROM COMPLAINT_ASSIGNMENT WHERE Complaint_ID_FK = ?',
    [row.Complaint_ID_PK]
  );
  if (previous[0]?.latest && formatSql(parseSql(previous[0].latest)) >= stamp) {
    const next = parseSql(previous[0].latest);
    next.setSeconds(next.getSeconds() + 1);
    stamp = formatSql(next);
  }
  const priority = normalizePriority(row.Priority);
  if (row.Staff_ID_PK && OPEN_STATUSES.has(row.Current_Status)) {
    await pool.query(
      'UPDATE MAINTENANCE_STAFF SET Active_Tasks = GREATEST(Active_Tasks - 1, 0) WHERE Staff_ID_PK = ?',
      [row.Staff_ID_PK]
    );
  }
  const fromName = row.Staff_Name || 'the assigned officer';
  const historyText = handoff.kind === 'auto'
    ? `Auto-escalated from ${fromName} because the resolution deadline passed. Passed to ${staff.Name}, ${staff.Specialization}.`
    : `${actor.name} passed this complaint to ${staff.Name}, ${staff.Specialization}. Reason: ${handoff.remarks}`;
  await pool.query(
    `INSERT INTO COMPLAINT_ASSIGNMENT
      (Assignment_ID_PK, Complaint_ID_FK, Staff_ID_FK, Assigned_Date, Assignment_Status, Assignment_Notes, From_Staff_ID, Handoff_Kind, Handoff_Remarks)
     VALUES (?, ?, ?, ?, 'Escalated', ?, ?, ?, ?)`,
    [
      `ASN-${Date.now().toString(36)}-${target.level}`,
      row.Complaint_ID_PK,
      staff.Staff_ID_PK,
      stamp,
      historyText,
      row.Staff_ID_PK || null,
      handoff.kind,
      handoff.remarks,
    ]
  );
  await pool.query(
    `UPDATE COMPLAINT
     SET Current_Status = 'Escalated', Escalation_Level = ?, Sla_Due_At = ?, Sla_Breached = FALSE,
         Last_Staff_Alert = NULL, Last_Supervisor_Alert = NULL
     WHERE Complaint_ID_PK = ?`,
    [target.level, addHours(stamp, SLA_HOURS[priority] || 24), row.Complaint_ID_PK]
  );
  await pool.query('UPDATE MAINTENANCE_STAFF SET Active_Tasks = Active_Tasks + 1 WHERE Staff_ID_PK = ?', [staff.Staff_ID_PK]);
  await insertHistory(row.Complaint_ID_PK, 'Escalated', actor, historyText);
  const studentMessage = `Your complaint ${row.Complaint_ID_PK} has been escalated to a senior officer, ${staff.Name} (${staff.Specialization}).`;
  await notifyUsers([row.User_ID_FK], row.Complaint_ID_PK, studentMessage, 'status_update', ['in_app']);
  const previousOfficerId = row.Staff_ID_PK ? await userIdForStaff(row.Staff_ID_PK) : null;
  const officerMessage = handoff.kind === 'auto'
    ? `${row.Complaint_ID_PK} was auto-escalated from you to ${staff.Name} because the deadline passed. This is on your record.`
    : `You passed ${row.Complaint_ID_PK} to ${staff.Name}. Reason: ${handoff.remarks}`;
  if (previousOfficerId) {
    await notifyUsers([previousOfficerId], row.Complaint_ID_PK, officerMessage, 'status_update', ['in_app']);
  }
  const adminMessage = handoff.kind === 'auto'
    ? `${fromName} missed the deadline on ${row.Complaint_ID_PK}. It was auto-escalated to ${staff.Name} and recorded on ${fromName}'s history.`
    : `${actor.name} passed ${row.Complaint_ID_PK} to ${staff.Name}. Reason: ${handoff.remarks}`;
  const staffUserId = await userIdForStaff(staff.Staff_ID_PK);
  await notifyUsers([staffUserId, ...(await adminIds())], row.Complaint_ID_PK, adminMessage, 'status_update', ['in_app']);
  return staff;
}

async function watchSla() {
  if (!dbReady) return;
  const rows = await complaintRows();
  const supervisors = await adminIds();
  const stamp = nowSql();
  for (const row of rows) {
    if (!OPEN_STATUSES.has(row.Current_Status) || !row.Sla_Due_At) continue;
    if (stamp < row.Sla_Due_At) continue;
    if (Number(row.Escalation_Level || 0) < 2 && row.Current_Status !== 'Resolved' && row.Current_Status !== 'Closed') {
      try {
        await escalateComplaint(row, { name: 'Resolution timer', role: 'system' }, {
          kind: 'auto',
          remarks: 'The resolution deadline passed before the complaint was closed.',
        });
        continue;
      } catch (error) {
        console.error('Auto-escalation skipped:', error.message);
      }
    }
    const staffUserId = row.Staff_ID_PK ? await userIdForStaff(row.Staff_ID_PK) : null;
    const lastSupervisor = row.Last_Supervisor_Alert ? parseSql(row.Last_Supervisor_Alert).getTime() : 0;
    const repeat = Date.now() - lastSupervisor > 6 * 3600000;
    if (!row.Sla_Breached || repeat) {
      await pool.query(
        `UPDATE COMPLAINT
         SET Sla_Breached = TRUE, Last_Staff_Alert = ?, Last_Supervisor_Alert = ?
         WHERE Complaint_ID_PK = ?`,
        [stamp, stamp, row.Complaint_ID_PK]
      );
      const message = `${row.Complaint_ID_PK} is past its ${normalizePriority(row.Priority)} resolution target. Assigned officer and the supervisor have been alerted again.`;
      await notifyUsers([staffUserId], row.Complaint_ID_PK, message, 'sla_breach', ['in_app']);
      await notifyUsers(supervisors, row.Complaint_ID_PK, message, 'sla_breach', ['in_app']);
    }
  }
}

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: 'The request could not be completed.' });
});

async function boot() {
  try {
    await pool.query('SELECT 1 FROM USER LIMIT 1');
    const [levelColumn] = await pool.query("SHOW COLUMNS FROM COMPLAINT LIKE 'Escalation_Level'");
    if (!levelColumn.length) {
      await pool.query('ALTER TABLE COMPLAINT ADD COLUMN Escalation_Level TINYINT NOT NULL DEFAULT 0');
    }
    const [questionColumn] = await pool.query("SHOW COLUMNS FROM USER LIKE 'Security_Question'");
    if (!questionColumn.length) {
      await pool.query('ALTER TABLE USER ADD COLUMN Security_Question VARCHAR(255) NULL, ADD COLUMN Security_Answer VARCHAR(255) NULL');
    }
    const [facedColumn] = await pool.query("SHOW COLUMNS FROM COMPLAINT LIKE 'Issue_Faced_At'");
    if (!facedColumn.length) {
      await pool.query('ALTER TABLE COMPLAINT ADD COLUMN Issue_Faced_At DATETIME NULL AFTER Submission_Date');
    }
    const [handoffColumn] = await pool.query("SHOW COLUMNS FROM COMPLAINT_ASSIGNMENT LIKE 'Handoff_Kind'");
    if (!handoffColumn.length) {
      await pool.query(
        `ALTER TABLE COMPLAINT_ASSIGNMENT
         ADD COLUMN From_Staff_ID VARCHAR(50) NULL,
         ADD COLUMN Handoff_Kind VARCHAR(20) NULL,
         ADD COLUMN Handoff_Remarks TEXT NULL`
      );
    }
    await ensureAuthorityRecords(pool);
    await ensureCanteenOfficer(pool);
    await normalizeCampusLocations(pool);
    dbReady = true;
    await watchSla().catch((error) => console.error('SLA check skipped:', error.message));
    await writeBackupFile().catch((error) => console.error('Backup skipped:', error.message));
    setInterval(() => {
      watchSla().catch((error) => console.error('SLA check failed:', error.message));
    }, 60 * 1000);
    setInterval(() => {
      writeBackupFile().catch((error) => console.error('Backup failed:', error.message));
    }, 60 * 60 * 1000);
    console.log(`MySQL connected (${DB_NAME}).`);
  } catch (error) {
    dbReady = false;
    console.error('MySQL is not ready:', error.message);
    console.error('Copy .env.example to .env, set DB_PASSWORD, then run npm run db:setup.');
  }
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`API listening on http://127.0.0.1:${PORT}`);
  });
}

boot();
