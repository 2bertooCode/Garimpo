import React, { useState } from 'react';
import { Settings as SettingsIcon, Save, Eye, EyeOff, CheckCircle, HelpCircle } from 'lucide-react';

interface SettingsData {
  geminiApiKey: string;
  scheduleHour: string;
  promptCustomization: string;
}

interface SettingsProps {
  settings: SettingsData;
  onSaveSettings: (settings: SettingsData) => Promise<void>;
}

export const Settings: React.FC<SettingsProps> = ({ settings, onSaveSettings }) => {
  const [apiKey, setApiKey] = useState(settings.geminiApiKey);
  const [hour, setHour] = useState(settings.scheduleHour);
  const [prompt, setPrompt] = useState(settings.promptCustomization);
  
  const [showKey, setShowKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedAlert, setShowSavedAlert] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setShowSavedAlert(false);

    try {
      await onSaveSettings({
        geminiApiKey: apiKey,
        scheduleHour: hour,
        promptCustomization: prompt
      });
      setShowSavedAlert(true);
      setTimeout(() => setShowSavedAlert(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="glass-panel p-6 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl">
          <SettingsIcon size={20} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-100">Painel de Configuração do Agente</h2>
          <p className="text-xs text-slate-400">Configure as credenciais e regras de IA de forma segura.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Gemini API Key */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            Chave de API do Gemini (Google AI Studio)
            <span className="group relative cursor-pointer text-slate-500 hover:text-slate-300">
              <HelpCircle size={14} />
              <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-2 bg-slate-950/95 border border-slate-800 text-[10px] text-slate-300 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-10 font-normal normal-case leading-normal shadow-xl">
                Obtenha uma chave gratuita no Google AI Studio (aistudio.google.com). Ela ficará salva estritamente no seu computador local.
              </span>
            </span>
          </label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              placeholder="Cole sua API Key aqui (AIzaSy...)"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="form-input w-full pr-12 font-mono text-sm"
              id="settings-api-key"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-200 transition-colors"
              title={showKey ? 'Ocultar chave' : 'Mostrar chave'}
            >
              {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Hour Input & Prompt Customization side-by-side or stacked */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {/* Cron hour */}
          <div className="flex flex-col gap-1.5 md:col-span-1">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Horário do Briefing
            </label>
            <input
              type="time"
              value={hour}
              onChange={(e) => setHour(e.target.value)}
              className="form-input w-full font-semibold text-center text-base"
              id="settings-time-input"
            />
            <span className="text-[10px] text-slate-400">
              O agente acordará neste horário para compilar as novidades.
            </span>
          </div>

          {/* Prompt customization */}
          <div className="flex flex-col gap-1.5 md:col-span-3">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Diretrizes de Resumo (Prompt Customizado)
            </label>
            <textarea
              placeholder="Ex: Foque nos pontos tecnológicos, escreva com tom animado e destaque exemplos práticos..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              className="form-input w-full resize-y text-sm leading-relaxed"
              id="settings-prompt-customization"
            />
            <span className="text-[10px] text-slate-400">
              Instruções extras enviadas à IA para moldar a formatação e foco do resumo.
            </span>
          </div>
        </div>

        {/* Save button & Alert */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <div className="flex-1">
            {showSavedAlert && (
              <div className="flex items-center gap-2 text-emerald-400 text-sm animate-fade-in">
                <CheckCircle size={16} />
                <span>Configurações salvas e aplicadas!</span>
              </div>
            )}
          </div>
          
          <button
            type="submit"
            disabled={isSaving}
            className="btn-primary flex items-center gap-2 h-11"
            id="save-settings-btn"
          >
            {isSaving ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <Save size={18} />
                <span>Salvar Alterações</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

// Simple fallback if Loader2 isn't imported
const Loader2 = ({ className, size }: { className?: string; size?: number }) => (
  <svg
    className={`animate-spin ${className}`}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);
