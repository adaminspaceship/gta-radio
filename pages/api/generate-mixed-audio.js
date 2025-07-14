import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { parseBuffer } from 'music-metadata';
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
            role: "system",
            content: "You are a edgy, dark, and inappropriate radio host. Transform this text into a short edgy, dark, inappropriate and non-politically correct radio joke with a really nsfw punch at the end. Format it as if you're speaking directly to radio listeners, return no intros, just the joke itself. no more than 7 seconds."
          },
          {
            role: "user",
            content: `here is the text to transform into a radio jokes: "${text}"`
          }
    ],
    max_tokens: 150,
    temperature: 0.8,
  });

  return response.choices[0].message.content;
};

// Helper function to get audio duration using music-metadata
const getAudioDuration = async (filePath) => {
  try {
    const buffer = fs.readFileSync(filePath);
    const metadata = await parseBuffer(buffer);
    return metadata.format.duration || 0;
  } catch (error) {
    console.error('Error getting audio duration:', error);
    throw new Error('Failed to get audio duration');
  }
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

    // Step 5: Read TTS audio and prepare data for client-side mixing
    console.log('Preparing audio data for client-side mixing...');
    const ttsFileBuffer = fs.readFileSync(ttsFile);
    const musicBuffer = fs.readFileSync(musicFile);
    
    // Get music duration for reference
    const musicDuration = await getAudioDuration(musicFile);
    
    // Clean up temporary TTS file
    if (fs.existsSync(ttsFile)) {
      fs.unlinkSync(ttsFile);
    }

    // Return JSON response with audio data and mixing parameters
    const response = {
      ttsAudio: ttsFileBuffer.toString('base64'),
      musicAudio: musicBuffer.toString('base64'),
      ttsDuration: ttsDuration,
      musicDuration: musicDuration,
      startDelay: startDelay,
      targetEndTime: targetEndTime,
      mixingParams: {
        musicVolume: 0.3,
        ttsVolume: 1.0,
        totalDuration: 40
      }
    };

    res.setHeader('Content-Type', 'application/json');
    return res.json(response);

  } catch (error) {
    console.error('Error in audio mixing:', error);
    
    // Clean up temporary files on error
    if (fs.existsSync(ttsFile)) {
      fs.unlinkSync(ttsFile);
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