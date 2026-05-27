import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import { db } from './db.js';
import { resolveChannelId } from './youtube.js';
import { syncAllChannels, startScheduler, getSyncStatus } from './scheduler.js';

// Load environment variables (.env)
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Log incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// API Endpoints

// 1. Settings Endpoints
app.get('/api/settings', (req, res) => {
  try {
    const settings = db.getSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/settings', (req, res) => {
  try {
    const { geminiApiKey, scheduleHour, promptCustomization } = req.body;
    
    db.saveSettings({
      geminiApiKey: geminiApiKey !== undefined ? geminiApiKey : undefined,
      scheduleHour: scheduleHour !== undefined ? scheduleHour : undefined,
      promptCustomization: promptCustomization !== undefined ? promptCustomization : undefined
    });
    
    // Restart scheduler with the new timing
    startScheduler();
    
    res.json({ success: true, message: 'Configurações salvas e agendador reiniciado.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Channels Endpoints
app.get('/api/channels', (req, res) => {
  try {
    const channels = db.getChannels();
    res.json(channels);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/channels', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'A URL ou identificador do canal é obrigatório.' });
    }

    // Resolve channel handle/URL to ID and Title
    const channelData = await resolveChannelId(url);
    
    const newChannel = {
      id: channelData.id,
      name: channelData.name,
      handle: url.includes('@') ? '@' + url.split('@')[1].split('/')[0] : channelData.name,
      avatarUrl: channelData.avatarUrl,
      addedAt: new Date().toISOString()
    };

    const added = db.addChannel(newChannel);
    if (!added) {
      return res.status(400).json({ error: 'Este canal já está cadastrado.' });
    }

    res.json({ success: true, channel: newChannel });
  } catch (error) {
    console.error('Failed to add channel:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/channels/:id', (req, res) => {
  try {
    const { id } = req.params;
    const removed = db.removeChannel(id);
    if (!removed) {
      return res.status(404).json({ error: 'Canal não encontrado.' });
    }
    res.json({ success: true, message: 'Canal removido com sucesso.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Summaries Endpoints
app.get('/api/summaries', (req, res) => {
  try {
    const summaries = db.getSummaries();
    res.json(summaries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Sync Endpoints
app.post('/api/sync', async (req, res) => {
  try {
    // Run sync in the background so the HTTP request doesn't timeout
    syncAllChannels().then(result => {
      console.log('Async manual sync finished:', result.message);
    }).catch(err => {
      console.error('Async manual sync failed:', err);
    });

    res.json({ success: true, message: 'Sincronização iniciada em segundo plano.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/sync/status', (req, res) => {
  res.json(getSyncStatus());
});

// Serve built React assets in production
const distPath = path.join(__dirname, '../../dist');
if (fs.existsSync(distPath)) {
  console.log(`Serving static assets from: ${distPath}`);
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  console.log('Running in development mode (API server only)');
  app.get('/', (req, res) => {
    res.send('Servidor do Agente Morning Brew está rodando em modo API.');
  });
}

// Start API Server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  
  // Start daily scheduler
  try {
    startScheduler();
  } catch (err) {
    console.error('Failed to initialize scheduler:', err);
  }

  // Automatic startup sync check in the background (safety net for cold starts)
  setTimeout(async () => {
    console.log('Running startup sync check...');
    try {
      const summaries = db.getSummaries();
      const lastSync = summaries.length > 0 && summaries[0].syncedAt ? new Date(summaries[0].syncedAt) : null;
      const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
      
      if (!lastSync || lastSync < twelveHoursAgo) {
        console.log('Last sync was more than 12h ago or never. Triggering background startup sync...');
        syncAllChannels().then(result => {
          console.log('Background startup sync finished:', result.message);
        }).catch(err => {
          console.error('Background startup sync failed:', err);
        });
      } else {
        console.log('Recent sync found. Startup sync skipped.');
      }
    } catch (err) {
      console.error('Failed to run startup sync check:', err);
    }
  }, 10000); // Wait 10s after startup to let server settle
});
