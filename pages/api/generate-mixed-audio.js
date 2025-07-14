import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { promisify } from 'util';
import OpenAI from 'openai';

const customVoiceId = 'FZNbEQJ9Bfg4l9TcIplH';

// Helper function to generate a radio joke using OpenAI
const generateRadioJoke = async (text) => {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
  });

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are a radio comedy writer. Transform the user\'s input into a hilarious, punchy radio joke that takes about 10 seconds to read aloud. Make it sound like something you\'d hear on a morning radio show - witty, clever, and with a strong punchline. Keep it clean and appropriate for broadcast radio.'
      },
      {
        role: 'user',
        content: text
      }
    ],
    max_tokens: 150,
    temperature: 0.8,
  });

  return response.choices[0].message.content;
};

// Helper function to run FFmpeg commands
const runFFmpeg = (args) => {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', args);
    
    let stderr = '';
    ffmpeg.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg exited with code ${code}: ${stderr}`));
      }
    });
  });
};

// Helper function to get audio duration
const getAudioDuration = async (filePath) => {
  return new Promise((resolve, reject) => {
    const ffprobe = spawn('ffprobe', [
      '-v', 'quiet',
      '-show_entries', 'format=duration',
      '-of', 'csv=p=0',
      filePath
    ]);
    
    let stdout = '';
    ffprobe.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    ffprobe.on('close', (code) => {
      if (code === 0) {
        const duration = parseFloat(stdout.trim());
        resolve(duration);
      } else {
        reject(new Error(`FFprobe exited with code ${code}`));
      }
    });
  });
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text } = req.body;
  
  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  const API_KEY = process.env.ELEVENLABS_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: 'ElevenLabs API key not configured' });
  }

  // Use /tmp directory for serverless environments (Vercel, AWS Lambda, etc.)
  const tempDir = '/tmp';
  const ttsFile = path.join(tempDir, `tts-${Date.now()}.mp3`);
  const musicFile = path.join(process.cwd(), 'public', 'song.mp3');
  const outputFile = path.join(tempDir, `mixed-${Date.now()}.wav`);

  try {
    // Note: /tmp directory always exists in serverless environments
    
    // Step 1: Generate radio joke
    console.log('Generating radio joke...');
    const jokeText = await generateRadioJoke(text);
    console.log('Generated joke:', jokeText);

    // Step 2: Generate TTS from joke
    console.log('Generating TTS from joke...');
    const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${customVoiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': API_KEY
      },
      body: JSON.stringify({
        text: jokeText,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8
        }
      })
    });

    if (!ttsResponse.ok) {
      throw new Error(`TTS generation failed: ${ttsResponse.status}`);
    }

    // Save TTS audio
    const ttsBuffer = await ttsResponse.buffer();
    fs.writeFileSync(ttsFile, ttsBuffer);
    
    // Step 3: Get TTS duration
    console.log('Getting TTS duration...');
    const ttsDuration = await getAudioDuration(ttsFile);
    console.log(`TTS duration: ${ttsDuration} seconds`);

    // Step 4: Calculate timing for synchronization
    const targetEndTime = 22.5;
    const startDelay = Math.max(0, targetEndTime - ttsDuration);
    console.log(`TTS will start at: ${startDelay} seconds`);

    // Step 5: Mix audio with FFmpeg
    console.log('Mixing audio...');
    
    // Create filter that handles both short and long TTS
    let filterComplex;
    if (startDelay > 0) {
      // TTS is short enough, delay it to end at 22.5 seconds
      filterComplex = `[0:a]volume=0.3,atrim=0:40[music];[1:a]adelay=${startDelay * 1000}|${startDelay * 1000}[tts_delayed];[music][tts_delayed]amix=inputs=2:duration=first[mixed]`;
    } else {
      // TTS is too long, trim it to fit exactly 22.5 seconds
      const ttsEndTime = 22.5;
      filterComplex = `[0:a]volume=0.3,atrim=0:40[music];[1:a]atrim=0:${ttsEndTime}[tts_trimmed];[music][tts_trimmed]amix=inputs=2:duration=first[mixed]`;
    }
    
    // Create 40-second output with background music and TTS
    const ffmpegArgs = [
      '-y', // Overwrite output file
      '-i', musicFile, // Input background music
      '-i', ttsFile, // Input TTS
      '-filter_complex', filterComplex,
      '-map', '[mixed]',
      '-t', '40', // Output duration 40 seconds
      '-c:a', 'pcm_s16le', // WAV format
      '-ar', '44100', // Sample rate
      outputFile
    ];

    await runFFmpeg(ffmpegArgs);

    // Step 6: Read the mixed audio file and send as response
    console.log('Sending mixed audio file...');
    const audioBuffer = fs.readFileSync(outputFile);
    
    // Clean up temporary files
    if (fs.existsSync(ttsFile)) {
      fs.unlinkSync(ttsFile);
    }
    if (fs.existsSync(outputFile)) {
      fs.unlinkSync(outputFile);
    }

    // Set response headers for file download
    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Content-Length', audioBuffer.length);
    res.setHeader('Content-Disposition', 'attachment; filename="radio-joke.wav"');
    
    return res.send(audioBuffer);

  } catch (error) {
    console.error('Error in audio mixing:', error);
    
    // Clean up temporary files on error
    if (fs.existsSync(ttsFile)) {
      fs.unlinkSync(ttsFile);
    }
    if (fs.existsSync(outputFile)) {
      fs.unlinkSync(outputFile);
    }
    
    return res.status(500).json({ 
      error: 'Failed to generate mixed audio', 
      details: error.message 
    });
  }
}

// Increase the body size limit for audio processing
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
    responseLimit: '50mb',
  },
}; 