// ============================================================
//  AAS Tool — GUI Control Panel
//  Start/stop all services from a browser dashboard
//  DB setup, seeding, and live logs included
// ============================================================

const express = require('express');
const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const PORT = process.env.CONTROL_PORT || 4040;
const PROJECT_ROOT = path.resolve(__dirname, '..');
const IS_WINDOWS = os.platform() === 'win32';
const LOG_DIR = IS_WINDOWS
  ? path.join(os.tmpdir(), 'aastool-logs')
  : '/tmp/aastool-logs';

// Ensure log directory exists
try { fs.mkdirSync(LOG_DIR, { recursive: true }); } catch {}

const app = express();
app.use(express.json());

// Track running processes
const processes = {
  backend: null,
  frontend: null
};

// ── Helpers ──────────────────────────────────────────

function isPortOpen(port) {
  try {
    if (IS_WINDOWS) {
      const out = execSync(`netstat -ano | findstr ":${port}.*LISTENING"`, { encoding: 'utf8', timeout: 3000 }).trim();
      return !!out;
    }
    // Linux/WSL: try lsof first, then ss, then netstat
    try {
      const out = execSync(`lsof -ti :${port} 2>/dev/null | head -1`, { encoding: 'utf8', timeout: 3000 }).trim();
      if (out) return true;
    } catch {}
    try {
      const out = execSync(`ss -tlnp 2>/dev/null | grep -q ':${port} ' && echo open || echo ''`, { encoding: 'utf8', timeout: 3000 }).trim();
      if (out === 'open') return true;
    } catch {}
    try {
      const out = execSync(`netstat -tlnp 2>/dev/null | grep -q ':${port} ' && echo open || echo ''`, { encoding: 'utf8', timeout: 3000 }).trim();
      if (out === 'open') return true;
    } catch {}
    return false;
  } catch {
    return false;
  }
}

function getPidsOnPort(port) {
  // Returns array of PIDs listening on the given port
  try {
    if (IS_WINDOWS) {
      const out = execSync(`netstat -ano | findstr ":${port}.*LISTENING"`, { encoding: 'utf8', timeout: 3000 });
      const pids = [];
      out.split('\n').forEach(line => {
        const m = line.trim().match(/(\d+)\s*$/);
        if (m) pids.push(parseInt(m[1]));
      });
      return [...new Set(pids)];
    }
    // Try fuser (most reliable across WSL)
    try {
      const out = execSync(`fuser ${port}/tcp 2>/dev/null`, { encoding: 'utf8', timeout: 3000 }).trim();
      if (out) return out.split(/\s+/).map(s => parseInt(s)).filter(n => !isNaN(n));
    } catch {}
    // Try lsof
    try {
      const out = execSync(`lsof -ti :${port} 2>/dev/null`, { encoding: 'utf8', timeout: 3000 }).trim();
      if (out) return out.split('\n').map(s => parseInt(s)).filter(n => !isNaN(n));
    } catch {}
    // Try ss
    try {
      const out = execSync(`ss -tlnp 'sport = :${port}' 2>/dev/null`, { encoding: 'utf8', timeout: 3000 });
      const pids = [];
      out.split('\n').forEach(line => {
        const m = line.match(/pid=(\d+)/);
        if (m) pids.push(parseInt(m[1]));
      });
      if (pids.length) return [...new Set(pids)];
    } catch {}
    return [];
  } catch {
    return [];
  }
}

function killPort(port) {
  const pids = getPidsOnPort(port);
  if (IS_WINDOWS) {
    // On Windows, use taskkill
    pids.forEach(pid => {
      try { execSync(`taskkill /f /pid ${pid} >nul 2>&1`, { stdio: 'ignore', timeout: 5000 }); } catch {}
    });
    return;
  }
  // Linux/WSL: kill each PID
  pids.forEach(pid => {
    try { process.kill(pid, 'SIGTERM'); } catch {}
    // Wait a bit then force kill
    try {
      const check = require('child_process').execSync(`kill -0 ${pid} 2>/dev/null && echo alive || echo dead`, { encoding: 'utf8', timeout: 2000 }).trim();
      if (check === 'alive') {
        try { process.kill(pid, 'SIGKILL'); } catch {}
      }
    } catch {}
  });
  // Also try fuser -k as last resort
  try {
    execSync(`fuser -k ${port}/tcp 2>/dev/null`, { stdio: 'ignore', timeout: 5000 });
  } catch {}
}

