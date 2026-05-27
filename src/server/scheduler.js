import cron from 'node-cron';
import { db } from './db.js';
import { getLatestVideos, fetchTranscript } from './youtube.js';
import { generateSummary } from './gemini.js';

let activeCronJob = null;
let isSyncing = false;

// Core function to synchronize all subscribed channels
export async function syncAllChannels() {
  if (isSyncing) {
    console.log('Sync already in progress. Skipping.');
    return { success: false, message: 'Sincronização já está em andamento.' };
  }

  isSyncing = true;
  console.log('--- STARTING MATINAL YOUTUBE SYNC AGENT ---');
  
  const channels = db.getChannels();
  const existingSummaries = db.getSummaries();
  const existingIds = new Set(existingSummaries.map(s => s.videoId));
  
  let newVideosCount = 0;
  let successCount = 0;
  let failCount = 0;
  const errors = [];

  if (channels.length === 0) {
    isSyncing = false;
    console.log('No channels configured to sync.');
    return { success: true, message: 'Nenhum canal cadastrado para sincronizar.', added: 0 };
  }

  try {
    for (const channel of channels) {
      console.log(`Processing channel: ${channel.name} (${channel.id})`);
      const videos = await getLatestVideos(channel.id);
      
      // Limit to videos from the last 48 hours to keep it strictly matinal / fresh
      const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
      const freshVideos = videos.filter(video => {
        const pubDate = new Date(video.publishedAt);
        return pubDate >= fortyEightHoursAgo;
      });

      console.log(`Found ${videos.length} total videos, ${freshVideos.length} published in the last 48h.`);

      for (const video of freshVideos) {
        if (existingIds.has(video.videoId)) {
          console.log(`Video ${video.videoId} (${video.title}) already summarized. Skipping.`);
          continue;
        }

        newVideosCount++;
        console.log(`New video found: "${video.title}" (ID: ${video.videoId})`);

        try {
          // 1. Fetch transcript
          const transcript = await fetchTranscript(video.videoId);
          
          // 2. Generate summary using Gemini AI
          const aiResult = await generateSummary(video.title, video.channelName, transcript);
          
          // 3. Save to database
          const summaryRecord = {
            videoId: video.videoId,
            videoTitle: video.title,
            channelId: video.channelId,
            channelName: video.channelName,
            publishedAt: video.publishedAt,
            thumbnailUrl: video.thumbnailUrl,
            videoUrl: video.videoUrl,
            summary: aiResult.summary,
            timeSavedMinutes: aiResult.timeSavedMinutes,
            syncedAt: new Date().toISOString()
          };

          db.addSummary(summaryRecord);
          successCount++;
          console.log(`Successfully summarized: "${video.title}"`);
        } catch (videoError) {
          failCount++;
          const errMsg = `Erro no vídeo "${video.title}": ${videoError.message}`;
          console.error(errMsg);
          errors.push(errMsg);
        }
      }
    }
  } catch (globalError) {
    console.error('Global error during channel sync:', globalError);
    errors.push(`Erro geral de sincronização: ${globalError.message}`);
  } finally {
    isSyncing = false;
  }

  console.log(`--- SYNC COMPLETED ---`);
  console.log(`Total new videos processed: ${newVideosCount}`);
  console.log(`Successful summaries: ${successCount}`);
  console.log(`Failed: ${failCount}`);

  return {
    success: errors.length === 0 || successCount > 0,
    message: `Sincronização concluída. ${successCount} novos resumos gerados. ${failCount} falhas.`,
    added: successCount,
    failed: failCount,
    errors
  };
}

// Start/restart the Cron scheduler based on DB settings
export function startScheduler() {
  const settings = db.getSettings();
  const scheduleHour = settings.scheduleHour || '07:00';
  const [hour, minute] = scheduleHour.split(':');
  
  // Standard cron syntax: "minute hour * * *" runs every day at specified hour:minute
  const cronExpression = `${minute} ${hour} * * *`;
  
  if (activeCronJob) {
    activeCronJob.stop();
    console.log('Previous cron schedule stopped.');
  }

  console.log(`Scheduling morning agent to run daily at ${scheduleHour} (Cron: "${cronExpression}")`);
  
  activeCronJob = cron.schedule(cronExpression, async () => {
    console.log(`[MATINAL CRON TRIGGERED] Running daily morning briefing...`);
    try {
      await syncAllChannels();
    } catch (err) {
      console.error('Error running daily cron sync:', err);
    }
  });

  activeCronJob.start();
}

// Utility to check if currently syncing
export function getSyncStatus() {
  return { isSyncing };
}
