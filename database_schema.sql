-- ====================================================================
-- BANGLADESH UNIVERSITY OF PROFESSIONALS (BUP)
-- Smart Complaint & Maintenance Management System
-- Relational Database Schema based strictly on Figure 08 : ER Diagram
-- ====================================================================
-- Tables implemented per ER Diagram:
-- 1. ROLE (Role_ID_PK, Role_Name)
-- 2. USER (User_ID_PK, Name, Email, Phone, Password, User_Type, Role_ID_FK, Is_Flagged_Spammer)
-- 3. DEPARTMENT (Department_ID_PK, Department_Name, Contact_Info)
-- 4. MAINTENANCE_STAFF (Staff_ID_PK, Name, Email, Phone, Department_ID_FK)
-- 5. COMPLAINT_CATEGORY (Category_ID_PK, Category_Name, Description)
-- 6. LOCATION (Location_ID_PK, Building_Name, Floor, Room_Area)
-- 7. COMPLAINT (Complaint_ID_PK, User_ID_FK, Category_ID_FK, Location_ID_FK, Title, Description, Priority, Submission_Date, Current_Status)
-- 8. COMPLAINT_ASSIGNMENT (Assignment_ID_PK, Complaint_ID_FK, Staff_ID_FK, Assigned_Date, Assignment_Status)
-- 9. COMPLAINT_STATUS_HISTORY (History_ID_PK, Complaint_ID_FK, Status, Updated_By, Updated_Date, Remarks)
-- 10. NOTIFICATION (Notification_ID_PK, User_ID_FK, Complaint_ID_FK, Message, Notification_Date, Is_Read)
-- 11. EMERGENCY_CONTACTS (Official BUP Contact Directory)
-- ====================================================================

CREATE DATABASE IF NOT EXISTS bup_maintenance CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE bup_maintenance;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS NOTIFICATION;
DROP TABLE IF EXISTS COMPLAINT_STATUS_HISTORY;
DROP TABLE IF EXISTS COMPLAINT_ASSIGNMENT;
DROP TABLE IF EXISTS COMPLAINT;
DROP TABLE IF EXISTS USER_SESSION;
DROP TABLE IF EXISTS MAINTENANCE_STAFF;
DROP TABLE IF EXISTS USER;
DROP TABLE IF EXISTS ROLE;
DROP TABLE IF EXISTS DEPARTMENT;
DROP TABLE IF EXISTS COMPLAINT_CATEGORY;
DROP TABLE IF EXISTS LOCATION;
DROP TABLE IF EXISTS EMERGENCY_CONTACTS;