function getDockerStatus() {
  try {
    const out = execSync('docker ps --format "{{.Names}}" 2>/dev/null', { encoding: 'utf8', timeout: 3000 });
    const containers = out.trim().split('\n').filter(Boolean);
    return {
      available: true,
      running: containers.some(c => c === 'mariadb' || c === 'aastool-db'),
      containers
    };
  } catch {
    const available = (() => { try { execSync('docker --version', { stdio: 'ignore', timeout: 3000 }); return true; } catch { return false; } })();
    return { available, running: false, containers: [] };
  }
}

function getDbStatus() {
  return isPortOpen(3306);
}

function getLogPath(service) {
  return path.join(LOG_DIR, `${service}.log`);
}

function appendLog(service, data) {
  try {
    fs.appendFileSync(getLogPath(service), data, 'utf8');
  } catch {}
}

function getRecentLogs(service, lines = 200) {
  const logPath = getLogPath(service);
  if (!fs.existsSync(logPath)) return '';
  try {
    const content = fs.readFileSync(logPath, 'utf8');
    const allLines = content.split('\n');
    return allLines.slice(-lines).join('\n');
  } catch {
    return '';
  }
}

function getFullLogPath(service) {
  return getLogPath(service);
}

// Clear logs on startup
['backend', 'frontend', 'db'].forEach(s => {
  try { fs.writeFileSync(getLogPath(s), ''); } catch {}
});

// ── API Routes ───────────────────────────────────────

