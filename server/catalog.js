export const ACADEMIC_DEPARTMENTS = [
  'Department of Economics',
  'Department of English',
  'Department of Public Administration',
  'Department of Development Studies',
  'Department of Sociology',
  'Department of Disaster Management & Resilience',
  'Department of BA/BSS',
  'Department of Islamic Studies',
  'Department of International Relations',
  'Department of Mass Communication and Journalism',
  'Department of Law',
  'Department of Peace, Conflict and Human Rights',
  'Department of Information and Communication Technology (ICT)',
  'Department of Computer Science and Engineering (CSE)',
  'Department of Environmental Science',
  'Department of Data Science',
  'Department of Business Administration – General',
  'Department of Business Administration in Accounting & Information Systems',
  'Department of Business Administration in Management Studies',
  'Department of Business Administration in Finance & Banking',
  'Department of Business Administration in Marketing',
  'Department of Pharmacy',
  'Department of Public Health and Informatics',
  'Administration',
  'Others',
];

export const SECURITY_QUESTIONS = [
  'What is the name of your first school?',
  'What city were you born in?',
  "What is your mother's maiden name?",
  'What is the name of your favourite teacher?',
  'What was your childhood nickname?',
];

const TOP_IDS = {
  vc: 'staff-vc',
  provc: 'staff-provc',
  treasurer: 'staff-treasurer',
  registrar: 'staff-registrar',
};

function person(employeeId, id, name, title, office, email, categoryId, categoryName, top) {
  return {
    id,
    userId: `user-${id.replace('staff-', '')}`,
    employeeId,
    name,
    title,
    office,
    email,
    phone: `+880 1700-13${employeeId.slice(-2)}`,
    categoryId,
    categoryName,
    top,
  };
}

