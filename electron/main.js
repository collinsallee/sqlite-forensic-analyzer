const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');

// Create a directory for storing temporary files
const tempDir = path.join(os.tmpdir(), 'sqliteparser');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Setup the Next.js server
const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev, dir: app.getAppPath() });
const handle = nextApp.getRequestHandler();

let mainWindow;

async function createWindow() {
  await nextApp.prepare();

  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    title: 'SQLite Forensic Analyzer',
    icon: path.join(__dirname, '../public/favicon.ico')
  });

  // Start the server on a random port
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error handling request:', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  // Find an available port
  const port = await new Promise((resolve) => {
    server.listen(0, () => {
      resolve(server.address().port);
    });
  });

  console.log(`> Server listening at http://localhost:${port}`);
  mainWindow.loadURL(`http://localhost:${port}`);

  if (dev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // IPC handlers for file operations
  ipcMain.handle('save-file', async (event, fileData, fileId) => {
    const filePath = path.join(tempDir, fileId);
    fs.writeFileSync(filePath, Buffer.from(fileData));
    return { success: true, filePath };
  });

  ipcMain.handle('read-file', async (event, fileId, offset, length) => {
    const filePath = path.join(tempDir, fileId);
    if (!fs.existsSync(filePath)) {
      return { error: 'File not found' };
    }

    const fileSize = fs.statSync(filePath).size;
    if (offset >= fileSize) {
      return { error: 'Offset out of bounds' };
    }

    const buffer = Buffer.alloc(Math.min(length, fileSize - offset));
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, buffer.length, offset);
    fs.closeSync(fd);

    return {
      data: buffer.toString('hex'),
      offset,
      length: buffer.length
    };
  });

  ipcMain.handle('edit-file', async (event, fileId, offset, hexValue) => {
    const filePath = path.join(tempDir, fileId);
    if (!fs.existsSync(filePath)) {
      return { error: 'File not found' };
    }

    const buffer = Buffer.from(hexValue, 'hex');
    const fd = fs.openSync(filePath, 'r+');
    fs.writeSync(fd, buffer, 0, buffer.length, offset);
    fs.closeSync(fd);

    return { success: true };
  });

  ipcMain.handle('get-file-info', async (event, fileId) => {
    const filePath = path.join(tempDir, fileId);
    if (!fs.existsSync(filePath)) {
      return { error: 'File not found' };
    }

    const stats = fs.statSync(filePath);
    return {
      file_id: fileId,
      file_size: stats.size,
      file_name: path.basename(filePath),
      creation_time: stats.birthtime.toISOString(),
      last_modified_time: stats.mtime.toISOString()
    };
  });

  ipcMain.handle('calculate-file-hash', async (event, fileId) => {
    const filePath = path.join(tempDir, fileId);
    if (!fs.existsSync(filePath)) {
      return { error: 'File not found' };
    }

    const fileBuffer = fs.readFileSync(filePath);
    const md5Hash = crypto.createHash('md5').update(fileBuffer).digest('hex');
    const sha1Hash = crypto.createHash('sha1').update(fileBuffer).digest('hex');
    const sha256Hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    return {
      md5_hash: md5Hash,
      sha1_hash: sha1Hash,
      sha256_hash: sha256Hash
    };
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Cleanup the temp directory on exit
app.on('will-quit', () => {
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch (err) {
    console.error('Failed to clean up temp directory:', err);
  }
}); 