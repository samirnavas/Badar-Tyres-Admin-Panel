const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const DATA_DIR = path.join(__dirname, 'data');
const JOBS_FILE = path.join(DATA_DIR, 'jobs.json');
const MANUFACTURERS_FILE = path.join(DATA_DIR, 'manufacturers.json');
const SERVICES_FILE = path.join(DATA_DIR, 'services.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const GST_RATE = 0.18;

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

// In-memory "database", seeded from the JSON files. Writes are persisted back
// to jobs.json so created records survive restarts (like a real DB).
let jobs = readJson(JOBS_FILE);
const manufacturers = readJson(MANUFACTURERS_FILE);
const serviceCatalog = readJson(SERVICES_FILE);
let users = readJson(USERS_FILE);

const persistUsers = () => {
  fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), (err) => {
    if (err) console.error('Failed to persist users:', err.message);
  });
};
const persistJobs = () => {
  fs.writeFile(JOBS_FILE, JSON.stringify(jobs, null, 2), (err) => {
    if (err) console.error('Failed to persist jobs:', err.message);
  });
};

const countByStatus = (status) =>
  jobs.filter((j) => j.status === status).length;

const round2 = (n) => Math.round(n * 100) / 100;

// Simulate real network/database latency.
app.use((req, _res, next) => setTimeout(next, 250));

// --- Login -----------------------------------------------------------------
app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  const user = users.find(
    (u) => u.username.toLowerCase() === String(username || '').toLowerCase()
  );
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }
  res.json({
    token: `mock-token-${user.id}-${Date.now()}`,
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
    },
  });
});

// --- Users -----------------------------------------------------------------
app.get('/api/users', (_req, res) => {
  // Omit passwords for security
  const safeUsers = users.map(({ password, ...u }) => u);
  res.json(safeUsers);
});

app.patch('/api/users/:id', (req, res) => {
  const { role } = req.body || {};
  if (!role) return res.status(400).json({ error: 'role is required' });

  const user = users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  user.role = role;
  persistUsers();
  
  const { password, ...safeUser } = user;
  res.json(safeUser);
});

app.delete('/api/users/:id', (req, res) => {
  const index = users.findIndex((u) => u.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'User not found' });
  
  const deletedUser = users.splice(index, 1)[0];
  persistUsers();
  
  const { password, ...safeUser } = deletedUser;
  res.json(safeUser);
});

// --- Dashboard metrics -----------------------------------------------------
app.get('/api/metrics', (_req, res) => {
  res.json({
    totalJobs: jobs.length,
    running: countByStatus('running'),
    completed: countByStatus('completed'),
    delayed: countByStatus('delayed'),
    pending: countByStatus('pending'),
  });
});

// --- List jobs (filter by status + free-text search) -----------------------
app.get('/api/jobs', (req, res) => {
  const { status, search } = req.query;
  let result = [...jobs];

  if (status && status !== 'all') {
    result = result.filter((j) => j.status === status);
  }

  if (search) {
    const q = String(search).toLowerCase();
    result = result.filter((j) =>
      [j.customerName, j.mobile, j.vehicleNumber]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }

  res.json(result);
});

// --- Single job ------------------------------------------------------------
app.get('/api/jobs/:id', (req, res) => {
  const job = jobs.find((j) => j.id === req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});

// --- Delete a job ----------------------------------------------------------
app.delete('/api/jobs/:id', (req, res) => {
  const index = jobs.findIndex((j) => j.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Job not found' });
  const deletedJob = jobs.splice(index, 1)[0];
  persistJobs();
  res.json(deletedJob);
});

// --- Technicians (derived from users with the "technician" role) -----------
app.get('/api/technicians', (_req, res) => {
  const names = users
    .filter((u) => u.role === 'technician')
    .map((u) => u.name);
  res.json(names);
});

// --- Vehicle manufacturers -------------------------------------------------
app.get('/api/manufacturers', (_req, res) => {
  res.json(manufacturers);
});

// --- Service catalog -------------------------------------------------------
app.get('/api/services', (_req, res) => {
  res.json(serviceCatalog);
});

// --- Create a job ----------------------------------------------------------
app.post('/api/jobs', (req, res) => {
  const body = req.body || {};

  if (!body.customerName || String(body.customerName).trim() === '') {
    return res.status(400).json({ error: 'customerName is required' });
  }

  const services = Array.isArray(body.services) ? body.services : [];
  const subTotal = round2(
    services.reduce((sum, s) => sum + (Number(s.amount) || 0), 0)
  );
  const gst = round2(subTotal * GST_RATE);
  const grandTotal = round2(subTotal + gst);

  const now = new Date();
  const seq = String(jobs.length + 1).padStart(3, '0');
  const id = `JC-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate()
  ).padStart(2, '0')}-${seq}`;

  const job = {
    id,
    jobNumber: id,
    customerName: body.customerName,
    mobile: body.mobile || body.contact || '',
    vehicleModel: body.vehicleModel || body.model || '',
    vehicleNumber: body.vehicleNumber || body.vehicleReg || '',
    vehicleType: body.vehicleType || 'Car',
    wheelType: body.wheelType || null,
    tyreType: body.tyreType || null,
    wheelSize: body.wheelSize || null,
    status: body.status || 'running',
    time: body.startingTime || now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    date: now
      .toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
      .toUpperCase(),
    technician: body.technician || 'Unassigned',
    startTime: body.startingTime || '-',
    expectedEnd: body.expectedEnd || '-',
    actualEnd: null,
    delay: null,
    remarks: body.remarks || '',
    services,
    subTotal,
    gst,
    grandTotal,
  };

  jobs = [job, ...jobs];
  persistJobs();
  res.status(201).json(job);
});

// --- Vehicles --------------------------------------------------------------
app.get('/api/vehicles', (_req, res) => {
  const vehicleMap = new Map();
  for (const j of jobs) {
    if (!j.vehicleNumber) continue;
    // Since jobs are added newest first, the first time we see a vehicleNumber
    // it contains the most recent details.
    if (!vehicleMap.has(j.vehicleNumber)) {
      vehicleMap.set(j.vehicleNumber, {
        vehicleNumber: j.vehicleNumber,
        vehicleModel: j.vehicleModel,
        vehicleType: j.vehicleType || 'Car',
        customerName: j.customerName,
        mobile: j.mobile,
        lastJobDate: j.date,
        lastJobId: j.id,
      });
    }
  }
  res.json(Array.from(vehicleMap.values()));
});

// --- Health check ----------------------------------------------------------
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Badar Tyres mock API running at http://localhost:${PORT}`);
  console.log('Endpoints:');
  console.log('  POST /api/login');
  console.log('  GET  /api/metrics');
  console.log('  GET  /api/jobs?status=&search=');
  console.log('  GET  /api/jobs/:id');
  console.log('  DELETE /api/jobs/:id');
  console.log('  GET  /api/technicians');
  console.log('  GET  /api/manufacturers');
  console.log('  GET  /api/services');
  console.log('  POST /api/jobs');
  console.log('  GET  /api/users');
  console.log('  PATCH /api/users/:id');
  console.log('  DELETE /api/users/:id');
});
