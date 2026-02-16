import { NextResponse } from 'next/server';
import { YoutubeTranscript } from 'youtube-transcript';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': process.env.NEXTAUTH_URL || 'http://localhost:3000', // Optional, for including your app on openrouter.ai rankings
    'X-Title': 'React Auth Dashboard', // Optional. Shows in rankings on openrouter.ai.
  },
});

export async function POST(req: Request) {
  try {
    const { url, text } = await req.json();

    let transcriptText = text;

    // If no text provided but URL is, try to fetch transcript
    if (!transcriptText && url) {
      // Basic YouTube URL validation and ID extraction
      const videoIdMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      const videoId = videoIdMatch ? videoIdMatch[1] : null;

      console.log('Extracted Video ID:', videoId);

      if (!videoId) {
        return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
      }

      // If transcript fetch fails, try audio transcription fallback
      try {
        const transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' });
        if (!transcript || transcript.length === 0) {
          throw new Error('No transcript found');
        }
        transcriptText = transcript.map(item => item.text).join(' ');
      } catch (transcriptError) {
        console.log('Transcript fetch failed, attempting audio fallback...', transcriptError);

        try {
          // Initialize Innertube
          const { Innertube, UniversalCache, Utils } = require('youtubei.js');
          // Create temp directory if it doesn't exist
          const fs = require('fs');
          const path = require('path');
          const os = require('os');

          const youtube = await Innertube.create({
            cache: new UniversalCache(false),
            generate_session_locally: true
          });

          const info = await youtube.getInfo(videoId);
          // Get audio stream - prefer lowest quality to save bandwidth/processing for whisper
          const format = info.chooseFormat({ type: 'audio', quality: 'best' });

          if (!format) throw new Error('No audio format found');

          const tempFilePath = path.join(os.tmpdir(), `${videoId}.mp3`);
          console.log('Downloading audio to:', tempFilePath);

          const stream = await youtube.download(videoId, {
            type: 'audio',
            quality: 'best',
            format: 'mp4'
          });

          // Write stream to file
          const fileStream = fs.createWriteStream(tempFilePath);

          // Handle the web stream to node stream conversion
          const reader = stream.getReader();

          await new Promise((resolve, reject) => {
            const pump = async () => {
              const { done, value } = await reader.read();
              if (done) {
                fileStream.end();
                resolve(true);
                return;
              }
              fileStream.write(Buffer.from(value));
              pump();
            };
            pump().catch(reject);
            fileStream.on('error', reject);
          });

          console.log('Audio downloaded, starting transcription...');

          const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(tempFilePath),
            model: "whisper-1",
            response_format: "text",
          });

          console.log('Transcription complete.');
          transcriptText = transcription;

          // Cleanup
          fs.unlinkSync(tempFilePath);

        } catch (audioError) {
          console.error('Audio fallback failed:', audioError);

          // Fallback 3: Web Search for Video Context (Requires TAVILY_API_KEY)
          if (process.env.TAVILY_API_KEY) {
            try {
              console.log('Attempting web search fallback via Tavily...');
              const { tavily } = require('@tavily/core');
              const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });

              const searchResult = await tvly.search(url, {
                search_depth: "advanced",
                include_answer: true,
                max_results: 5
              });

              console.log('Tavily search complete.');

              let contextText = `Video URL: ${url}\n\n`;
              if (searchResult.answer) contextText += `AI Answer: ${searchResult.answer}\n\n`;

              if (searchResult.results && searchResult.results.length > 0) {
                contextText += "Search Results:\n";
                searchResult.results.forEach((res: any) => {
                  contextText += `- Title: ${res.title}\n  Content: ${res.content}\n  URL: ${res.url}\n\n`;
                });

                const systemPrompt = `You are an expert researcher. The user wants a summary of a YouTube video, but the video itself is inaccessible.
                      However, we have performed a web search for the video link.
                      
                      Based *only* on the search results below, provide a comprehensive summary of what this video is likely about.
                      Structure it as Study Notes if possible, or a detailed breakdown of the topic if specific video details are missing.
                      
                      If the search results are generic or irrelevant, honestly state that you couldn't find specific details about this video, but summarize the general topic if clear.`;

                const completion = await openai.chat.completions.create({
                  messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: contextText }
                  ],
                  model: 'openai/gpt-4o-mini',
                });

                return NextResponse.json({ content: completion.choices[0].message.content });
              }
            } catch (tavilyError) {
              console.error('Tavily search failed:', tavilyError);
            }
          }

          return NextResponse.json({ error: 'Failed to access video content. The video has no captions, audio is blocked, and no web search context could be found. Please use "Manual Text" mode.' }, { status: 422 });
        }
      }
    }

    if (!transcriptText) {
      return NextResponse.json({ error: 'URL or text is required.' }, { status: 400 });
    }

    // Truncate if too long
    const truncatedTranscript = transcriptText.substring(0, 20000);

    const prompt = `
      You are an elite AI Tutor and Study Assistant. Your task is to transform the following YouTube video transcript into **premium, high-clarity study notes**.
      The user wants "clean study notes" that are easy to skim, highly organized, and visually distinct.

      **Instructions:**
      1.  **Analyze** the transcript to understand the core message, key arguments, and supporting details.
      2.  **Structure** the output using the following Markdown format. **Do not deviate**.

      ---

      # [Video Title / Main Topic]

      ### 🎯 Executive Summary
      > *A concise, 2-3 sentence summary of the video's core value proposition and main conclusion.*

      ---

      ### 🗝️ Key Concepts & Definitions
      *List the most important terms/concepts. Use bold for terms and normal text for definitions.*
      *   **Term 1**: Definition...
      *   **Term 2**: Definition...

      ### 📝 Detailed Study Notes
      *Break down the content into logical sections. Use H4 headers (####) for sub-topics.*

      #### [Sub-Topic 1]
      *   Point 1
      *   Point 2 (with *italicized* nuance or **bold** emphasis)

      #### [Sub-Topic 2]
      *   Point 1...

      ### 💡 Important Takeaways
      *   ✅ Takeaway 1
      *   ✅ Takeaway 2
      *   ✅ Takeaway 3

      ### 🧠 Self-Assessment
      *   **Q:** Question 1?
          *   *A: Short answer.*
      *   **Q:** Question 2?
          *   *A: Short answer.*

      ---

      **Style Guidelines:**
      *   Use **clean, professional Markdown**.
      *   Use emojis sparingly but effectively to guide the eye (as shown above).
      *   Keep bullet points concise.
      *   **Bold** key phrases for skimmability.
      *   Avoid long, dense paragraphs.

      **Transcript:**
      ${truncatedTranscript}
    `;

    const completion = await openai.chat.completions.create({
      messages: [{ role: 'system', content: 'You are a helpful assistant.' }, { role: 'user', content: prompt }],
      model: 'openai/gpt-4o-mini',
    });

    const content = completion.choices[0].message.content;

    return NextResponse.json({ content });

  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