-- --------------------------------------------------------------------
-- 1. ROLE Table (ER: ROLE assigns USER)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS USER_SESSION;
DROP TABLE IF EXISTS ROLE;
CREATE TABLE ROLE (
    Role_ID_PK VARCHAR(50) PRIMARY KEY,
    Role_Name VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- --------------------------------------------------------------------
-- 2. USER Table (ER: USER submits COMPLAINT, receives NOTIFICATION)
--    Includes student red-flag anti-spam tracking attributes
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS USER;
CREATE TABLE USER (
    User_ID_PK VARCHAR(50) PRIMARY KEY,
    Name VARCHAR(150) NOT NULL,
    Email VARCHAR(150) NOT NULL UNIQUE,
    Phone VARCHAR(50) NOT NULL,
    Password VARCHAR(255) NOT NULL,
    User_Type VARCHAR(50) NOT NULL, -- 'student', 'faculty', 'officer', 'staff', 'admin'
    Role_ID_FK VARCHAR(50) NOT NULL,
    Student_Or_Employee_ID VARCHAR(50) NOT NULL UNIQUE,
    Department_Name VARCHAR(150) NOT NULL,
    Is_Flagged_Spammer BOOLEAN DEFAULT FALSE,
    Flag_Reason TEXT NULL,
    Flagged_Date DATETIME NULL,
    Notify_Email BOOLEAN NOT NULL DEFAULT TRUE,
    Notify_SMS BOOLEAN NOT NULL DEFAULT TRUE,
    Security_Question VARCHAR(255) NULL,
    Security_Answer VARCHAR(255) NULL,
    Last_Login DATETIME NULL,
    Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_role FOREIGN KEY (Role_ID_FK) REFERENCES ROLE(Role_ID_PK) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- --------------------------------------------------------------------
-- 3. DEPARTMENT Table (ER: DEPARTMENT employs MAINTENANCE_STAFF)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS DEPARTMENT;
CREATE TABLE DEPARTMENT (
    Department_ID_PK VARCHAR(50) PRIMARY KEY,
    Department_Name VARCHAR(150) NOT NULL UNIQUE,
    Contact_Info VARCHAR(100) NOT NULL,
    Head_Name VARCHAR(150),
    Email VARCHAR(150)
) ENGINE=InnoDB;

-- --------------------------------------------------------------------
-- 4. MAINTENANCE_STAFF Table (ER: receives COMPLAINT_ASSIGNMENT)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS MAINTENANCE_STAFF;
CREATE TABLE MAINTENANCE_STAFF (
    Staff_ID_PK VARCHAR(50) PRIMARY KEY,
    Name VARCHAR(150) NOT NULL,
    Email VARCHAR(150) NOT NULL,
    Phone VARCHAR(50) NOT NULL,
    Department_ID_FK VARCHAR(50) NOT NULL,
    Specialization VARCHAR(150) NOT NULL,
    Active_Tasks INT DEFAULT 0,
    CONSTRAINT fk_staff_department FOREIGN KEY (Department_ID_FK) REFERENCES DEPARTMENT(Department_ID_PK) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- --------------------------------------------------------------------
-- 5. COMPLAINT_CATEGORY Table (ER: categorizes COMPLAINT)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS COMPLAINT_CATEGORY;
CREATE TABLE COMPLAINT_CATEGORY (
    Category_ID_PK VARCHAR(50) PRIMARY KEY,
    Category_Name VARCHAR(150) NOT NULL UNIQUE,
    Description TEXT
) ENGINE=InnoDB;

-- --------------------------------------------------------------------
-- 6. LOCATION Table (ER: contains COMPLAINT) - Matches BUP Campus Map
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS LOCATION;
CREATE TABLE LOCATION (
    Location_ID_PK VARCHAR(50) PRIMARY KEY,
    Building_Name VARCHAR(150) NOT NULL,
    Floor VARCHAR(50) NOT NULL,
    Room_Area VARCHAR(150) NOT NULL,
    Campus_Zone ENUM('North', 'South', 'East', 'West', 'Central') DEFAULT 'North'
) ENGINE=InnoDB;

-- --------------------------------------------------------------------
-- 7. COMPLAINT Table (ER Central Entity: COMPLAINT)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS COMPLAINT;
CREATE TABLE COMPLAINT (
    Complaint_ID_PK VARCHAR(50) PRIMARY KEY, -- e.g. 'CMP-2026-001'
    User_ID_FK VARCHAR(50) NOT NULL,
    Category_ID_FK VARCHAR(50) NOT NULL,
    Location_ID_FK VARCHAR(50) NOT NULL,
    Title VARCHAR(255) NOT NULL,
    Description TEXT NOT NULL,
    Priority ENUM('Low', 'Normal', 'High', 'Urgent') NOT NULL DEFAULT 'Normal',
    Submission_Date DATETIME NOT NULL,
    Issue_Faced_At DATETIME NULL,
    Current_Status ENUM('Pending', 'Assigned', 'In Progress', 'On Hold', 'Escalated', 'Resolved', 'Closed', 'Rejected') NOT NULL DEFAULT 'Pending',
    Image_URL VARCHAR(500) NULL,
    Video_URL VARCHAR(500) NULL,
    Attachment_Type ENUM('none', 'photo', 'video') NOT NULL DEFAULT 'none',
    Is_Emergency BOOLEAN NOT NULL DEFAULT FALSE,
    Follow_Up_Count INT NOT NULL DEFAULT 0,
    Last_Follow_Up_At DATETIME NULL,
    Sla_Due_At DATETIME NULL,
    Sla_Breached BOOLEAN NOT NULL DEFAULT FALSE,
    Last_Staff_Alert DATETIME NULL,
    Last_Supervisor_Alert DATETIME NULL,
    Acknowledgement_Message VARCHAR(500) NULL,
    Resolution_Remarks TEXT NULL,
    Feedback_Rating INT NULL,
    Feedback_Comment TEXT NULL,
    Rejection_Reason TEXT NULL,
    Resolved_Date DATETIME NULL,
    Escalation_Level TINYINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_complaint_user FOREIGN KEY (User_ID_FK) REFERENCES USER(User_ID_PK) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_complaint_category FOREIGN KEY (Category_ID_FK) REFERENCES COMPLAINT_CATEGORY(Category_ID_PK) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_complaint_location FOREIGN KEY (Location_ID_FK) REFERENCES LOCATION(Location_ID_PK) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_complaint_user_submission (User_ID_FK, Submission_Date),
    INDEX idx_complaint_location_status (Location_ID_FK, Current_Status)
) ENGINE=InnoDB;

-- --------------------------------------------------------------------
-- 8. COMPLAINT_ASSIGNMENT Table (ER: COMPLAINT has COMPLAINT_ASSIGNMENT)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS COMPLAINT_ASSIGNMENT;
CREATE TABLE COMPLAINT_ASSIGNMENT (
    Assignment_ID_PK VARCHAR(50) PRIMARY KEY,
    Complaint_ID_FK VARCHAR(50) NOT NULL,
    Staff_ID_FK VARCHAR(50) NOT NULL,
    Assigned_Date DATETIME NOT NULL,
    Assignment_Status VARCHAR(50) NOT NULL DEFAULT 'Assigned',
    Assignment_Notes TEXT,
    From_Staff_ID VARCHAR(50) NULL,
    Handoff_Kind VARCHAR(20) NULL,
    Handoff_Remarks TEXT NULL,
    CONSTRAINT fk_assign_complaint FOREIGN KEY (Complaint_ID_FK) REFERENCES COMPLAINT(Complaint_ID_PK) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_assign_staff FOREIGN KEY (Staff_ID_FK) REFERENCES MAINTENANCE_STAFF(Staff_ID_PK) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- --------------------------------------------------------------------
-- 9. COMPLAINT_STATUS_HISTORY Table (ER: COMPLAINT tracks HISTORY)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS COMPLAINT_STATUS_HISTORY;
CREATE TABLE COMPLAINT_STATUS_HISTORY (
    History_ID_PK VARCHAR(50) PRIMARY KEY,
    Complaint_ID_FK VARCHAR(50) NOT NULL,
    Status VARCHAR(50) NOT NULL,
    Updated_By VARCHAR(150) NOT NULL,
    Updated_Date DATETIME NOT NULL,
    Remarks TEXT,
    Update_Channel VARCHAR(30) NOT NULL DEFAULT 'portal',
    CONSTRAINT fk_history_complaint FOREIGN KEY (Complaint_ID_FK) REFERENCES COMPLAINT(Complaint_ID_PK) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- --------------------------------------------------------------------
-- 10. NOTIFICATION Table (ER: COMPLAINT generates NOTIFICATION to USER)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS NOTIFICATION;
CREATE TABLE NOTIFICATION (
    Notification_ID_PK VARCHAR(50) PRIMARY KEY,
    User_ID_FK VARCHAR(50) NOT NULL,
    Complaint_ID_FK VARCHAR(50) NULL,
    Message TEXT NOT NULL,
    Notification_Date DATETIME NOT NULL,
    Is_Read BOOLEAN DEFAULT FALSE,
    Notification_Type VARCHAR(50) DEFAULT 'status_update',
    Channel ENUM('in_app', 'email', 'sms', 'phone') NOT NULL DEFAULT 'in_app',
    CONSTRAINT fk_notif_user FOREIGN KEY (User_ID_FK) REFERENCES USER(User_ID_PK) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_notif_complaint FOREIGN KEY (Complaint_ID_FK) REFERENCES COMPLAINT(Complaint_ID_PK) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- --------------------------------------------------------------------
-- 11. USER_SESSION (NFR-12 idle timeout; extends the ER user record)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS USER_SESSION;
CREATE TABLE USER_SESSION (
    Session_ID_PK VARCHAR(64) PRIMARY KEY,
    User_ID_FK VARCHAR(50) NOT NULL,
    Created_At DATETIME NOT NULL,
    Last_Activity DATETIME NOT NULL,
    Expires_At DATETIME NOT NULL,
    CONSTRAINT fk_session_user FOREIGN KEY (User_ID_FK) REFERENCES USER(User_ID_PK) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_session_user (User_ID_FK)
) ENGINE=InnoDB;

-- --------------------------------------------------------------------
-- 12. EMERGENCY_CONTACTS Table (Official BUP Contact Directory)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS EMERGENCY_CONTACTS;
CREATE TABLE EMERGENCY_CONTACTS (
    Contact_ID_PK VARCHAR(50) PRIMARY KEY,
    Category VARCHAR(100) NOT NULL, -- 'West Campus Lifts', 'East Campus Lifts', 'Engineering Services', 'Important Contacts'
    Name VARCHAR(150) NOT NULL,
    Designation VARCHAR(150),
    Contact_Number VARCHAR(50) NOT NULL,
    Alt_Contact VARCHAR(50),
    Email VARCHAR(150),
    Telephone_Instruction VARCHAR(255)
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;

-- ====================================================================
-- SEED DATA INSERTION
-- ====================================================================

-- Insert Roles
INSERT INTO ROLE (Role_ID_PK, Role_Name) VALUES
('ROLE-STU', 'student'),
('ROLE-FAC', 'faculty'),
('ROLE-OFF', 'officer'),
('ROLE-MNT', 'maintenance'),
('ROLE-ADM', 'admin');

-- Insert Departments
INSERT INTO DEPARTMENT (Department_ID_PK, Department_Name, Contact_Info, Head_Name, Email) VALUES
('dept-electrical', 'Electrical & Substation Wing', '01769-028797', 'Engr. Rezaul Karim', 'electrical@bup.edu.bd'),
('dept-ict', 'ICT & Network Operations Desk', '+880 1769-021230', 'Md. Shahidul Islam', 'ict.noc@bup.edu.bd'),
('dept-estate', 'Estate & Plumbing Office', '01769-028797', 'Engr. Masud Rana', 'estate@bup.edu.bd'),
('dept-security', 'Campus Security & Proctor', '+880 1769-028787', 'Major (Retd) Anwar Hossain', 'chief.security@bup.edu.bd'),
('dept-harassment', 'Harassment Resolution Desk', '+880 1769-028477', 'Ayesha Akter', 'harassment.desk@bup.edu.bd'),
('dept-drug', 'Drug Prevention Desk', '+880 1769-021850', 'Kamrul Hasan', 'drug.prevention@bup.edu.bd'),
('dept-security-control', 'Security Control', '+880 1769-028787', 'Hasan Hafiz', 'security.control@bup.edu.bd'),
('dept-misc', 'Miscellaneous Complaints', '+880 1769-028797', 'Minhaz Chowdhury', 'misc.complaints@bup.edu.bd'),
('dept-canteen', 'Canteen and Food Services', '+880 1700-110505', 'Abul Hannan', 'canteen.food@bup.edu.bd');

-- Insert Maintenance Staff
INSERT INTO MAINTENANCE_STAFF (Staff_ID_PK, Name, Email, Phone, Department_ID_FK, Specialization, Active_Tasks) VALUES
('staff-1', 'Rafiqul Islam', 'rafiqul.maint@bup.edu.bd', '+880 1711-234567', 'dept-electrical', 'HVAC Chillers, Substation & 3-Phase Power', 2),
('staff-2', 'Tariqul Alam', 'tariqul.ict@bup.edu.bd', '+880 1819-345678', 'dept-ict', 'Campus Wi-Fi 6, Fiber Splice & AP Switches', 1),
('staff-3', 'Nurul Huda', 'nurul.estate@bup.edu.bd', '+880 1912-456789', 'dept-estate', 'Clean Water Flow, Pressure Valves & Drainage', 1),
('staff-4', 'Abul Kashem', 'kashem.lift@bup.edu.bd', '01777954042', 'dept-electrical', 'West Campus Lift Operator cum Mechanic', 0),
('staff-5', 'Harun ur Rashid', 'harun.lift@bup.edu.bd', '01751832228', 'dept-electrical', 'East Campus Lift Operator cum Mechanic', 0),
('staff-ayesha', 'Ayesha Akter', 'ayesha.harassment@bup.edu.bd', '+880 1700-110501', 'dept-harassment', 'Harassment Resolution Desk', 0),
('staff-kamrul', 'Kamrul Hasan', 'kamrul.drug@bup.edu.bd', '+880 1700-110502', 'dept-drug', 'Drug Prevention Desk', 0),
('staff-hasan', 'Hasan Hafiz', 'hasan.security@bup.edu.bd', '+880 1700-110503', 'dept-security-control', 'Security Control', 0),
('staff-minhaz', 'Minhaz Chowdhury', 'minhaz.misc@bup.edu.bd', '+880 1700-110504', 'dept-misc', 'Miscellaneous Complaint Handler', 0),
('staff-canteen', 'Abul Hannan', 'canteen.food@bup.edu.bd', '+880 1700-110505', 'dept-canteen', 'Canteen and food complaints', 0);

-- Insert Users (Including red-flagged spammer test student)
INSERT INTO USER (User_ID_PK, Name, Email, Phone, Password, User_Type, Role_ID_FK, Student_Or_Employee_ID, Department_Name, Is_Flagged_Spammer, Flag_Reason, Flagged_Date) VALUES
('user-nusrat', 'Nusrat Jahan', 'nusrat@bup.edu.bd', '+880 1712-334455', '123456', 'student', 'ROLE-STU', '24549010088', 'BICE 2024, Dept of ICT, FST', FALSE, NULL, NULL),
('user-saha', 'Dr. Suman Saha', 'suman.saha@bup.edu.bd', '+880 1711-889900', '123456', 'faculty', 'ROLE-FAC', 'FAC-IOT-108', 'Department of ICT, FST', FALSE, NULL, NULL),
('user-zahid', 'Brigadier General Zahid Hasan', 'admin.maintenance@bup.edu.bd', '+880 1711-000101', '123456', 'admin', 'ROLE-ADM', 'ADM-BUP-001', 'Campus Maintenance Administration', FALSE, NULL, NULL),
('user-rafiqul', 'Rafiqul Islam', 'rafiqul.maint@bup.edu.bd', '+880 1711-234567', '123456', 'staff', 'ROLE-MNT', 'STF-ELEC-401', 'Electrical & Substation Wing', FALSE, NULL, NULL),
('user-tariqul', 'Tariqul Alam', 'tariqul.ict@bup.edu.bd', '+880 1819-345678', '123456', 'staff', 'ROLE-MNT', 'STF-ICT-220', 'ICT & Network Operations Desk', FALSE, NULL, NULL),
('user-nurul', 'Nurul Huda', 'nurul.estate@bup.edu.bd', '+880 1912-456789', '123456', 'staff', 'ROLE-MNT', 'STF-EST-118', 'Estate & Plumbing Office', FALSE, NULL, NULL),
('user-ayesha', 'Ayesha Akter', 'ayesha.harassment@bup.edu.bd', '+880 1700-110501', '123456', 'staff', 'ROLE-MNT', 'STF-HAR-501', 'Harassment Resolution Desk', FALSE, NULL, NULL),
('user-kamrul', 'Kamrul Hasan', 'kamrul.drug@bup.edu.bd', '+880 1700-110502', '123456', 'staff', 'ROLE-MNT', 'STF-DRG-502', 'Drug Prevention Desk', FALSE, NULL, NULL),
('user-hasan', 'Hasan Hafiz', 'hasan.security@bup.edu.bd', '+880 1700-110503', '123456', 'staff', 'ROLE-MNT', 'STF-SEC-503', 'Security Control', FALSE, NULL, NULL),
('user-minhaz', 'Minhaz Chowdhury', 'minhaz.misc@bup.edu.bd', '+880 1700-110504', '123456', 'staff', 'ROLE-MNT', 'STF-MSC-504', 'Miscellaneous Complaints', FALSE, NULL, NULL),
('user-canteen', 'Abul Hannan', 'canteen.food@bup.edu.bd', '+880 1700-110505', '123456', 'staff', 'ROLE-MNT', 'STF-CAN-505', 'Canteen and Food Services', FALSE, NULL, NULL),
('user-spammer', 'Tanzim Ahmed (Spam Test)', 'tanzim.spam@bup.edu.bd', '+880 1799-112233', '123456', 'student', 'ROLE-STU', '24549010999', 'Dept of BBA, FBS', TRUE, 'Red-flagged: Submitted 5 repetitive non-issues within 10 minutes (Anti-Spam Rule)', '2026-10-12 14:20:00');

-- Insert Complaint Categories
INSERT INTO COMPLAINT_CATEGORY (Category_ID_PK, Category_Name, Description) VALUES
('cat-elec', 'Electrical & Power Wing', 'Power cut, socket damage, circuit tripping, lighting ballast failure, generator backup'),
('cat-ac', 'HVAC & Central Air Conditioning', 'Air conditioner cooling failure, refrigerant leaks, thermostat malfunction, ventilation ducts'),
('cat-ict', 'ICT Network & Multimedia', 'Classroom projector, smartboard HDMI, campus Wi-Fi access point, NOC fiber splice'),
('cat-water', 'Water Supply & Plumbing', 'Washroom pipe leakage, overhead tank shortage, filtration unit, tap fixtures'),
('cat-lift', 'Elevators & Lift Emergency', 'Lift entrapment, door misalignment, call button panel failure'),
('cat-civil', 'Civil Works & Carpentry', 'Door locks, broken student desk/chair, broken window panes, wall seepage'),
('cat-sports', 'Sports', 'Grounds, courts, gym equipment, and sports-facility problems'),
('cat-medical', 'Medical', 'Medical Center service, first aid, or campus health-facility issues'),
('cat-library', 'Library', 'Library rooms, furniture, lighting, and access problems'),
('cat-classroom', 'Classroom', 'Teaching rooms, boards, furniture, and classroom utilities'),
('cat-canteen', 'Canteen', 'Food, hygiene, and canteen facility problems'),
('cat-office', 'Office', 'Department offices, reception, and administrative rooms'),
('cat-harassment', 'Harassment', 'Sexual harassment or other harassment on campus'),
('cat-drug', 'Drug abuse', 'Suspected drug use, possession, or sale on campus'),
('cat-bullying', 'Bullying', 'Bullying, intimidation, or repeated targeting of a person'),
('cat-racism', 'Racism', 'Racist remarks, discrimination, or exclusion on campus'),
('cat-violation', 'Violation', 'Rules, conduct, or campus-policy violations'),
('cat-ragging', 'Ragging', 'Ragging, hazing, or forced humiliation of a student'),
('cat-other', 'Other', 'A campus issue that does not fit the listed categories');

-- Insert Locations matching Hand-drawn Campus Map
INSERT INTO LOCATION (Location_ID_PK, Building_Name, Floor, Room_Area, Campus_Zone) VALUES
('loc-acad-1', 'Academic Building', '4th Floor', 'IoT Research Lab 402', 'North'),
('loc-acad-2', 'Academic Building', '3rd Floor', 'Lecture Gallery 301', 'North'),
('loc-fbs-1', 'FBS (Faculty of Business Studies)', '2nd Floor', 'Seminar Hall 204', 'North'),
('loc-admin-1', 'Admin Building', '1st Floor', 'Conference Room Level 1', 'North'),
('loc-fst-1', 'FST (Faculty of Science & Technology)', 'Ground Floor', 'Computer Lab 101', 'South'),
('loc-fst-2', 'FST (Faculty of Science & Technology)', '2nd Floor', 'Faculty Lounge Room 212', 'South'),
('loc-fass-1', 'FASS (Arts & Social Sciences)', '3rd Floor', 'Auditorium FASS', 'South'),
('loc-med-1', 'Medical Centre', 'Ground Floor', 'Emergency First Aid Room', 'West'),
('loc-gym-1', 'Gymnasium & Sports Complex', 'Ground Floor', 'Indoor Basketball Court', 'West'),
('loc-canteen-1', 'Staff Canteen', 'Ground Floor', 'Dining Area', 'West'),
('loc-utility-1', 'Utility & Substation Block', 'Level 1', 'Main Distribution Board Room', 'South'),
('loc-medical-center', 'Medical Center', 'Campus', 'Medical Center', 'West'),
('loc-vista-cafe', 'Vista Cafe', 'Campus', 'Vista Cafe', 'Central'),
('loc-amitie-cafe', 'Amitie Cafe', 'Campus', 'Amitie Cafe', 'Central'),
('loc-alcove-cafe', 'Alcove Cafe', 'Campus', 'Alcove Cafe', 'Central'),
('loc-pitstop', 'Pitstop Canteen', 'Campus', 'Pitstop Canteen', 'Central'),
('loc-3rd-place', '3rd Place', 'Campus', '3rd Place', 'Central'),
('loc-reception', 'Reception', 'Campus', 'Reception', 'Central'),
('loc-upper-plaza', 'Upper Plaza', 'Campus', 'Upper Plaza', 'Central'),
('loc-lower-plaza', 'Lower Plaza', 'Campus', 'Lower Plaza', 'Central'),
('loc-bus-stop', 'Bus Stop', 'Campus', 'Bus Stop', 'East'),
('loc-lift', 'Lift', 'Campus', 'Lift', 'Central'),
('loc-ict-center', 'ICT Center', 'Campus', 'ICT Center', 'South'),
('loc-security-cell', 'Security Cell', 'Campus', 'Security Cell', 'Central'),
('loc-fst-tower', 'FST Tower', 'Campus', 'FST Tower', 'South'),
('loc-fbs-tower', 'FBS Tower', 'Campus', 'FBS Tower', 'North'),
('loc-fsss-tower', 'FSSS Tower', 'Campus', 'FSSS Tower', 'East'),
('loc-fass-tower', 'FASS Tower', 'Campus', 'FASS Tower', 'South'),
('loc-admin-tower', 'Admin Tower', 'Campus', 'Admin Tower', 'North'),
('loc-stationary', 'Stationary Shop', 'Campus', 'Stationary Shop', 'Central'),
('loc-computer-lab', 'Computer Lab', 'Campus', 'Computer Lab', 'South'),
('loc-microwave-lab', 'Microwave Lab', 'Campus', 'Microwave Lab', 'South'),
('loc-communication-lab', 'Communication Lab', 'Campus', 'Communication Lab', 'South'),
('loc-electrical-lab', 'Electrical Lab', 'Campus', 'Electrical Lab', 'South'),
('loc-physics-lab', 'Physics Lab', 'Campus', 'Physics Lab', 'South'),
('loc-atm', 'ATM Booth', 'Campus', 'ATM Booth', 'Central'),
('loc-utility-building', 'Utility Building', 'Campus', 'Utility Building', 'South');

-- Insert Official BUP Emergency Contacts
INSERT INTO EMERGENCY_CONTACTS (Contact_ID_PK, Category, Name, Designation, Contact_Number, Alt_Contact, Email, Telephone_Instruction) VALUES
-- West Campus Lift Contacts
('emg-w1', 'West Campus Lifts', 'Control Room', 'Lift Central Control', '1234', NULL, NULL, 'Enter 9 before mobile number when calling via telephone system'),
('emg-w2', 'West Campus Lifts', 'Abul Kashem', 'Lift Operator cum Mechanic', '01777954042', NULL, NULL, 'Enter 9 before mobile number when calling via telephone system'),
('emg-w3', 'West Campus Lifts', 'Shagor', 'Lift Operator cum Mechanic', '01995250550', NULL, NULL, 'Enter 9 before mobile number when calling via telephone system'),
('emg-w4', 'West Campus Lifts', 'Md Sumon', 'Lift Operator cum Mechanic', '01609900931', NULL, NULL, 'Enter 9 before mobile number when calling via telephone system'),

-- East Campus Lift Contacts
('emg-e1', 'East Campus Lifts', 'Control Room', 'Lift Central Control', '1234', NULL, NULL, 'Enter 9 before mobile number when calling via telephone system'),
('emg-e2', 'East Campus Lifts', 'Harun ur Rashid', 'Lift Operator cum Mechanic', '01751832228', NULL, NULL, 'Enter 9 before mobile number when calling via telephone system'),
('emg-e3', 'East Campus Lifts', 'Rajib Ahmed', 'Lift Operator cum Mechanic', '01630299369', NULL, NULL, 'Enter 9 before mobile number when calling via telephone system'),
('emg-e4', 'East Campus Lifts', 'Ashik Imran', 'Lift Operator cum Mechanic', '01701270335', NULL, NULL, 'Enter 9 before mobile number when calling via telephone system'),

-- Engineering Services
('emg-eng1', 'Engineering Services', 'Engineering Services Desk', 'Electrical, Plumbing, Sanitary, etc.', '01769-028797', NULL, NULL, 'Direct Engineering Dispatch'),

-- Important Contacts
('emg-imp1', 'Important Contacts', 'Information Desk', 'General Enquiries', '+8802-8000368', NULL, NULL, NULL),
('emg-imp2', 'Important Contacts', 'Army', 'PABX Line', '3137', NULL, NULL, NULL),
('emg-imp3', 'Important Contacts', 'Fax', 'Campus Fax', '02-8000443', NULL, NULL, NULL),
('emg-imp4', 'Important Contacts', 'Security Control Room', 'Campus Security Wing', '+8809666790799', NULL, 'chief.security@bup.edu.bd', NULL),
('emg-imp5', 'Important Contacts', 'Medical Centre', 'Medical Centre', '+8801769-021999', NULL, NULL, NULL),
('emg-imp6', 'Important Contacts', 'Sexual Harassment Complaint Committee', 'President Office', '+8801769-028477', NULL, NULL, NULL),
('emg-imp7', 'Important Contacts', 'Drug Abuse Prevention Committee', 'President Office', '+8801769-021850', NULL, NULL, NULL),
('emg-imp8', 'Important Contacts', 'Website', 'Official BUP website', 'www.bup.edu.bd', NULL, NULL, NULL);

-- Insert Sample Complaints
INSERT INTO COMPLAINT (Complaint_ID_PK, User_ID_FK, Category_ID_FK, Location_ID_FK, Title, Description, Priority, Submission_Date, Current_Status, Image_URL, Feedback_Rating, Feedback_Comment) VALUES
('CMP-2026-001', 'user-nusrat', 'cat-ac', 'loc-acad-1', 'Air conditioner not cooling in IoT Lab 402', 'Unit making loud rattling noise and not chilling room below 28C during class hours.', 'High', '2026-05-26 09:30:00', 'In Progress', 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600', NULL, NULL),
('CMP-2026-002', 'user-saha', 'cat-ict', 'loc-acad-2', 'HDMI Projector flickering in Lecture Gallery 301', 'Audio crackles and display cuts to black every few minutes.', 'Normal', '2026-05-26 10:15:00', 'Resolved', 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=600', 5, 'HDMI port replaced promptly before lecture.'),
('CMP-2026-003', 'user-nusrat', 'cat-elec', 'loc-fst-1', 'Power socket sparking near Workstation 08', 'Spark seen when plugging in laptop charger. Needs urgent inspection.', 'Urgent', '2026-05-26 11:00:00', 'Pending', 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600', NULL, NULL);

-- Insert Complaint Assignments
INSERT INTO COMPLAINT_ASSIGNMENT (Assignment_ID_PK, Complaint_ID_FK, Staff_ID_FK, Assigned_Date, Assignment_Status, Assignment_Notes) VALUES
('ASN-001', 'CMP-2026-001', 'staff-1', '2026-05-26 10:00:00', 'In Progress', 'Check compressor refrigerant pressure and replace fan belt.'),
('ASN-002', 'CMP-2026-002', 'staff-2', '2026-05-26 10:30:00', 'Resolved', 'Replaced ceiling HDMI cable and re-crimped wall plate.');

-- Insert Complaint Status History
INSERT INTO COMPLAINT_STATUS_HISTORY (History_ID_PK, Complaint_ID_FK, Status, Updated_By, Updated_Date, Remarks) VALUES
('HIS-001', 'CMP-2026-001', 'Pending', 'Nusrat Jahan', '2026-05-26 09:30:00', 'Initial complaint logged via student portal.'),
('HIS-002', 'CMP-2026-001', 'Assigned', 'Brigadier General Zahid Hasan', '2026-05-26 10:00:00', 'Dispatched to Lead Technician Rafiqul Islam.'),
('HIS-003', 'CMP-2026-001', 'In Progress', 'Rafiqul Islam', '2026-05-26 10:45:00', 'Arrived on site; disassembled unit shroud to inspect coils.');

-- Insert Notifications
INSERT INTO NOTIFICATION (Notification_ID_PK, User_ID_FK, Complaint_ID_FK, Message, Notification_Date, Is_Read, Notification_Type) VALUES
('NOT-001', 'user-nusrat', 'CMP-2026-001', 'Your complaint CMP-2026-001 has been assigned to Rafiqul Islam (Electrical & Substation Wing).', '2026-05-26 10:00:00', FALSE, 'assignment'),
('NOT-002', 'user-nusrat', 'CMP-2026-001', 'Technician Rafiqul Islam arrived on-site in Academic Building 402 and began diagnostics.', '2026-05-26 10:45:00', FALSE, 'status_update'),
('NOT-003', 'user-saha', 'CMP-2026-002', 'Complaint CMP-2026-002 has been marked Resolved. Please submit your service feedback rating.', '2026-05-26 11:30:00', TRUE, 'resolution');

-- Historical seed complaints are already past their targets. Mark them so the
-- supervisor watcher does not replay alerts every time the API starts.
UPDATE COMPLAINT
SET Sla_Due_At = DATE_ADD(Submission_Date, INTERVAL
      CASE Priority
        WHEN 'Urgent' THEN 2
        WHEN 'High' THEN 8
        WHEN 'Low' THEN 72
        ELSE 24
      END HOUR),
    Sla_Breached = CASE
      WHEN Current_Status IN ('Resolved', 'Closed', 'Rejected') THEN FALSE
      ELSE TRUE
    END,
    Last_Staff_Alert = NOW(),
    Last_Supervisor_Alert = NOW(),
    Is_Emergency = CASE WHEN Priority = 'Urgent' THEN TRUE ELSE FALSE END,
    Acknowledgement_Message = CONCAT('Complaint ', Complaint_ID_PK, ' was registered. An acknowledgement was sent in the portal, by email, and by SMS.');
