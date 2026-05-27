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
    <div className="glass-panel p-6 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl">
          <Youtube size={20} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-100">Canais do YouTube Monitorados</h2>
          <p className="text-xs text-slate-400">Adicione os canais que o agente deve olhar todas as manhãs.</p>
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
              className="form-input w-full pr-10"
              id="channel-url-input"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !urlInput.trim()}
            className="btn-primary flex items-center justify-center gap-2 h-[46px] disabled:opacity-50 disabled:cursor-not-allowed"
            id="add-channel-btn"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                <span>Buscando Canal...</span>
              </>
            ) : (
              <>
                <Plus size={18} />
                <span>Adicionar Canal</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="flex items-start gap-2 mt-3 p-3 bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl text-sm">
            <AlertCircle className="shrink-0 mt-0.5" size={16} />
            <span>{error}</span>
          </div>
        )}
      </form>

      {/* Subscribed channels grid */}
      {channels.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-slate-700/50 rounded-2xl bg-slate-900/10">
          <p className="text-sm text-slate-400">Nenhum canal monitorado ainda.</p>
          <p className="text-xs text-slate-500 mt-1">Insira um link acima para cadastrar seu primeiro canal!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {channels.map((channel) => (
            <div
              key={channel.id}
              className="flex items-center justify-between p-4 bg-slate-900/30 border border-slate-800 rounded-xl glass-panel-hover"
            >
              <div className="flex items-center gap-3 min-w-0">
                {channel.avatarUrl ? (
                  <img
                    src={channel.avatarUrl}
                    alt={channel.name}
                    className="w-10 h-10 rounded-full border border-slate-700 object-cover shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/25 text-purple-400 flex items-center justify-center font-bold text-base shrink-0">
                    {channel.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <h4 className="font-semibold text-slate-200 text-sm truncate" title={channel.name}>
                    {channel.name}
                  </h4>
                  <p className="text-xs text-slate-400 truncate">
                    {channel.handle || `@${channel.name.replace(/\s+/g, '').toLowerCase()}`}
                  </p>
                </div>
              </div>

              <button
                onClick={() => onRemoveChannel(channel.id)}
                className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors duration-200"
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
