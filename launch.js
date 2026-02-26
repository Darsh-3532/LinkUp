const { spawn, exec } = require('child_process');
const http = require('http');
const open = require('open');
const path = require('path');

const PORT = 5000;
const URL = `http://localhost:${PORT}/pages/network_explorer.html`;

console.log('\n' + '='.repeat(60));
console.log('         LinkUp - Network Explorer Launcher');
console.log('='.repeat(60) + '\n');

// Check if server is already running
function isServerRunning() {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${PORT}/api/health`, (res) => {
      resolve(res.statusCode === 200);
      res.resume();
    });
    req.on('error', () => resolve(false));
  });
}

// Kill existing server
function killExistingServer() {
  return new Promise((resolve) => {
    const platform = process.platform;
    if (platform === 'win32') {
      exec('taskkill /F /IM node.exe /FI "WINDOWTITLE eq LinkUp*" 2>nul || taskkill /F /PID $(netstat -ano | findstr :5000 | awk "{print $5}") 2>nul', () => {
        setTimeout(resolve, 1000);
      });
    } else {
      exec('lsof -ti :5000 | xargs kill -9 2>/dev/null || true', () => {
        setTimeout(resolve, 1000);
      });
    }
  });
}

// Start the server
function startServer() {
  return new Promise((resolve, reject) => {
    console.log('Starting backend server...\n');
    
    const server = spawn('npm', ['run', 'server'], {
      cwd: __dirname,
      stdio: 'inherit',
      shell: true
    });

    server.on('error', reject);
    
    // Wait for server to be ready
    let attempts = 0;
    const checkServer = setInterval(async () => {
      attempts++;
      if (await isServerRunning()) {
        clearInterval(checkServer);
        console.log('\n✓ Server started successfully\n');
        resolve();
      }
      if (attempts > 30) {
        clearInterval(checkServer);
        reject(new Error('Server failed to start'));
      }
    }, 500);
  });
}

// Main launcher
async function launch() {
  try {
    // Check if already running
    if (await isServerRunning()) {
      console.log('✓ Server already running\n');
    } else {
      await killExistingServer();
      await startServer();
    }

    console.log('='.repeat(60));
    console.log('Server running on: http://localhost:5000');
    console.log('Network Explorer: ' + URL);
    console.log('='.repeat(60) + '\n');

    console.log('Opening LinkUp Network Explorer...\n');
    
    // Open browser
    try {
      await open(URL);
    } catch (e) {
      console.log('Could not auto-open browser. Please visit:');
      console.log(URL + '\n');
    }

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

launch();
