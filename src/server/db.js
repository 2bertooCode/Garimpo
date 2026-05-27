import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, 'db.json');

const DEFAULT_DB = {
  settings: {
    geminiApiKey: '',
    scheduleHour: '07:00',
    promptCustomization: 'Gere um resumo executivo técnico com pontos principais, conceitos citados e conclusões acionáveis em português do Brasil.'
  },
  channels: [],
  summaries: []
};

class LocalDatabase {
  constructor() {
    this.init();
  }

  init() {
    try {
      if (!fs.existsSync(DB_PATH)) {
        fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
        this.save(DEFAULT_DB);
        console.log('Database initialized successfully.');
      } else {
        // Validate JSON structure, reset if corrupt
        const content = fs.readFileSync(DB_PATH, 'utf8');
        JSON.parse(content);
      }
    } catch (error) {
      console.error('Failed to initialize database, resetting to default:', error);
      this.save(DEFAULT_DB);
    }
  }

  read() {
    try {
      const data = fs.readFileSync(DB_PATH, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to read database, returning default:', error);
      return DEFAULT_DB;
    }
  }

  save(data) {
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error('Failed to write to database:', error);
      return false;
    }
  }

  getSettings() {
    return this.read().settings;
  }

  saveSettings(settings) {
    const data = this.read();
    data.settings = { ...data.settings, ...settings };
    return this.save(data);
  }

  getChannels() {
    return this.read().channels;
  }

  addChannel(channel) {
    const data = this.read();
    if (data.channels.some(c => c.id === channel.id)) {
      return false; // Already exists
    }
    data.channels.push(channel);
    this.save(data);
    return true;
  }

  removeChannel(channelId) {
    const data = this.read();
    const index = data.channels.findIndex(c => c.id === channelId);
    if (index === -1) return false;
    data.channels.splice(index, 1);
    this.save(data);
    return true;
  }

  getSummaries() {
    return this.read().summaries;
  }

  addSummary(summary) {
    const data = this.read();
    if (data.summaries.some(s => s.videoId === summary.videoId)) {
      return false; // Summary already generated
    }
    data.summaries.unshift(summary); // Prepend new summaries so they show up first
    this.save(data);
    return true;
  }
}

export const db = new LocalDatabase();