export const SECTION_AUTHORITIES = [
  person('AUTH-01', 'staff-inspector', 'Brigadier General Md Enamul Islam', 'Inspector of Colleges', 'Office of the Inspector of Colleges', 'inspector.colleges@bup.edu.bd', 'cat-colleges', 'Inspector of Colleges', 'vc'),
  person('AUTH-02', 'staff-exam', 'Brigadier General Nishadul Islam Khan', 'Controller of Exam', 'Controller of Examination', 'controller.exam@bup.edu.bd', 'cat-exam', 'Controller of Examination', 'registrar'),
  person('AUTH-03', 'staff-cfo', 'Brigadier General Md Shazzad Hossain', 'Chief Finance Officer', 'Office of the Chief Finance Officer', 'cfo@bup.edu.bd', 'cat-finance', 'Finance', 'treasurer'),
  person('AUTH-04', 'staff-planning', 'Brigadier General Md. Monzurul Islam', 'Chief Planning Development & Works', 'Chief Planning, Development & Works', 'planning.works@bup.edu.bd', 'cat-planning', 'Planning, Development and Works', 'vc'),
  person('AUTH-05', 'staff-ict-chief', 'Brigadier General Khandaker Towhid Murad', 'Chief ICT Officer', 'ICT Centre', 'chief.ict@bup.edu.bd', 'cat-ict-centre', 'ICT Centre', 'vc'),
  person('AUTH-06', 'staff-prip', 'Air Commodore Abul Fazal Muhammad Atiquzzaman', 'Chief of PRI&P', 'Public Relations, Information & Publications', 'prip@bup.edu.bd', 'cat-prip', 'Public Relations and Publications', 'vc'),
  person('AUTH-07', 'staff-oefcd', 'Commodore Mohammad Waseem Maqsood', 'Dean', 'Office of Evaluation, Faculty & Curriculum Development', 'oefcd@bup.edu.bd', 'cat-oefcd', 'Faculty and Curriculum', 'provc'),
  person('AUTH-08', 'staff-brc', 'Brigadier General Md Habibul Huq', 'Dean', 'BUP Research Centre', 'brc@bup.edu.bd', 'cat-brc', 'BUP Research Centre', 'registrar'),
  person('AUTH-09', 'staff-cml', 'Md Solmon Ibne A Rouf', 'Dean', 'Centre for Modern Languages', 'cml@bup.edu.bd', 'cat-cml', 'Modern Languages', 'registrar'),
  person('AUTH-10', 'staff-cpc', 'Major Shajeda Akter Moni', 'Deputy Director', 'Counseling & Placement Centre', 'cpc@bup.edu.bd', 'cat-cpc', 'Counseling and Placement', 'registrar'),
  person('AUTH-11', 'staff-admission', 'Major Imtiaz Pervez', 'Deputy Registrar', 'Admission Section', 'admission@bup.edu.bd', 'cat-admission', 'Admission', 'registrar'),
  person('AUTH-12', 'staff-research-support', 'Dr. S. M. Salim Reza', 'Assistant Professor', 'Research Support Section', 'research.support@bup.edu.bd', 'cat-research-support', 'Research Support', 'registrar'),
  person('AUTH-13', 'staff-council', 'Major Md Jaowad Bin Faruk', 'Deputy Registrar', 'Council Section', 'council@bup.edu.bd', 'cat-council', 'Council Section', 'registrar'),
  person('AUTH-14', 'staff-alumni', 'Major Masuma Akter', 'Deputy Registrar', 'BUP Alumni Association', 'alumni@bup.edu.bd', 'cat-alumni', 'Alumni Association', 'registrar'),
  person('AUTH-15', 'staff-legal', 'Niamat Ullah', 'Legal Officer', 'Legal Cell', 'legal.cell@bup.edu.bd', 'cat-legal', 'Legal Cell', 'vc'),
  person('AUTH-16', 'staff-sports-centre', 'Lieutenant Colonel Mohammad Ashaduzzaman', 'Additional Director', 'Physical Education Centre', 'physical.education@bup.edu.bd', 'cat-physical-education', 'Physical Education', 'vc'),
  person('AUTH-17', 'staff-establishment', 'Major Fida Noor', 'Deputy Registrar', 'Establishment Section', 'establishment@bup.edu.bd', 'cat-establishment', 'Establishment', 'registrar'),
  person('AUTH-18', 'staff-training', 'Md. Kazi Zahidul Islam', 'Section In Charge', 'Training Cell', 'training.cell@bup.edu.bd', 'cat-training', 'Training', 'registrar'),
  person('AUTH-19', 'staff-audit', 'Lieutenant Colonel Mohammad Nazmus Sakib', 'Additional Director', 'Audit Cell', 'audit.cell@bup.edu.bd', 'cat-audit', 'Audit', 'treasurer'),
  person('AUTH-20', 'staff-medical', 'Dr. Azizunnahar', 'Medical Officer', 'Medical Centre', 'medical.centre@bup.edu.bd', 'cat-medical-centre', 'Medical Centre', 'vc'),
  person('AUTH-21', 'staff-oia', 'Lieutenant Colonel Khondoker Zahirul Alam', 'Director', 'Office of International Affairs', 'oia@bup.edu.bd', 'cat-oia', 'International Affairs', 'vc'),
  person('AUTH-22', 'staff-library', 'Lieutenant Colonel Md Mahmud Hassan', 'Librarian', 'BUP Central Library & Archive', 'library@bup.edu.bd', 'cat-library-centre', 'Central Library', 'registrar'),
  person('AUTH-23', 'staff-mt', 'Lieutenant Colonel Rubaiya Mahrukh', 'Additional Registrar', 'MT Section', 'mt.section@bup.edu.bd', 'cat-mt', 'Transport (MT)', 'vc'),
  person('AUTH-24', 'staff-procurement', 'Lieutenant Colonel Shahriar Mustafiz', 'Additional Registrar', 'Procurement Section', 'procurement@bup.edu.bd', 'cat-procurement', 'Procurement', 'treasurer'),
  person('AUTH-25', 'staff-academic', 'Lieutenant Colonel Mahmudur Rahman Roman', 'Additional Registrar', 'Academic Section', 'academic.section@bup.edu.bd', 'cat-academic', 'Academic Section', 'registrar'),
  person('AUTH-26', 'staff-female-hall', 'Shamsad Jahan', 'Assistant Director', 'Female Student Hall', 'female.hall@bup.edu.bd', 'cat-female-hall', 'Female Student Hall', 'registrar'),
  person('AUTH-27', 'staff-iqac', 'Brigadier General Muhammad Ali Talukder', 'Chief IQAC', 'Institutional Quality Assurance Cell', 'iqac@bup.edu.bd', 'cat-iqac', 'Quality Assurance (IQAC)', 'provc'),
  person('AUTH-28', 'staff-male-hall', 'Md. Mushfiqur Rahman', 'Assistant Registrar', 'Male Student Hall', 'male.hall@bup.edu.bd', 'cat-male-hall', 'Male Student Hall', 'registrar'),
  person('AUTH-29', 'staff-proctor', 'Md. Parvez Alam', 'Assistant Director', 'Office of the Proctor', 'proctor@bup.edu.bd', 'cat-proctor', 'Proctor Office', 'vc'),
  person('AUTH-30', 'staff-security-chief', 'Major Shamim Shakawat', 'Chief Security Officer', 'Security Cell', 'security.cell@bup.edu.bd', 'cat-security-cell', 'Security Cell', 'vc'),
  person('AUTH-31', 'staff-engineer', 'Colonel Khandaker Hasan Mashjood', 'Chief Engineer', 'Engineering & Maintenance Section', 'chief.engineer@bup.edu.bd', 'cat-engineering', 'Engineering and Maintenance', 'vc'),
  person('AUTH-32', 'staff-defence', 'Major Kazi Mozammel Hossain', 'Deputy Registrar', 'Defence Personnel Cell', 'defence.cell@bup.edu.bd', 'cat-defence', 'Defence Personnel', 'vc'),
];

