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

  // Parse Headings: ### Title -> Spotify Green Subsections
  html = html.replace(/^###\s+(.*)$/gm, '<h3>$1</h3>');
  
  // Parse Bold: **text**
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Parse Bullet Lists: - item
  const lines = html.split('\n');
  let inList = false;
  const processedLines = lines.map(line => {
    const trimmed = line.trim();
    const bulletMatch = trimmed.match(/^-\s+(.*)/) || trimmed.match(/^\*\s+(.*)/);
    
    if (bulletMatch) {
      let output = '';
      if (!inList) {
        inList = true;
        output += '<ul class="list-disc pl-5 my-2">';
      }
      output += `<li class="text-slate-300 text-sm mb-2 leading-relaxed">${bulletMatch[1]}</li>`;
      return output;
    } else {
      let output = '';
      if (inList) {
        inList = false;
        output += '</ul>';
      }
      
      if (trimmed.startsWith('&lt;h3') || trimmed.startsWith('<h3>')) {
        return output + trimmed.replace(/&lt;h3&gt;/g, '<h3>').replace(/&lt;\/h3&gt;/g, '</h3>');
      } else if (trimmed === '---' || trimmed === '***') {
        return output + '<hr class="my-4 border-slate-700/30" />';
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
    <div className="spotify-card flex flex-col md:flex-row mb-4 border border-transparent hover:border-slate-800 transition-all duration-300">
      {/* Left side: Album Cover Style Thumbnail */}
      <div className="relative w-full md:w-56 shrink-0 aspect-video md:aspect-auto md:h-36 bg-black rounded-md overflow-hidden group">
        {summary.thumbnailUrl ? (
          <img
            src={summary.thumbnailUrl}
            alt={summary.videoTitle}
            className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-600 bg-slate-900">
            Sem Thumbnail
          </div>
        )}
        
        {/* Time Saved Badge Overlay */}
        <div className="absolute top-2 left-2 bg-[#1DB954] text-black text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1">
          <Clock size={10} />
          <span>⚡ Poupou {summary.timeSavedMinutes}m</span>
        </div>
        
        {/* Overlay Hover to Original Video */}
        <a
          href={summary.videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300 text-white"
        >
          <div className="p-2 bg-black/80 backdrop-blur rounded-full flex items-center gap-1 shadow-lg hover:scale-105 transition-transform text-xs font-bold">
            <span>Abrir original</span>
            <ExternalLink size={12} />
          </div>
        </a>
      </div>

      {/* Right side: Track Info and Summary */}
      <div className="flex-1 mt-4 md:mt-0 md:pl-5 flex flex-col justify-between min-w-0">
        <div>
          {/* Header Info */}
          <div className="flex items-center gap-2 mb-1.5 text-xs text-slate-400">
            <span className="font-bold text-white bg-white/10 hover:bg-white/20 transition-colors px-2 py-0.5 rounded-md cursor-pointer">
              {summary.channelName}
            </span>
            <span className="text-slate-700">•</span>
            <div className="flex items-center gap-1 text-slate-400">
              <Calendar size={12} />
              <span>{formatDate(summary.publishedAt)}</span>
            </div>
          </div>

          {/* Video Title */}
          <h3 className="text-base font-bold text-white truncate hover:text-[#1DB954] transition-colors leading-tight pr-6" title={summary.videoTitle}>
            <a href={summary.videoUrl} target="_blank" rel="noopener noreferrer">
              {summary.videoTitle}
            </a>
          </h3>

          {/* Lyrics-Style Accordion Briefing Content */}
          <div 
            className={`transition-all duration-300 ease-in-out overflow-hidden ${
              isOpen ? 'max-h-[1500px] opacity-100 mt-4 p-4 bg-[#282828] border border-slate-700/30 rounded-lg' : 'max-h-0 opacity-0'
            }`}
          >
            <div 
              className="markdown-body text-slate-300"
              dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(summary.summary) }}
            />
          </div>
        </div>

        {/* Action Toggle Button */}
        <div className="mt-3 pt-2 flex items-center justify-between border-t border-white/5">
          <a
            href={summary.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1 transition-colors"
          >
            Assistir no YouTube
            <ExternalLink size={11} />
          </a>
          
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 transition-all duration-200 ${
              isOpen 
                ? 'bg-white/10 text-white border border-white/20' 
                : 'bg-[#1DB954]/10 border border-[#1DB954]/20 text-[#1DB954] hover:bg-[#1DB954]/20'
            }`}
            id={`toggle-${summary.videoId}`}
          >
            <span>{isOpen ? 'Esconder Briefing' : 'Ver Briefing de IA'}</span>
            {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>
      </div>
    </div>
  );
};
