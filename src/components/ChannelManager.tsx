import React, { useState } from 'react';
import { Plus, Trash2, Youtube, Loader2, AlertCircle } from 'lucide-react';

interface Channel {
  id: string;
  name: string;
  handle: string;
  avatarUrl?: string;
  addedAt: string;
}

interface ChannelManagerProps {
  channels: Channel[];
  onAddChannel: (url: string) => Promise<void>;
  onRemoveChannel: (id: string) => Promise<void>;
}

export const ChannelManager: React.FC<ChannelManagerProps> = ({
  channels,
  onAddChannel,
  onRemoveChannel
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      await onAddChannel(urlInput);
      setUrlInput('');
    } catch (err: any) {
      setError(err.message || 'Erro ao processar o canal. Verifique a URL.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="spotify-card p-6 mb-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl">
          <Youtube size={22} />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-white">Canais do YouTube Monitorados</h2>
          <p className="text-xs text-slate-400">Adicione ou remova canais que o agente deve buscar todas as manhãs.</p>
        </div>
      </div>

      {/* Add channel form */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Cole o link do canal ou handle (ex: @ManualdoMundo)"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              disabled={isLoading}
              className="spotify-input w-full"
              id="channel-url-input"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !urlInput.trim()}
            className="btn-spotify flex items-center justify-center gap-2 h-[46px] disabled:opacity-50 disabled:cursor-not-allowed"
            id="add-channel-btn"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                <span>Buscando...</span>
              </>
            ) : (
              <>
                <Plus size={18} />
                <span>Adicionar</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="flex items-start gap-2 mt-3 p-3 bg-red-500/10 border border-red-500/20 text-red-300 rounded-lg text-sm">
            <AlertCircle className="shrink-0 mt-0.5" size={16} />
            <span>{error}</span>
          </div>
        )}
      </form>

      {/* Subscribed channels list styled like Spotify Library */}
      {channels.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-slate-700/50 rounded-lg bg-slate-900/10">
          <p className="text-sm text-slate-400">Nenhum canal monitorado ainda.</p>
          <p className="text-xs text-slate-500 mt-1">Cole um link acima para adicionar seu primeiro canal!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {channels.map((channel) => (
            <div
              key={channel.id}
              className="flex items-center justify-between p-3 bg-black/20 border border-transparent rounded-lg hover:bg-white/5 transition-colors duration-200"
            >
              <div className="flex items-center gap-3 min-w-0">
                {channel.avatarUrl ? (
                  <img
                    src={channel.avatarUrl}
                    alt={channel.name}
                    className="spotify-avatar"
                  />
                ) : (
                  <div className="spotify-avatar bg-green-500/10 border border-green-500/20 text-green-400 flex items-center justify-center font-bold text-base">
                    {channel.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <h4 className="font-bold text-white text-sm truncate" title={channel.name}>
                    {channel.name}
                  </h4>
                  <p className="text-xs text-slate-400 truncate">
                    {channel.handle || `@${channel.name.replace(/\s+/g, '').toLowerCase()}`}
                  </p>
                </div>
              </div>

              <button
                onClick={() => onRemoveChannel(channel.id)}
                className="p-2 text-slate-400 hover:text-red-400 rounded-lg transition-colors"
                title="Remover canal"
                id={`remove-${channel.id}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