export const TOP_AUTHORITIES = [
  person('AUTH-33', 'staff-vc', 'Major General Md Mahbub-ul Alam', 'Vice Chancellor', "VC's Office", 'vc.office@bup.edu.bd', null, null, null),
  person('AUTH-34', 'staff-provc', 'Md. Rokonuzzaman', 'Assistant Director', "Pro-VC's Office", 'provc.office@bup.edu.bd', null, null, null),
  person('AUTH-35', 'staff-treasurer', 'Air Commodore Md Reza Emdad Khan', 'Treasurer', 'Office of the Treasurer', 'treasurer@bup.edu.bd', null, null, null),
  person('AUTH-36', 'staff-registrar', 'Brigadier General Md Rabbi Ahsan', 'Registrar', 'Office of the Registrar', 'registrar@bup.edu.bd', null, null, null),
];

export const ALL_AUTHORITIES = [...SECTION_AUTHORITIES, ...TOP_AUTHORITIES];

export const CATEGORY_ROUTES = {
  'cat-elec': { staffId: 'staff-engineer', top: 'vc' },
  'cat-ac': { staffId: 'staff-engineer', top: 'vc' },
  'cat-lift': { staffId: 'staff-engineer', top: 'vc' },
  'cat-water': { staffId: 'staff-engineer', top: 'vc' },
  'cat-civil': { staffId: 'staff-engineer', top: 'vc' },
  'cat-canteen': { staffId: 'staff-engineer', top: 'vc' },
  'cat-classroom': { staffId: 'staff-academic', top: 'registrar' },
  'cat-office': { staffId: 'staff-establishment', top: 'registrar' },
  'cat-sports': { staffId: 'staff-sports-centre', top: 'vc' },
  'cat-ict': { staffId: 'staff-ict-chief', top: 'vc' },
  'cat-medical': { staffId: 'staff-medical', top: 'vc' },
  'cat-library': { staffId: 'staff-library', top: 'registrar' },
  'cat-harassment': { staffId: 'staff-proctor', top: 'vc' },
  'cat-drug': { staffId: 'staff-proctor', top: 'vc' },
  'cat-bullying': { staffId: 'staff-security-chief', top: 'vc' },
  'cat-racism': { staffId: 'staff-security-chief', top: 'vc' },
  'cat-violation': { staffId: 'staff-proctor', top: 'vc' },
  'cat-ragging': { staffId: 'staff-proctor', top: 'vc' },
  'cat-other': { staffId: 'staff-establishment', top: 'registrar' },
};

for (const office of SECTION_AUTHORITIES) {
  CATEGORY_ROUTES[office.categoryId] = { staffId: office.id, top: office.top };
}

export function escalationTarget(categoryId, level, currentStaffId) {
  const route = CATEGORY_ROUTES[categoryId] || { staffId: 'staff-registrar', top: 'registrar' };
  const topId = TOP_IDS[route.top] || TOP_IDS.vc;
  if (level >= 2) return null;
  if (level <= 0 && route.staffId && route.staffId !== currentStaffId) {
    return { staffId: route.staffId, level: 1 };
  }
  if (topId === currentStaffId) return null;
  return { staffId: topId, level: 2 };
}

