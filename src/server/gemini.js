import { GoogleGenAI } from '@google/genai';
import { db } from './db.js';

// Get Gemini Client dynamically using either DB settings or system environment variables
function getGeminiClient() {
  const settings = db.getSettings();
  const apiKey = settings.geminiApiKey || process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('Chave de API do Gemini não configurada. Por favor, configure sua chave no painel de configurações.');
  }

  return new GoogleGenAI({ apiKey });
}

// Generate structured summary from transcript
export async function generateSummary(videoTitle, channelName, transcriptText) {
  try {
    const ai = getGeminiClient();
    const settings = db.getSettings();
    const customPrompt = settings.promptCustomization;

    // Calculate word count and estimate time saved
    const wordCount = transcriptText.split(/\s+/).filter(Boolean).length;
    // Average speech rate is ~140 words per minute. Reading summary takes ~1.5 minutes.
    const estimatedVideoDuration = Math.round(wordCount / 140);
    const timeSavedMinutes = Math.max(1, estimatedVideoDuration - 2);

    console.log(`Summarizing transcript for "${videoTitle}" (${wordCount} words). Est. Duration: ${estimatedVideoDuration} min.`);

    const systemInstruction = 
      "Você é um sintetizador de inteligência profissional. Seu objetivo é transformar a transcrição " +
      "de um vídeo do YouTube em um briefing executivo matinal, de leitura ultra-rápida, rico em detalhes relevantes e livre de enrolação.";

    const prompt = `
O vídeo a seguir chama-se "${videoTitle}" e foi publicado pelo canal "${channelName}".
Abaixo está a transcrição das legendas capturadas do vídeo.

Por favor, crie um resumo estruturado utilizando exatamente esta estrutura em Markdown em português do Brasil:

### 💡 A Ideia Central
[Escreva um único parágrafo curto e de alto impacto resumindo o propósito principal deste vídeo. O que ele está ensinando ou revelando?]

### 📌 Principais Aprendizados e Insights
- **[Título do Insight 1]**: [Explicação profunda e direta contendo fatos ou dados específicos citados no vídeo]
- **[Título do Insight 2]**: [Explicação direta e detalhada]
- **[Título do Insight 3]**: [Explicação direta e detalhada]
- **[Título do Insight 4]**: [Explicação direta e detalhada]
[Adicione mais tópicos se o vídeo for longo ou denso, limite a 6 no total]

### 🧠 Glossário e Conceitos Citados
- **[Conceito/Termo 1]**: [Breve definição de como foi usado no vídeo]
- **[Conceito/Termo 2]**: [Breve definição]

### 🚀 Ação Recomendada (O que fazer a seguir)
- **[Ação]**: [Conselho prático ou aplicação baseada no que foi aprendido no vídeo]

---
Instruções Adicionais de Personalização do Usuário:
"${customPrompt}"

---
Transcrição do Vídeo:
${transcriptText}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.2, // Low temperature for high factual accuracy
      }
    });

    const summaryText = response.text;

    if (!summaryText) {
      throw new Error('Retorno vazio do modelo Gemini.');
    }

    return {
      summary: summaryText,
      timeSavedMinutes
    };
  } catch (error) {
    console.error('Error generating summary from Gemini:', error);
    throw new Error(`Erro na síntese com Inteligência Artificial: ${error.message}`);
  }
}
