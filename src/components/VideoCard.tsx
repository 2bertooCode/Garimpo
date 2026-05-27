import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Clock, ExternalLink, Calendar } from 'lucide-react';

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

interface VideoCardProps {
  summary: Summary;
}

// Beautiful date formatter
const formatDate = (isoString: string) => {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch (e) {
    return isoString;
  }
};

// Robust, lightweight inline Markdown renderer
const renderMarkdownToHtml = (markdownText: string): string => {
  if (!markdownText) return '';
  
  let html = markdownText;
  
  // Escaping simple HTML to prevent XSS
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Re-allow specific safely parsed tags below
  
  // Parse Headings: ### Title
  html = html.replace(/^###\s+(.*)$/gm, '<h3>$1</h3>');
  
  // Parse Bold: **text**
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Parse Bullet Lists: - item
  const lines = html.split('\n');
  let inList = false;
  const processedLines = lines.map(line => {
    const trimmed = line.trim();
    
    // Check if bullet point
    const bulletMatch = trimmed.match(/^-\s+(.*)/) || trimmed.match(/^\*\s+(.*)/);
    
    if (bulletMatch) {
      let output = '';
      if (!inList) {
        inList = true;
        output += '<ul class="list-disc pl-5 my-2">';
      }
      output += `<li class="text-slate-300 text-sm mb-2">${bulletMatch[1]}</li>`;
      return output;
    } else {
      let output = '';
      if (inList) {
        inList = false;
        output += '</ul>';
      }
      
      // Keep headers clean or transform regular lines into paragraphs
      if (trimmed.startsWith('&lt;h3') || trimmed.startsWith('<h3>')) {
        // Re-inject safe heading tags
        return output + trimmed.replace(/&lt;h3&gt;/g, '<h3>').replace(/&lt;\/h3&gt;/g, '</h3>');
      } else if (trimmed === '---' || trimmed === '***') {
        return output + '<hr class="my-4 border-slate-800" />';
      } else if (trimmed.length > 0) {
        return output + `<p class="text-slate-300 text-sm mb-3 leading-relaxed">${trimmed}</p>`;
      }
      return output;
    }
  });
  
  if (inList) {
    processedLines.push('</ul>');
  }
  
  return processedLines.join('\n');
};

export const VideoCard: React.FC<VideoCardProps> = ({ summary }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="glass-panel glass-panel-hover overflow-hidden flex flex-col md:flex-row mb-6 border border-slate-800/80">
      {/* Left side: Thumbnail preview */}
      <div className="relative w-full md:w-80 shrink-0 aspect-video md:aspect-auto md:min-h-[200px] bg-slate-950 group">
        {summary.thumbnailUrl ? (
          <img
            src={summary.thumbnailUrl}
            alt={summary.videoTitle}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-600 bg-slate-900">
            Sem Thumbnail
          </div>
        )}
        
        {/* Time Saved Badge Overlay */}
        <div className="absolute top-3 left-3 bg-purple-600/90 backdrop-blur border border-purple-400/20 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1">
          <Clock size={12} />
          <span>⚡ Poupou {summary.timeSavedMinutes} min</span>
        </div>
        
        {/* Overlay Hover Icon to Original Video */}
        <a
          href={summary.videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300 text-white"
        >
          <div className="p-3 bg-slate-900/80 backdrop-blur border border-white/10 rounded-full flex items-center gap-1.5 shadow-xl hover:scale-105 transition-transform">
            <span className="text-xs font-bold">Assistir Original</span>
            <ExternalLink size={14} />
          </div>
        </a>
      </div>

      {/* Right side: Summary Details */}
      <div className="flex-1 p-5 md:p-6 flex flex-col justify-between">
        <div>
          {/* Header Info: Channel and date */}
          <div className="flex items-center gap-2 mb-2 text-xs text-slate-400">
            <span className="font-semibold text-slate-300 bg-slate-800 border border-slate-700/50 px-2 py-0.5 rounded-md">
              {summary.channelName}
            </span>
            <span className="text-slate-600">•</span>
            <div className="flex items-center gap-1 text-slate-400">
              <Calendar size={12} />
              <span>{formatDate(summary.publishedAt)}</span>
            </div>
          </div>

          {/* Video Title */}
          <h3 className="text-lg font-bold text-slate-100 mb-3 hover:text-cyan-400 transition-colors leading-tight">
            <a href={summary.videoUrl} target="_blank" rel="noopener noreferrer">
              {summary.videoTitle}
            </a>
          </h3>

          {/* Briefing Accordion Content */}
          <div 
            className={`transition-all duration-300 ease-in-out overflow-hidden ${
              isOpen ? 'max-h-[1500px] opacity-100 mt-4 pt-4 border-t border-slate-800' : 'max-h-0 opacity-0'
            }`}
          >
            <div 
              className="markdown-body text-slate-300"
              dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(summary.summary) }}
            />
          </div>
        </div>

        {/* Action Toggle Button */}
        <div className="mt-4 pt-3 flex items-center justify-between border-t border-slate-800/40">
          <a
            href={summary.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-400 hover:text-slate-200 inline-flex items-center gap-1 transition-colors"
          >
            Ver no YouTube
            <ExternalLink size={12} />
          </a>
          
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all duration-200 ${
              isOpen 
                ? 'bg-slate-800 text-slate-200 border border-slate-700' 
                : 'bg-purple-500/10 border border-purple-500/20 text-purple-300 hover:bg-purple-500/20'
            }`}
            id={`toggle-${summary.videoId}`}
          >
            <span>{isOpen ? 'Esconder Briefing' : 'Ver Briefing de IA'}</span>
            {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
};