export async function ensureCanteenOfficer(pool) {
  await pool.query(
    `INSERT IGNORE INTO DEPARTMENT (Department_ID_PK, Department_Name, Contact_Info, Head_Name, Email)
     VALUES ('dept-canteen', 'Canteen and Food Services', '+880 1700-110505', 'Abul Hannan', 'canteen.food@bup.edu.bd')`
  );
  await pool.query(
    `UPDATE DEPARTMENT SET Head_Name = 'Abul Hannan' WHERE Department_ID_PK = 'dept-canteen'`
  );
  await pool.query(
    `INSERT IGNORE INTO MAINTENANCE_STAFF
      (Staff_ID_PK, Name, Email, Phone, Department_ID_FK, Specialization, Active_Tasks)
     VALUES ('staff-canteen', 'Abul Hannan', 'canteen.food@bup.edu.bd', '+880 1700-110505', 'dept-canteen', 'Canteen and food complaints', 0)`
  );
  await pool.query(
    `UPDATE MAINTENANCE_STAFF SET Name = 'Abul Hannan' WHERE Staff_ID_PK = 'staff-canteen'`
  );
  await pool.query(
    `INSERT IGNORE INTO USER
      (User_ID_PK, Name, Email, Phone, Password, User_Type, Role_ID_FK, Student_Or_Employee_ID, Department_Name, Is_Flagged_Spammer)
     VALUES ('user-canteen', 'Abul Hannan', 'canteen.food@bup.edu.bd', '+880 1700-110505', '123456', 'staff', 'ROLE-MNT', 'STF-CAN-505', 'Canteen and Food Services', FALSE)`
  );
  await pool.query(
    `UPDATE USER SET Name = 'Abul Hannan' WHERE User_ID_PK = 'user-canteen'`
  );
}

export async function ensureAuthorityRecords(pool) {
  for (const office of ALL_AUTHORITIES) {
    await pool.query(
      `INSERT IGNORE INTO DEPARTMENT (Department_ID_PK, Department_Name, Contact_Info, Head_Name, Email)
       VALUES (?, ?, ?, ?, ?)`,
      [`dept-${office.id}`, office.office, office.phone, office.name, office.email]
    );
    await pool.query(
      `INSERT IGNORE INTO MAINTENANCE_STAFF
        (Staff_ID_PK, Name, Email, Phone, Department_ID_FK, Specialization, Active_Tasks)
       VALUES (?, ?, ?, ?, ?, ?, 0)`,
      [office.id, office.name, office.email, office.phone, `dept-${office.id}`, `${office.title}, ${office.office}`]
    );
    await pool.query(
      `INSERT IGNORE INTO USER
        (User_ID_PK, Name, Email, Phone, Password, User_Type, Role_ID_FK, Student_Or_Employee_ID, Department_Name, Is_Flagged_Spammer)
       VALUES (?, ?, ?, ?, '123456', 'staff', 'ROLE-MNT', ?, ?, FALSE)`,
      [office.userId, office.name, office.email, office.phone, office.employeeId, office.office]
    );
    if (office.categoryId) {
      await pool.query(
        `INSERT IGNORE INTO COMPLAINT_CATEGORY (Category_ID_PK, Category_Name, Description)
         VALUES (?, ?, ?)`,
        [office.categoryId, office.categoryName, `${office.office}. Handled by ${office.name}, ${office.title}.`]
      );
    }
  }
  await pool.query("UPDATE COMPLAINT_CATEGORY SET Category_Name = 'Others' WHERE Category_ID_PK = 'cat-other'");
}

const RETIRED_LOCATIONS = [
  'loc-acad-1', 'loc-acad-2', 'loc-fbs-1', 'loc-admin-1', 'loc-fst-1', 'loc-fst-2', 'loc-fass-1',
  'loc-med-1', 'loc-gym-1', 'loc-canteen-1', 'loc-utility-1', 'loc-computer-lab',
  'loc-microwave-lab', 'loc-communication-lab', 'loc-electrical-lab', 'loc-physics-lab',
];

export async function normalizeCampusLocations(pool) {
  const [used] = await pool.query('SELECT DISTINCT Location_ID_FK AS id FROM COMPLAINT');
  const usedIds = new Set(used.map((row) => row.id));
  const removable = RETIRED_LOCATIONS.filter((id) => !usedIds.has(id));
  if (removable.length) {
    await pool.query(
      `DELETE FROM LOCATION WHERE Location_ID_PK IN (${removable.map(() => '?').join(',')})`,
      removable
    );
  }
  const places = [
    ['loc-academic', 'Academic Building', 'Central'],
    ['loc-shadhinota', 'Shadhinota Auditorium', 'Central'],
    ['loc-bijoy', 'Bijoy Auditorium', 'Central'],
    ['loc-utility-building', 'Utility Building', 'South'],
  ];
  for (const [id, name, zone] of places) {
    await pool.query(
      `INSERT IGNORE INTO LOCATION (Location_ID_PK, Building_Name, Floor, Room_Area, Campus_Zone)
       VALUES (?, ?, 'Campus', ?, ?)`,
      [id, name, name, zone]
    );
  }
}
