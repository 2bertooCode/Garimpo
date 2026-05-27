import Parser from 'rss-parser';
import { YoutubeTranscript } from 'youtube-transcript';

const parser = new Parser();

// Helper to resolve any YouTube channel URL or handle into a Channel ID (UC...)
export async function resolveChannelId(urlOrHandle) {
  let url = urlOrHandle.trim();
  
  // Clean up handle input if they just type "@channelname"
  if (url.startsWith('@')) {
    url = `https://www.youtube.com/${url}`;
  } else if (!url.startsWith('http')) {
    url = `https://www.youtube.com/@${url}`;
  }

  // If the input is already a Channel ID
  const directIdMatch = url.match(/(UC[a-zA-Z0-9_-]{22})/);
  if (directIdMatch && urlOrHandle.length === 24) {
    return { id: directIdMatch[1], handle: urlOrHandle };
  }

  try {
    console.log(`Resolving channel URL: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });

    if (!response.ok) {
      throw new Error(`Canal não encontrado ou erro de conexão (HTTP ${response.status})`);
    }

    const html = await response.text();

    // Regex candidates to find Channel ID in the page HTML
    const idRegexes = [
      /<meta itemprop="channelId" content="(UC[a-zA-Z0-9_-]{22})"/i,
      /<link rel="canonical" href="https:\/\/www\.youtube\.com\/channel\/(UC[a-zA-Z0-9_-]{22})"/i,
      /href="https:\/\/www\.youtube\.com\/channel\/(UC[a-zA-Z0-9_-]{22})"/i,
      /"channelId":"(UC[a-zA-Z0-9_-]{22})"/i
    ];

    for (const regex of idRegexes) {
      const match = html.match(regex);
      if (match && match[1]) {
        console.log(`Successfully resolved Channel ID: ${match[1]}`);
        
        // Also extract channel title/name from the HTML
        let channelName = 'Canal do YouTube';
        const titleMatch = html.match(/<meta property="og:title" content="([^"]+)">/i) || 
                           html.match(/<title>([^<]+) - YouTube<\/title>/i) ||
                           html.match(/<title>([^<]+)<\/title>/i);
        if (titleMatch && titleMatch[1]) {
          channelName = titleMatch[1].trim();
        }

        // Get channel avatar if available
        let avatarUrl = '';
        const avatarMatch = html.match(/<meta property="og:image" content="([^"]+)">/i);
        if (avatarMatch && avatarMatch[1]) {
          avatarUrl = avatarMatch[1];
        }

        return { id: match[1], name: channelName, avatarUrl };
      }
    }

    throw new Error('Não foi possível encontrar o ID do canal no código HTML da página. Certifique-se de que o link está correto.');
  } catch (error) {
    console.error('Error resolving channel ID:', error);
    throw new Error(`Erro ao buscar o canal: ${error.message}`);
  }
}

// Fetch latest videos for a specific channel ID via public RSS feed
export async function getLatestVideos(channelId) {
  const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
  
  try {
    console.log(`Fetching RSS feed for channel: ${channelId}`);
    const feed = await parser.parseURL(feedUrl);
    
    return feed.items.map(item => {
      // The video ID is in the link (v=VIDEO_ID) or in the id field (yt:video:VIDEO_ID)
      const videoIdMatch = item.link?.match(/v=([a-zA-Z0-9_-]{11})/) || item.id?.match(/yt:video:([a-zA-Z0-9_-]{11})/);
      const videoId = videoIdMatch ? videoIdMatch[1] : '';
      
      return {
        videoId,
        title: item.title,
        videoUrl: item.link || `https://www.youtube.com/watch?v=${videoId}`,
        publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
        thumbnailUrl: videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : '',
        channelName: feed.title || 'Canal do YouTube',
        channelId
      };
    });
  } catch (error) {
    console.error(`Error reading RSS for channel ${channelId}:`, error);
    return [];
  }
}

// Download transcript for a YouTube video with language fallbacks
export async function fetchTranscript(videoId) {
  try {
    console.log(`Downloading transcript for video ID: ${videoId}`);
    
    // Attempt 1: Try in Portuguese
    try {
      const parts = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'pt' });
      if (parts && parts.length > 0) {
        return parts.map(p => p.text).join(' ');
      }
    } catch (ptError) {
      console.log(`Could not fetch transcript in Portuguese, trying default... (${ptError.message})`);
    }

    // Attempt 2: Fetch default transcript (auto-detected or primary language)
    const parts = await YoutubeTranscript.fetchTranscript(videoId);
    if (parts && parts.length > 0) {
      return parts.map(p => p.text).join(' ');
    }

    throw new Error('Nenhuma transcrição encontrada neste vídeo.');
  } catch (error) {
    console.error(`Failed to get transcript for ${videoId}:`, error);
    throw new Error(`Erro ao obter a legenda/transcrição do vídeo: ${error.message}`);
  }
}
