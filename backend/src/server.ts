import express, { Request, Response } from 'express';
import http from 'http';
import cors from 'cors';
import bodyParser from 'body-parser';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getConfig, updateConfig } from './config';
import { setupWebSockets } from './socket';
import wing from './wing';
import logs from './logs';

const app = express();
const server = http.createServer(app);
const PORT = 3001;

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads'));
    },
    filename: (req, file, cb) => {
        // Use timestamp + original name to avoid collisions
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage });

app.use(cors());
app.use(bodyParser.json());
// Serve static files from 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Auth Middleware (very simple)
const requireAuth = (req: Request, res: Response, next: any) => {
    const authHeader = req.headers.authorization;
    if (authHeader === 'Bearer Admin') {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

// API Routes
app.post('/api/login', (req: Request, res: Response) => {
    const { username, password } = req.body;
    if (username === 'Admin' && password === 'Admin') {
        res.json({ token: 'Admin' });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

app.get('/api/config', (req: Request, res: Response) => {
    res.json(getConfig());
});

app.post('/api/config', requireAuth, (req: Request, res: Response) => {
    const newConfig = updateConfig(req.body);
    res.json(newConfig);
});

// Upload Image Endpoint
// Use 'any' for the middleware to bypass strict typing issues with multer middleware signature if needed, 
// but usually standard usage works if types are present. 
// We cast req to any to access .file to avoid extending Request type for now.
app.post('/api/upload', requireAuth, upload.single('image'), (req: Request, res: Response) => {
    const file = (req as any).file;
    if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    // Return the relative URL to the uploaded file
    res.json({ url: `/uploads/${file.filename}` });
});

// Delete Image Endpoint
app.delete('/api/images/:filename', requireAuth, (req: Request, res: Response) => {
    const filename = req.params.filename as string;
    // Basic validation to prevent path traversal
    if (!filename || filename.includes('..') || filename.includes('/')) {
        return res.status(400).json({ error: 'Invalid filename' });
    }

    const filepath = path.join(__dirname, '../uploads', filename);

    fs.unlink(filepath, (err) => {
        if (err) {
            console.error('Failed to delete file:', err);
            return res.status(500).json({ error: 'Failed to delete file' });
        }
        res.json({ success: true });
    });
});

// List Images Endpoint
app.get('/api/images', requireAuth, (req: Request, res: Response) => {
    const uploadsDir = path.join(__dirname, '../uploads');
    fs.readdir(uploadsDir, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to list images' });
        }
        // Filter for image files only
        const images = files
            .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
            .map(file => `/uploads/${file}`);
        res.json(images);
    });
});

// Logging Endpoints
app.get('/api/logs/status', (req: Request, res: Response) => {
    res.json(logs.getLogStats());
});

app.post('/api/logs/start', (req: Request, res: Response) => {
    logs.startLogging();
    res.json({ status: 'Logging started', isLogging: true });
});

app.post('/api/logs/stop', (req: Request, res: Response) => {
    logs.stopLogging();
    res.json({ status: 'Logging stopped', isLogging: false });
});

app.get('/api/logs', (req: Request, res: Response) => {
    const logEntries = logs.getLogs();
    res.json({ entries: logEntries, count: logEntries.length });
});

app.delete('/api/logs', (req: Request, res: Response) => {
    logs.clearLogs();
    res.json({ status: 'Logs cleared', cleared: true });
});

// Wing Connection Test Endpoint
app.get('/api/wing/test', async (req: Request, res: Response) => {
    try {
        const result = await wing.testConnection();
        res.json(result);
    } catch (err) {
        res.status(500).json({ connected: false, message: 'Test failed' });
    }
});

// Start WebSocket handling
setupWebSockets(server);

// Initialize Wing comms according to config (best-effort)
try {
    wing.initWing();
} catch (err) {
    console.warn('Wing initialization failed at startup', err);
}

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend server running on http://0.0.0.0:${PORT}`);
});