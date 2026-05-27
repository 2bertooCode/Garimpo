import React, { useState, useEffect, useRef } from 'react';
import { Stats } from './components/Stats';
import { ChannelManager } from './components/ChannelManager';
import { Settings } from './components/Settings';
import { VideoCard } from './components/VideoCard';
import { 
  Tv2, 
  Settings as SettingsIcon, 
  RefreshCw, 
  Coffee, 
  Sparkles,
  Info,
  ChevronRight,
  TrendingUp
} from 'lucide-react';

interface Channel {
  id: string;
  name: string;
  handle: string;
  avatarUrl?: string;
  addedAt: string;
}

interface Summary {
  videoId: string;
  videoTitle: string;
  channelId: string;
  channelName: string;
  publishedAt: string;
  thumbnailUrl: string;
  videoUrl: string;
  summary: string;
  timeSavedMinutes: number;
  syncedAt: string;
}

interface SettingsData {
  geminiApiKey: string;
  scheduleHour: string;
  promptCustomization: string;
}

// Helper to group summaries by human-readable days
const groupSummariesByDay = (summariesList: Summary[]) => {
  const groups: { [key: string]: Summary[] } = {};
  
  summariesList.forEach(summary => {
    try {
      const pubDate = new Date(summary.publishedAt);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      let dayLabel = '';
      
      if (pubDate.toDateString() === today.toDateString()) {
        dayLabel = 'Hoje';
      } else if (pubDate.toDateString() === yesterday.toDateString()) {
        dayLabel = 'Ontem';
      } else {
        dayLabel = pubDate.toLocaleDateString('pt-BR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
      }
      
      if (!groups[dayLabel]) {
        groups[dayLabel] = [];
      }
      groups[dayLabel].push(summary);
    } catch (e) {
      const fallback = 'Mais Antigos';
      if (!groups[fallback]) groups[fallback] = [];
      groups[fallback].push(summary);
    }
  });
  
  return groups;
};

function App() {
  const [activeTab, setActiveTab] = useState<'feed' | 'control'>('feed');
  
  const [channels, setChannels] = useState<Channel[]>([]);
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [settings, setSettings] = useState<SettingsData>({
    geminiApiKey: '',
    scheduleHour: '07:00',
    promptCustomization: ''
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  
  const syncPollTimer = useRef<NodeJS.Timeout | null>(null);

  // Fetch initial data
  const fetchData = async () => {
    try {
      const [settingsRes, channelsRes, summariesRes] = await Promise.all([
        fetch('/api/settings').then(res => res.json()),
        fetch('/api/channels').then(res => res.json()),
        fetch('/api/summaries').then(res => res.json())
      ]);

      setSettings(settingsRes);
      setChannels(channelsRes);
      setSummaries(summariesRes);
    } catch (err) {
      console.error('Error fetching data from backend:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Poll sync status
  const checkSyncStatus = async () => {
    try {
      const res = await fetch('/api/sync/status').then(r => r.json());
      setIsSyncing(res.isSyncing);
      
      if (!res.isSyncing) {
        // Finished syncing! Clear timer and refresh feeds
        if (syncPollTimer.current) {
          clearInterval(syncPollTimer.current);
          syncPollTimer.current = null;
        }
        setSyncMessage('Sincronização concluída com sucesso!');
        setTimeout(() => setSyncMessage(null), 4000);
        fetchData();
      }
    } catch (err) {
      console.error('Failed to poll sync status:', err);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Initial check if sync is currently in progress
    fetch('/api/sync/status')
      .then(r => r.json())
      .then(res => {
        if (res.isSyncing) {
          setIsSyncing(true);
          syncPollTimer.current = setInterval(checkSyncStatus, 3000);
        }
      });

    return () => {
      if (syncPollTimer.current) clearInterval(syncPollTimer.current);
    };
  }, []);

  // Handlers
  const handleAddChannel = async (url: string) => {
    const res = await fetch('/api/channels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Erro ao adicionar canal.');
    }
    
    // Refresh channels list
    const updatedChannels = await fetch('/api/channels').then(r => r.json());
    setChannels(updatedChannels);
  };

  const handleRemoveChannel = async (id: string) => {
    const res = await fetch(`/api/channels/${id}`, {
      method: 'DELETE'
    });

    if (!res.ok) {
      throw new Error('Erro ao remover canal.');
    }

    setChannels(channels.filter(c => c.id !== id));
  };

  const handleSaveSettings = async (updatedSettings: SettingsData) => {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedSettings)
    });

    if (!res.ok) {
      throw new Error('Erro ao salvar configurações.');
    }

    setSettings(updatedSettings);
  };

  const handleTriggerSync = async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    setSyncMessage('Agente acordando... Iniciando varredura nos feeds do YouTube.');
    
    try {
      await fetch('/api/sync', { method: 'POST' });
      // Start polling
      if (syncPollTimer.current) clearInterval(syncPollTimer.current);
      syncPollTimer.current = setInterval(checkSyncStatus, 3000);
    } catch (err) {
      setIsSyncing(false);
      setSyncMessage('Falha ao disparar sincronização.');
      setTimeout(() => setSyncMessage(null), 3000);
    }
  };

  // Group and calculate statistics
  const groupedSummaries = groupSummariesByDay(summaries);
  const totalTimeSaved = summaries.reduce((acc, curr) => acc + (curr.timeSavedMinutes || 0), 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Premium Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-purple-600 to-cyan-500 rounded-2xl shadow-lg shadow-purple-500/20 text-white animate-pulse-glow">
            <Coffee size={28} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-2">
              <span className="text-gradient">Morning Brew</span>
              <span className="text-xs bg-slate-800 text-slate-400 font-normal px-2.5 py-0.5 rounded-full border border-slate-700/50">
                Agent v1.0
              </span>
            </h1>
            <p className="text-sm text-slate-400">Seu resumo diário de inteligência a partir do YouTube</p>
          </div>
        </div>

        {/* Tab Navigation & Manual Sync */}
        <div className="flex items-center gap-3 self-start md:self-center">
          <div className="bg-slate-900/80 p-1 border border-slate-800 rounded-xl flex gap-1">
            <button
              onClick={() => setActiveTab('feed')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'feed'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              id="feed-tab-btn"
            >
              <Tv2 size={14} />
              <span>Resumos</span>
            </button>
            <button
              onClick={() => setActiveTab('control')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'control'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              id="control-tab-btn"
            >
              <SettingsIcon size={14} />
              <span>Painel</span>
            </button>
          </div>

          <button
            onClick={handleTriggerSync}
            disabled={isSyncing || isLoading}
            className={`btn-primary flex items-center gap-2 text-xs font-bold h-[38px] ${
              isSyncing ? 'animate-pulse opacity-75' : ''
            }`}
            id="sync-now-btn"
          >
            <RefreshCw className={isSyncing ? 'animate-spin' : ''} size={14} />
            <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Canais'}</span>
          </button>
        </div>
      </header>

      {/* Sync Status Banner */}
      {syncMessage && (
        <div className="mb-6 p-4 glass-panel border-cyan-500/20 bg-cyan-950/10 text-cyan-300 flex items-center justify-between animate-fade-in shadow-lg">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`p-1.5 rounded-lg shrink-0 ${isSyncing ? 'bg-cyan-500/10 text-cyan-400 animate-spin' : 'bg-emerald-500/10 text-emerald-400'}`}>
              {isSyncing ? <RefreshCw size={16} /> : <Sparkles size={16} />}
            </div>
            <p className="text-xs font-medium truncate">{syncMessage}</p>
          </div>
          {isSyncing && (
            <span className="text-[10px] uppercase font-bold text-cyan-400 shrink-0 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded ml-2 animate-pulse">
              Executando...
            </span>
          )}
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="space-y-6">
          {/* Skeleton stats */}
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="glass-panel p-5 h-24 skeleton-shimmer"></div>
            ))}
          </div>
          {/* Skeleton card */}
          <div className="glass-panel p-6 h-48 skeleton-shimmer"></div>
        </div>
      ) : (
        <>
          {/* Dashboard Tab: Video Briefings grouped by Day */}
          {activeTab === 'feed' && (
            <div>
              {/* Stats overview */}
              <Stats
                channelsCount={channels.length}
                summariesCount={summaries.length}
                timeSaved={totalTimeSaved}
                scheduleHour={settings.scheduleHour}
              />

              {/* Feed lists */}
              {summaries.length === 0 ? (
                <div className="glass-panel p-12 text-center border-dashed border-slate-700/60 my-10 bg-slate-900/10">
                  <div className="p-4 bg-purple-500/5 text-purple-400 inline-block rounded-full border border-purple-500/10 mb-4 animate-bounce">
                    <Coffee size={40} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-200">Sua mesa de café da manhã está vazia!</h3>
                  <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
                    Nenhum resumo foi gerado ainda. Insira canais do YouTube e sua chave do Gemini na aba 
                    <strong> Painel</strong> e clique em <strong>Sincronizar Canais</strong> para receber seus primeiros resumos!
                  </p>
                  <button
                    onClick={() => setActiveTab('control')}
                    className="btn-secondary text-xs mt-6"
                  >
                    Ir para o Painel
                  </button>
                </div>
              ) : (
                <div className="relative pl-0 sm:pl-8 border-none sm:border-l sm:border-slate-800/80 space-y-12">
                  {Object.keys(groupedSummaries).map((day) => (
                    <div key={day} className="relative">
                      {/* Timeline Day Title */}
                      <div className="absolute -left-12 top-1.5 hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-slate-950 border-2 border-purple-500 text-purple-400 shadow-lg shadow-purple-500/10">
                        <ChevronRight size={16} />
                      </div>
                      
                      <div className="mb-6 flex items-center gap-3">
                        <h2 className="text-xl font-extrabold text-gradient-cyan tracking-tight">
                          {day}
                        </h2>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full">
                          {groupedSummaries[day].length} {groupedSummaries[day].length === 1 ? 'vídeo' : 'vídeos'}
                        </span>
                      </div>

                      {/* Video summaries for this day */}
                      <div className="space-y-6">
                        {groupedSummaries[day].map((summary) => (
                          <VideoCard key={summary.videoId} summary={summary} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Control Center Tab: Channels and settings */}
          {activeTab === 'control' && (
            <div className="space-y-6 animate-fade-in">
              {/* Warnings if API key is missing */}
              {!settings.geminiApiKey && (
                <div className="p-4 glass-panel border-yellow-500/20 bg-yellow-950/10 text-yellow-300 flex items-start gap-3">
                  <Info className="shrink-0 mt-0.5 text-yellow-400" size={18} />
                  <div>
                    <h4 className="font-bold text-sm">Chave de API do Gemini Ausente!</h4>
                    <p className="text-xs text-yellow-400/90 mt-1 leading-relaxed">
                      Para que o agente de Inteligência Artificial resuma os vídeos, você precisa colar sua chave do Gemini nas configurações abaixo. 
                      Sem a chave, a sincronização de feeds falhará ao tentar sintetizar as transcrições.
                    </p>
                  </div>
                </div>
              )}

              {/* Channel subscriptions manager */}
              <ChannelManager
                channels={channels}
                onAddChannel={handleAddChannel}
                onRemoveChannel={handleRemoveChannel}
              />

              {/* Gemini AI & Cron preferences */}
              <Settings
                settings={settings}
                onSaveSettings={handleSaveSettings}
              />
            </div>
          )}
        </>
      )}

      {/* Simple Footer */}
      <footer className="mt-16 border-t border-slate-800/80 pt-6 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p>© 2026 Morning Brew YouTube Summary Agent.</p>
        <div className="flex items-center gap-1">
          <span>Feito com</span>
          <Sparkles size={12} className="text-purple-400 animate-pulse" />
          <span>usando Gemini 2.5 Flash</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
