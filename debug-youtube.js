const { YoutubeTranscript } = require('youtube-transcript');
const { Innertube, UniversalCache } = require('youtubei.js');
const fs = require('fs');
const path = require('path');
const os = require('os');
const OpenAI = require('openai');

const videoId = 'DeJk1cQtOzc';

async function testTranscript() {
    console.log('\n--- 1. Testing youtube-transcript ---');
    try {
        const transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' });
        if (!transcript || transcript.length === 0) {
            console.log('Result: Empty transcript (Expected for this video)');
        } else {
            console.log('Result: Success! Found ' + transcript.length + ' entries');
        }
    } catch (error) {
        console.log('Result: Failed as expected or error: ' + error.message);
    }
}

async function testInnertubeDownload() {
    console.log('\n--- 2. Testing youtubei.js Audio Download ---');
    try {
        const youtube = await Innertube.create({
            cache: new UniversalCache(false),
            generate_session_locally: true
        });

        console.log('Innertube initialized');

        const info = await youtube.getInfo(videoId);
        console.log('Video Title:', info.basic_info.title);

        const format = info.chooseFormat({ type: 'audio', quality: 'best' });
        if (!format) {
            console.error('Result: No audio format found');
            return null;
        }
        console.log('Audio format found:', format.mime_type);

        console.log('Attempting download...');
        const stream = await youtube.download(videoId, {
            type: 'audio',
            quality: 'best',
            format: 'mp4'
        });

        const tempFilePath = path.join(os.tmpdir(), `test-${videoId}.mp3`);
        const fileStream = fs.createWriteStream(tempFilePath);
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

        console.log('Result: Audio download successful to ' + tempFilePath);
        return tempFilePath;

    } catch (error) {
        console.error('Result: Audio download FAILED:', error.message);
        return null;
    }
}

async function testOpenAI(audioPath) {
    console.log('\n--- 3. Testing OpenAI Transcription ---');
    if (!process.env.OPENAI_API_KEY) {
        console.error('Result: SKIPPED - OPENAI_API_KEY not found in env');
        return;
    }

    if (!audioPath) {
        console.error('Result: SKIPPED - No audio file to transcribe');
        return;
    }

    try {
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        console.log('Sending to OpenAI Whisper...');
        // Only send first 10 seconds to save cost/time if possible, but hard to slice mp3 comfortably here without ffmpeg.
        // We'll just try to transcribe it.

        const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(audioPath),
            model: "whisper-1",
            response_format: "text",
        });

        console.log('Result: Transcription Successful! Length: ' + transcription.length);
    } catch (error) {
        console.error('Result: Transcription FAILED:', error.message);
    }
}

async function run() {
    console.log('Environment Check:');
    console.log('OPENAI_API_KEY present:', !!process.env.OPENAI_API_KEY);
    console.log('TAVILY_API_KEY present:', !!process.env.TAVILY_API_KEY);

    await testTranscript();
    const audioPath = await testInnertubeDownload();
    if (audioPath) {
        await testOpenAI(audioPath);
        // cleanup
        try { fs.unlinkSync(audioPath); } catch (e) { }
    }
}

run();
