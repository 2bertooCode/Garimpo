import React, { useState, useEffect, useRef } from 'react';
import { Stats } from './components/Stats';
import { ChannelManager } from './components/ChannelManager';
import { Settings } from './components/Settings';
import { VideoCard } from './components/VideoCard';
import { 
  Home, 
  Settings as SettingsIcon, 
  Youtube, 
  Coffee, 
  Sparkles,
  Play,
  RotateCw,
  Clock,
  Eye,
  Info,
  Calendar,
  XCircle
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
          month: 'long'
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
  const [activeTab, setActiveTab] = useState<'feed' | 'channels' | 'settings'>('feed');
  
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
  const [activeChannelFilter, setActiveChannelFilter] = useState<string | null>(null);
  
  const syncPollTimer = useRef<any>(null);

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
        if (syncPollTimer.current) {
          clearInterval(syncPollTimer.current);
          syncPollTimer.current = null;
        }
        setSyncMessage(null);
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
    if (activeChannelFilter === id) {
      setActiveChannelFilter(null);
    }
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
    setSyncMessage('Buscando canais no YouTube...');
    
    try {
      await fetch('/api/sync', { method: 'POST' });
      if (syncPollTimer.current) clearInterval(syncPollTimer.current);
      syncPollTimer.current = setInterval(checkSyncStatus, 3000);
    } catch (err) {
      setIsSyncing(false);
      setSyncMessage('Falha na sincronização.');
      setTimeout(() => setSyncMessage(null), 3000);
    }
  };

  // Toggle filter by channel (Spotify Playlist effect)
  const handleSelectChannelFilter = (channelId: string) => {
    if (activeChannelFilter === channelId) {
      setActiveChannelFilter(null); // Clear filter
    } else {
      setActiveChannelFilter(channelId);
      setActiveTab('feed'); // Go back to feed to see results
    }
  };

  // Calculations
  const filteredSummaries = activeChannelFilter 
    ? summaries.filter(s => s.channelId === activeChannelFilter)
    : summaries;

  const groupedSummaries = groupSummariesByDay(filteredSummaries);
  const totalTimeSaved = summaries.reduce((acc, curr) => acc + (curr.timeSavedMinutes || 0), 0);
  
  // Track details for bottom player (last generated summary or currently syncing info)
  const latestSummary = summaries[0];
  const activeFilterName = activeChannelFilter 
    ? channels.find(c => c.id === activeChannelFilter)?.name 
    : null;

  return (
    <div className="flex flex-col h-screen bg-black text-white select-none">
      
      {/* Main Container */}
      <div className="spotify-layout">
        
        {/* Sidebar (Left Pane) */}
        <aside className="spotify-sidebar">
          {/* Nav Card */}
          <div className="spotify-sidebar-card">
            {/* Logo */}
            <div className="flex items-center gap-3 px-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#1DB954] to-cyan-400 flex items-center justify-center text-black">
                <Coffee size={18} strokeWidth={2.5} />
              </div>
              <span className="font-extrabold text-white text-base tracking-tight">
                Morning Brew
              </span>
            </div>

            {/* Nav Items */}
            <button
              onClick={() => { setActiveTab('feed'); }}
              className={`spotify-sidebar-nav-item ${activeTab === 'feed' && !activeChannelFilter ? 'active' : ''}`}
            >
              <Home size={20} />
              <span>Início</span>
            </button>

            <button
              onClick={() => { setActiveTab('channels'); }}
              className={`spotify-sidebar-nav-item ${activeTab === 'channels' ? 'active' : ''}`}
            >
              <Youtube size={20} />
              <span>Gerenciar Canais</span>
            </button>

            <button
              onClick={() => { setActiveTab('settings'); }}
              className={`spotify-sidebar-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            >
              <SettingsIcon size={20} />
              <span>Ajustes da IA</span>
            </button>
          </div>

          {/* Subscribed Channels List (Spotify "Your Library") */}
          <div className="spotify-library">
            <div className="flex items-center gap-2 mb-4 text-xs font-extrabold text-slate-400 uppercase tracking-widest px-2">
              <Youtube size={14} className="text-[#1DB954]" />
              <span>Sua Biblioteca</span>
            </div>
            
            {channels.length === 0 ? (
              <div className="px-2 py-6 text-center text-xs text-slate-500">
                Sem canais cadastrados.
              </div>
            ) : (
              <div className="space-y-1.5 overflow-y-auto max-h-[calc(100vh-340px)]">
                {channels.map(channel => (
                  <div
                    key={channel.id}
                    onClick={() => handleSelectChannelFilter(channel.id)}
                    className={`spotify-library-item ${
                      activeChannelFilter === channel.id ? 'active border-l-4 border-[#1DB954]' : ''
                    }`}
                    title={`Filtrar canal: ${channel.name}`}
                  >
                    {channel.avatarUrl ? (
                      <img
                        src={channel.avatarUrl}
                        alt={channel.name}
                        className="spotify-avatar-small border border-slate-800"
                      />
                    ) : (
                      <div className="spotify-avatar-small bg-green-500/10 border border-green-500/20 text-[#1DB954] flex items-center justify-center font-bold text-xs">
                        {channel.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">{channel.name}</p>
                      <p className="text-xs text-slate-400 truncate">Canal Monitorado</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Main Content Area (Middle Pane) */}
        <main className="spotify-main-content">
          {isLoading ? (
            <div className="flex-1 flex flex-col justify-center items-center text-slate-400 gap-4">
              <RotateCw className="animate-spin text-[#1DB954]" size={36} />
              <p className="text-sm font-medium">Sincronizando com o servidor...</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              
              {/* Conditional Content Header */}
              {activeTab === 'feed' && (
                <div className="mb-6">
                  {/* Stats pills */}
                  <Stats
                    channelsCount={channels.length}
                    summariesCount={summaries.length}
                    timeSaved={totalTimeSaved}
                    scheduleHour={settings.scheduleHour}
                  />

                  {/* Header greetings */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2 border-b border-white/5 pb-5">
                    <div>
                      <h2 className="text-3xl font-extrabold text-white flex items-center gap-2">
                        {activeFilterName ? `Mix de ${activeFilterName}` : 'Seu Morning Mix'}
                        <Sparkles size={20} className="text-[#1DB954] animate-pulse" />
                      </h2>
                      <p className="text-xs text-slate-400 mt-1">
                        {activeFilterName 
                          ? `Exibindo resumos executivos focados em ${activeFilterName}.`
                          : 'Seu briefing diário compilado a partir de inteligência artificial matinal.'}
                      </p>
                    </div>

                    {/* Filter reset button if active */}
                    {activeChannelFilter && (
                      <button
                        onClick={() => setActiveChannelFilter(null)}
                        className="btn-spotify-secondary flex items-center gap-1.5 text-xs"
                      >
                        <XCircle size={14} />
                        <span>Ver Todos os Canais</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Render dynamic tabs */}
              {activeTab === 'feed' && (
                <div className="flex-1 overflow-y-auto pr-1">
                  {filteredSummaries.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
                      <div className="p-5 bg-white/5 rounded-full border border-white/10 text-slate-400 mb-4">
                        <Coffee size={44} />
                      </div>
                      <h4 className="font-extrabold text-lg text-slate-200">Sua mesa matinal está limpa!</h4>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto mt-2 leading-relaxed">
                        Nenhum briefing disponível no momento. 
                        Cadastre canais e sua chave de API e clique em **Sincronizar Canais** no painel do player inferior para decolar!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {Object.keys(groupedSummaries).map(day => (
                        <div key={day}>
                          {/* Daily Timeline Label */}
                          <div className="mb-4 flex items-center gap-2 border-b border-white/5 pb-2">
                            <span className="w-2 h-2 rounded-full bg-[#1DB954]" />
                            <h3 className="text-sm font-extrabold tracking-widest text-[#1DB954] uppercase">
                              {day}
                            </h3>
                          </div>

                          {/* Render Video cards */}
                          <div className="space-y-4">
                            {groupedSummaries[day].map(summary => (
                              <VideoCard key={summary.videoId} summary={summary} />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'channels' && (
                <div className="animate-fade-in flex-1 overflow-y-auto">
                  <ChannelManager
                    channels={channels}
                    onAddChannel={handleAddChannel}
                    onRemoveChannel={handleRemoveChannel}
                  />
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="animate-fade-in flex-1 overflow-y-auto">
                  {/* Secure alert if env or local key missing */}
                  {!settings.geminiApiKey && (
                    <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/25 text-yellow-300 rounded-lg flex items-start gap-3">
                      <Info className="shrink-0 mt-0.5 text-yellow-400" size={18} />
                      <div>
                        <h4 className="font-bold text-sm">Chave de API do Gemini Ausente!</h4>
                        <p className="text-xs text-yellow-300/80 mt-1 leading-relaxed">
                          Para que o agente possa gerar resumos matinais de IA, configure sua chave do Gemini abaixo ou nas variáveis de ambiente do seu servidor na nuvem.
                        </p>
                      </div>
                    </div>
                  )}

                  <Settings
                    settings={settings}
                    onSaveSettings={handleSaveSettings}
                  />
                </div>
              )}

            </div>
          )}
        </main>

      </div>

      {/* Spotify Bottom Player Bar ("Now Playing Bar") */}
      <footer className="spotify-player-bar">
        
        {/* Left Side: Track Cover (Latest Video Details) */}
        <div className="spotify-player-track">
          {latestSummary ? (
            <>
              {latestSummary.thumbnailUrl ? (
                <a href={latestSummary.videoUrl} target="_blank" rel="noopener noreferrer">
                  <img
                    src={latestSummary.thumbnailUrl}
                    alt={latestSummary.videoTitle}
                    className="spotify-player-track-img hover:opacity-80 transition-opacity border border-white/5"
                  />
                </a>
              ) : (
                <div className="spotify-player-track-img bg-slate-800" />
              )}
              <div className="min-w-0">
                <h4 className="spotify-player-track-title hover:text-[#1DB954] cursor-pointer" title={latestSummary.videoTitle}>
                  <a href={latestSummary.videoUrl} target="_blank" rel="noopener noreferrer">
                    {latestSummary.videoTitle}
                  </a>
                </h4>
                <p className="spotify-player-track-channel">{latestSummary.channelName}</p>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <div className="spotify-player-track-img bg-slate-800 flex items-center justify-center text-slate-500">
                <Coffee size={20} />
              </div>
              <div>
                <h4 className="spotify-player-track-title">Nenhum vídeo</h4>
                <p className="spotify-player-track-channel">Aguardando sincronização</p>
              </div>
            </div>
          )}
        </div>

        {/* Center: Playback Controls (Sync Trigger & Progress timeline) */}
        <div className="spotify-player-controls">
          <div className="spotify-player-controls-buttons">
            <button
              onClick={handleTriggerSync}
              disabled={isSyncing || isLoading}
              className={`spotify-player-controls-play-btn ${isSyncing ? 'syncing' : ''}`}
              title={isSyncing ? 'Agente executando...' : 'Sincronizar feeds agora'}
              id="sync-now-btn"
            >
              {isSyncing ? (
                <RotateCw className="animate-spin text-black" size={18} />
              ) : (
                <Play className="fill-black text-black translate-x-0.5" size={18} />
              )}
            </button>
          </div>

          <div className="spotify-player-progress">
            <span className="spotify-player-time">
              {isSyncing ? '07:00' : '00:00'}
            </span>
            
            {/* Styled progress bar */}
            <div className="spotify-player-progress-bar">
              <div 
                className={`spotify-player-progress-fill ${isSyncing ? 'active' : ''}`} 
                style={{ width: isSyncing ? '70%' : '100%' }}
              />
            </div>
            
            <span className="spotify-player-time text-[10px]">
              {isSyncing ? 'Sincronizando...' : 'Tudo Atualizado!'}
            </span>
          </div>
        </div>

        {/* Right side: Utilities (Stats shortcuts & Options) */}
        <div className="spotify-player-actions">
          {latestSummary && (
            <div className="hidden lg:flex items-center gap-1 bg-[#1DB954]/10 border border-[#1DB954]/20 text-[#1DB954] font-bold text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider">
              <Clock size={10} className="mr-0.5 animate-pulse" />
              <span>Poupados: {totalTimeSaved} Minutos</span>
            </div>
          )}

          <button
            onClick={() => setActiveTab('settings')}
            className={`p-2 text-slate-400 hover:text-white rounded-full transition-colors ${
              activeTab === 'settings' ? 'text-white bg-white/5' : ''
            }`}
            title="Ir para Ajustes da IA"
          >
            <SettingsIcon size={16} />
          </button>
        </div>

      </footer>

    </div>
  );
}

export default App;