app.get('/api/status', (_req, res) => {
  const backendUp = isPortOpen(4000);
  const frontendUp = isPortOpen(3000);
  const dbUp = getDbStatus();
  const docker = getDockerStatus();

  const envFile = path.join(PROJECT_ROOT, 'backend', '.env');
  let dbUrl = null;
  if (fs.existsSync(envFile)) {
    const content = fs.readFileSync(envFile, 'utf8');
    const m = content.match(/DATABASE_URL=["']?(\S+?)["']?\s*$/m);
    if (m) dbUrl = m[1].replace(/^["']|["']$/g, '');
  }

  res.json({
    timestamp: new Date().toISOString(),
    hostname: os.hostname(),
    platform: os.platform(),
    services: {
      database: {
        port: 3306,
        running: dbUp,
        type: docker.running ? 'docker' : 'local',
        dockerAvailable: docker.available,
        dockerRunning: docker.running,
        url: dbUrl || 'mysql://myuser:mypassword@127.0.0.1:3306/mydb'
      },
      backend: {
        port: 4000,
        running: backendUp,
        url: backendUp ? 'http://localhost:4000' : null,
        pid: processes.backend?.pid || null
      },
      frontend: {
        port: 3000,
        running: frontendUp,
        url: frontendUp ? 'http://localhost:3000' : null,
        pid: processes.frontend?.pid || null
      }
    }
  });
});

// ── DB Endpoints ─────────────────────────────────────

app.get('/api/db/download-urls', (_req, res) => {
  res.json({
    ok: true,
    mariadb: {
      windows: 'https://mariadb.org/download/?t=mariadb&p=mariadb&r=11.4.4&os=windows&cpu=x86_64&pkg=msi',
      mac: 'https://mariadb.org/download/?t=mariadb&p=mariadb&r=11.4.4&os=macOS&cpu=x86_64',
      linux: 'https://mariadb.org/download/?t=mariadb&p=mariadb&r=11.4.4'
    },
    mysql: {
      windows: 'https://dev.mysql.com/downloads/installer/',
      mac: 'https://dev.mysql.com/downloads/mysql/',
      linux: 'https://dev.mysql.com/downloads/mysql/'
    },
    docker: 'https://www.docker.com/products/docker-desktop/',
    message: 'Install MariaDB/MySQL and ensure port 3306 is accessible, or use Docker.'
  });
});

app.post('/api/db/install-docker', (_req, res) => {
  const docker = getDockerStatus();
  if (!docker.available) {
    return res.json({ ok: false, error: 'Docker not available. Install Docker Desktop first.', dockerUrl: 'https://www.docker.com/products/docker-desktop/' });
  }

  // Check if already running
  if (docker.running) {
    return res.json({ ok: true, message: 'MariaDB Docker container is already running' });
  }

  // Pull & run mariadb
  try {
    appendLog('db', `[${new Date().toISOString()}] Starting MariaDB Docker container...\n`);
    execSync('docker pull mariadb:10.11', { stdio: 'pipe', timeout: 120000 });
    appendLog('db', `[${new Date().toISOString()}] Image pulled. Starting container...\n`);

    // Stop existing if any
    try { execSync('docker rm -f aastool-db 2>/dev/null', { stdio: 'ignore' }); } catch {}

    execSync(
      `docker run -d --name aastool-db ` +
      `-e MYSQL_ROOT_PASSWORD=rootpassword ` +
      `-e MYSQL_DATABASE=mydb ` +
      `-e MYSQL_USER=myuser ` +
      `-e MYSQL_PASSWORD=mypassword ` +
      `-p 3306:3306 mariadb:10.11`,
      { stdio: 'pipe', timeout: 30000 }
    );
    appendLog('db', `[${new Date().toISOString()}] Container started. Waiting for MySQL to be ready...\n`);

    // Wait for port
    let ready = false;
    for (let i = 0; i < 30; i++) {
      if (isPortOpen(3306)) { ready = true; break; }
      const wait = new Promise(r => setTimeout(r, 1000));
      execSync('sleep 1', { stdio: 'ignore' }); // Actually let's do a simple loop
    }

    appendLog('db', `[${new Date().toISOString()}] MariaDB ${ready ? 'is ready' : 'may still be starting'} on port 3306\n`);
    return res.json({ ok: true, message: ready ? 'MariaDB Docker container running on port 3306' : 'Container started, DB may take a moment to be ready' });
  } catch (e) {
    appendLog('db', `[${new Date().toISOString()}] ERROR: ${e.stderr || e.message}\n`);
    return res.json({ ok: false, error: 'Failed to start Docker container: ' + (e.stderr || e.message) });
  }
});

app.post('/api/db/setup', (_req, res) => {
  // Run setup-db.sh (Linux/WSL) or setup-db.bat (Windows)
  const script = IS_WINDOWS ? 'setup-db.bat' : 'setup-db.sh';
  const scriptPath = path.join(PROJECT_ROOT, 'scripts', script);

  if (!fs.existsSync(scriptPath)) {
    return res.json({ ok: false, error: `Setup script not found: ${script}. Run it manually from the project root.` });
  }

  appendLog('db', `[${new Date().toISOString()}] Running ${script}...\n`);
  appendLog('db', `[${new Date().toISOString()}] This will prompt for MySQL credentials in the terminal where control-panel is running.\n`);

  try {
    appendLog('db', `[${new Date().toISOString()}] ${script} started (interactive — switch to the control-panel terminal to provide input)\n`);
    const child = spawn(IS_WINDOWS ? 'cmd.exe' : 'bash', IS_WINDOWS ? ['/c', path.join('scripts', script)] : [scriptPath], {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',  // inherit stdin so user can type credentials when prompted
      shell: false
    });

    child.on('close', code => {
      appendLog('db', `[${new Date().toISOString()}] ${script} exited with code ${code}\n`);
    });

    return res.json({
      ok: true,
      message: `${script} started. Check the terminal where control-panel is running for prompts (MySQL root password, etc.).`,
      note: 'This is a CLI script — it requires interactive input in the terminal. Watch the control-panel terminal window.'
    });
  } catch (e) {
    return res.json({ ok: false, error: 'Failed to start setup script: ' + e.message });
  }
});

app.post('/api/db/seed', (_req, res) => {
  const backendDir = path.join(PROJECT_ROOT, 'backend');

  if (!fs.existsSync(path.join(backendDir, 'dist', 'scripts', 'seed.js'))) {
    try {
      execSync('npm run build', { cwd: backendDir, stdio: 'pipe', timeout: 30000 });
    } catch (e) {
      return res.json({ ok: false, error: 'Build failed. Run: cd backend && npm run build' });
    }
  }

  try {
    const env = { ...process.env };
    const envFile = path.join(backendDir, '.env');
    if (fs.existsSync(envFile)) {
      fs.readFileSync(envFile, 'utf8').split('\n').forEach(line => {
        const m = line.match(/^([A-Z_]+)=["']?([^"'\r\n]*)["']?/);
        if (m) env[m[1]] = m[2];
      });
    }
    env.DATABASE_URL = env.DATABASE_URL || 'mysql://myuser:mypassword@127.0.0.1:3306/mydb';

    appendLog('db', `[${new Date().toISOString()}] Seeding database...\n`);
    const out = execSync('node dist/scripts/seed.js', {
      cwd: backendDir,
      env,
      encoding: 'utf8',
      timeout: 30000
    });
    appendLog('db', out);
    appendLog('db', `[${new Date().toISOString()}] Seed completed\n`);

    return res.json({ ok: true, message: 'Database seeded successfully', output: out.slice(-500) });
  } catch (e) {
    const errMsg = e.stderr || e.stdout || e.message;
    appendLog('db', `[${new Date().toISOString()}] Seed ERROR: ${errMsg}\n`);
    return res.json({ ok: false, error: 'Seed failed: ' + errMsg.slice(-300) });
  }
});

// ── Logs Endpoints ───────────────────────────────────

app.get('/api/logs/:service', (req, res) => {
  const { service } = req.params;
  const valid = ['backend', 'frontend', 'db'];
  if (!valid.includes(service)) {
    return res.json({ ok: false, error: `Invalid service. Choose: ${valid.join(', ')}` });
  }
  const lines = parseInt(req.query.lines) || 200;
  res.json({
    ok: true,
    service,
    path: getFullLogPath(service),
    logs: getRecentLogs(service, lines)
  });
});

app.get('/api/logs/:service/stream', (req, res) => {
  const { service } = req.params;
  const valid = ['backend', 'frontend', 'db'];
  if (!valid.includes(service)) {
    return res.status(400).json({ ok: false, error: `Invalid service. Choose: ${valid.join(', ')}` });
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  const logPath = getLogPath(service);
  let lastSize = fs.existsSync(logPath) ? fs.statSync(logPath).size : 0;

  // Send current content first
  if (fs.existsSync(logPath)) {
    const current = fs.readFileSync(logPath, 'utf8');
    res.write(`data: ${JSON.stringify({ type: 'init', content: current })}\n\n`);
  }

  // Poll for changes every 1s
  const interval = setInterval(() => {
    try {
      if (!fs.existsSync(logPath)) return;
      const stat = fs.statSync(logPath);
      if (stat.size > lastSize) {
        const stream = fs.createReadStream(logPath, { start: lastSize, end: stat.size - 1, encoding: 'utf8' });
        let chunk = '';
        stream.on('data', d => chunk += d);
        stream.on('end', () => {
          res.write(`data: ${JSON.stringify({ type: 'append', content: chunk })}\n\n`);
        });
        lastSize = stat.size;
      }
    } catch {}
  }, 1000);

  req.on('close', () => {
    clearInterval(interval);
  });
});

// ── Start/Stop Endpoints ─────────────────────────────

app.post('/api/start/backend', (_req, res) => {
  if (isPortOpen(4000)) {
    return res.json({ ok: true, message: 'Backend already running' });
  }

  const backendDir = path.join(PROJECT_ROOT, 'backend');
  if (!fs.existsSync(path.join(backendDir, 'dist', 'index.js'))) {
    try {
      appendLog('backend', `[${new Date().toISOString()}] Building backend...\n`);
      execSync('npm run build', { cwd: backendDir, stdio: 'pipe', timeout: 30000 });
      appendLog('backend', `[${new Date().toISOString()}] Build complete\n`);
    } catch (e) {
      appendLog('backend', `[${new Date().toISOString()}] Build FAILED: ${e.stderr || e.message}\n`);
      return res.json({ ok: false, error: 'Build failed: ' + (e.stderr || e.message) });
    }
  }

  const env = { ...process.env };
  const envFile = path.join(backendDir, '.env');
  if (fs.existsSync(envFile)) {
    const content = fs.readFileSync(envFile, 'utf8');
    content.split('\n').forEach(line => {
      const m = line.match(/^([A-Z_]+)=["']?([^"'\r\n]*)["']?/);
      if (m) env[m[1]] = m[2];
    });
  }
  env.PORT = '4000';
  env.DATABASE_URL = env.DATABASE_URL || 'mysql://myuser:mypassword@127.0.0.1:3306/mydb';
  env.DB_TYPE = env.DB_TYPE || 'mariadb';

  const child = spawn('node', ['dist/index.js'], {
    cwd: backendDir,
    env,
    stdio: 'pipe',
    detached: true
  });

  child.stdout.on('data', d => {
    const text = d.toString();
    process.stdout.write(`[backend] ${text}`);
    appendLog('backend', text);
  });
  child.stderr.on('data', d => {
    const text = d.toString();
    process.stderr.write(`[backend] ${text}`);
    appendLog('backend', text);
  });
  child.on('error', err => {
    appendLog('backend', `[ERROR] ${err.message}\n`);
  });
  child.on('exit', code => {
    appendLog('backend', `[${new Date().toISOString()}] Process exited with code ${code}\n`);
  });
  child.unref();

  processes.backend = child;
  appendLog('backend', `[${new Date().toISOString()}] Backend starting (PID ${child.pid})...\n`);
  res.json({ ok: true, message: 'Backend starting...', pid: child.pid });
});

app.post('/api/stop/backend', (_req, res) => {
  let killed = false;

  if (processes.backend && processes.backend.pid) {
    try { process.kill(-processes.backend.pid); } catch {}
    try { processes.backend.kill('SIGTERM'); } catch {}
    processes.backend = null;
    killed = true;
  }

  // Use the robust killPort helper that works in WSL
  killPort(4000);
  killed = true;

  appendLog('backend', `[${new Date().toISOString()}] Backend stopped\n`);
  res.json({ ok: true, message: killed ? 'Backend stopped' : 'Backend was not running' });
});

app.post('/api/start/frontend', (_req, res) => {
  if (isPortOpen(3000)) {
    return res.json({ ok: true, message: 'Frontend already running' });
  }

  const frontendDir = path.join(PROJECT_ROOT, 'frontend');
  if (!fs.existsSync(path.join(frontendDir, 'node_modules'))) {
    try {
      appendLog('frontend', `[${new Date().toISOString()}] Installing frontend dependencies...\n`);
      execSync('npm install --silent', { cwd: frontendDir, stdio: 'pipe', timeout: 120000 });
      appendLog('frontend', `[${new Date().toISOString()}] Install complete\n`);
    } catch (e) {
      appendLog('frontend', `[${new Date().toISOString()}] npm install FAILED\n`);
      return res.json({ ok: false, error: 'npm install failed' });
    }
  }

  const env = { ...process.env, PORT: '3000' };
  const child = spawn('npm', ['run', 'dev'], {
    cwd: frontendDir,
    env,
    stdio: 'pipe',
    detached: true,
    shell: true
  });

  child.stdout.on('data', d => {
    const text = d.toString();
    process.stdout.write(`[frontend] ${text}`);
    appendLog('frontend', text);
  });
  child.stderr.on('data', d => {
    const text = d.toString();
    process.stderr.write(`[frontend] ${text}`);
    appendLog('frontend', text);
  });
  child.on('error', err => {
    appendLog('frontend', `[ERROR] ${err.message}\n`);
  });
  child.on('exit', code => {
    appendLog('frontend', `[${new Date().toISOString()}] Process exited with code ${code}\n`);
  });
  child.unref();

  processes.frontend = child;
  appendLog('frontend', `[${new Date().toISOString()}] Frontend starting (PID ${child.pid})...\n`);
  res.json({ ok: true, message: 'Frontend starting...', pid: child.pid });
});

app.post('/api/stop/frontend', (_req, res) => {
  let killed = false;

  if (processes.frontend && processes.frontend.pid) {
    try { process.kill(-processes.frontend.pid); } catch {}
    try { processes.frontend.kill('SIGTERM'); } catch {}
    processes.frontend = null;
    killed = true;
  }

  // Use the robust killPort helper that works in WSL
  killPort(3000);
  killed = true;

  appendLog('frontend', `[${new Date().toISOString()}] Frontend stopped\n`);
  res.json({ ok: true, message: killed ? 'Frontend stopped' : 'Frontend was not running' });
});

app.post('/api/start/all', async (_req, res) => {
  const results = {};

  // Backend
  if (!isPortOpen(4000)) {
    await new Promise(resolve => {
      const backendDir = path.join(PROJECT_ROOT, 'backend');
      if (!fs.existsSync(path.join(backendDir, 'dist', 'index.js'))) {
        try { execSync('npm run build', { cwd: backendDir, stdio: 'pipe', timeout: 30000 }); } catch {}
      }
      const env = { ...process.env, PORT: '4000' };
      env.DATABASE_URL = env.DATABASE_URL || 'mysql://myuser:mypassword@127.0.0.1:3306/mydb';
      env.DB_TYPE = env.DB_TYPE || 'mariadb';

      const envFile = path.join(backendDir, '.env');
      if (fs.existsSync(envFile)) {
        fs.readFileSync(envFile, 'utf8').split('\n').forEach(line => {
          const m = line.match(/^([A-Z_]+)=["']?([^"'\r\n]*)["']?/);
          if (m) env[m[1]] = m[2];
        });
      }

      const child = spawn('node', ['dist/index.js'], { cwd: backendDir, env, stdio: 'pipe', detached: true });
      child.stdout.on('data', d => appendLog('backend', d.toString()));
      child.stderr.on('data', d => appendLog('backend', d.toString()));
      child.unref();
      processes.backend = child;
      results.backend = 'starting';

      let attempts = 0;
      const iv = setInterval(() => {
        attempts++;
        if (isPortOpen(4000) || attempts > 30) {
          clearInterval(iv);
          results.backend = isPortOpen(4000) ? 'running' : 'timeout';
          resolve();
        }
      }, 1000);
    });
  } else {
    results.backend = 'already-running';
  }

  // Frontend
  if (!isPortOpen(3000)) {
    const frontendDir = path.join(PROJECT_ROOT, 'frontend');
    if (!fs.existsSync(path.join(frontendDir, 'node_modules'))) {
      try { execSync('npm install --silent', { cwd: frontendDir, stdio: 'pipe', timeout: 120000 }); } catch {}
    }
    const child = spawn('npm', ['run', 'dev'], { cwd: frontendDir, env: { ...process.env, PORT: '3000' }, stdio: 'pipe', detached: true, shell: true });
    child.stdout.on('data', d => appendLog('frontend', d.toString()));
    child.stderr.on('data', d => appendLog('frontend', d.toString()));
    child.unref();
    processes.frontend = child;
    results.frontend = 'starting';
  } else {
    results.frontend = 'already-running';
  }

  res.json({ ok: true, results });
});

app.post('/api/stop/all', (_req, res) => {
  killPort(4000);
  killPort(3000);

  appendLog('backend', `[${new Date().toISOString()}] Stopped (stop all)\n`);
  appendLog('frontend', `[${new Date().toISOString()}] Stopped (stop all)\n`);
  processes.backend = null;
  processes.frontend = null;
  res.json({ ok: true, message: 'All services stopped' });
});

// ── Serve Dashboard ──────────────────────────────────

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// ── Start Server ─────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n╔══════════════════════════════════════════════════╗`);
  console.log(`║  AAS Control Panel                               ║`);
  console.log(`║  Open: http://localhost:${PORT}                       ║`);
  console.log(`╚══════════════════════════════════════════════════╝\n`);
  console.log(`  Project root: ${PROJECT_ROOT}`);
  console.log(`  Platform:     ${os.platform()}`);
  console.log(`  Hostname:     ${os.hostname()}`);
  console.log(`  Logs:         ${LOG_DIR}\n`);
});
