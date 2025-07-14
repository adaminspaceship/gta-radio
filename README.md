# Radio Joke Generator

A web application built with Next.js that generates downloadable 40-second mixed audio files with synchronized text-to-speech and background music. Perfect for creating radio-style comedy content!

## Features

- **Server-Side Audio Processing**: Complete audio mixing handled server-side using FFmpeg
- **ElevenLabs TTS Integration**: Generate high-quality text-to-speech audio using ElevenLabs API
- **Perfect Synchronization**: Automatically calculates timing to ensure TTS ends at exactly 22.5 seconds
- **AI-Powered Radio Jokes**: Uses OpenAI's ChatGPT-4o to transform any text into hilarious radio jokes with punchy endings
- **Custom Voice**: Always uses your pre-configured custom ElevenLabs voice for consistent audio quality
- **Native iOS Sharing**: One-tap sharing to Messages, Mail, AirDrop, and more with native iOS share sheet
- **Typing Animation**: Engaging typing effect with example prompts
- **Modern UI**: Clean, responsive design with smooth animations
- **Production Ready**: Optimized for deployment with proper security

## Architecture

This application uses a **hybrid client-server architecture** optimized for serverless deployment:

- **Client-Side (Next.js React)**: Handles UI, user interactions, Web Audio API mixing, and native sharing
- **Server-Side (Next.js API Routes)**: Manages secure API calls to ElevenLabs and OpenAI, returns audio data
- **Audio Processing**: Client-side mixing using Web Audio API (no FFmpeg required)
- **Static Assets**: Audio files served through Next.js public directory
- **Serverless Compatible**: Uses `/tmp` directory for temporary files, no system dependencies required

## Requirements

1. **Node.js 18+**: Required for Next.js development and deployment
2. **ElevenLabs API Key**: You'll need an account and API key from [ElevenLabs](https://elevenlabs.io/)
3. **OpenAI API Key**: You'll need an account and API key from [OpenAI](https://platform.openai.com/) for the radio joke feature
4. **Audio File**: A `song.mp3` file placed in the `public/` directory
5. **Modern Web Browser**: Supports Web Audio API (all modern browsers)

### Why No FFmpeg?

This application uses **client-side audio mixing** with the Web Audio API instead of server-side FFmpeg processing. This approach offers several advantages:

- ✅ **Serverless-friendly**: No system dependencies required
- ✅ **Better performance**: No heavy server-side processing
- ✅ **Scalable**: Offloads processing to the client
- ✅ **Universal compatibility**: Works on any hosting platform

## How It Works

### User Workflow
1. **Enter text** in the textbox (with engaging typing effect showing examples)
2. **Click "Generate 40s Audio"** to create the mixed audio file
3. **Choose your action**:
   - **Share** - Opens native iOS share sheet (Messages, Mail, AirDrop, etc.)
   - **Download** - Traditional download to device storage

### Behind the Scenes
- AI transforms your text into a hilarious radio joke
- ElevenLabs generates high-quality TTS audio
- Web Audio API mixes TTS with background music
- Perfect timing ensures TTS ends at exactly 22.5 seconds
- 40-second professional WAV file ready for sharing

## Local Development Setup

1. **Clone the Repository**:
   ```bash
   git clone <your-repo-url>
   cd tts-audio-sync
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Set Up Environment Variables**:
   ```bash
   cp env.example .env.local
   ```
   Then edit `.env.local` and add your API keys:
   ```
   ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. **Add Your Audio File**:
   - Place your `song.mp3` file in the `public/` directory
   - The file should be accessible at `http://localhost:3000/song.mp3`

5. **Run Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the application.

## Vercel Deployment

### Method 1: Automatic Deployment (Recommended)

1. **Connect Repository to Vercel**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your Git repository
   - Vercel will automatically detect it's a Next.js project

2. **Configure Environment Variables**:
   - In your Vercel project settings, go to "Environment Variables"
   - Add the following variables:
     ```
     ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
     OPENAI_API_KEY=your_openai_api_key_here
     ```

3. **Deploy**:
   - Vercel will automatically build and deploy
   - Every push to your main branch will trigger a new deployment

### Method 2: Manual Deployment

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Build for Production**:
   ```bash
   npm run build
   ```

3. **Deploy**:
   ```bash
   vercel
   ```
   Follow the prompts to configure your deployment.

## How to Use

1. **Enter Text**: Type the text you want to convert to speech
2. **Optional - Radio Joke**: Click "🎙️ Make Radio Joke" to transform your text into a funny 10-second radio joke with a punchy ending
3. **Generate TTS**: Click "Generate TTS" to create the audio using your custom voice
4. **Review Timing**: The app will show:
   - TTS duration
   - Calculated start delay
5. **Play**: Click "Play Synchronized Audio" to start both audio tracks

## Radio Joke Feature

The **🎙️ Make Radio Joke** button uses OpenAI's ChatGPT-4o to transform any text into a professional radio-style joke:

- **Input**: Any text or topic you want to make funny
- **Output**: A witty 10-second radio joke with a punchy ending
- **Style**: Clean, energetic, and radio-friendly format
- **Perfect for TTS**: Optimized for speech synthesis timing

### Example:
- **Input**: "I love pizza"
- **Output**: "You know you're obsessed with pizza when you consider pepperoni a vegetable... and honestly, I'm not arguing with that logic!"

## How Synchronization Works

The application uses a precise timing algorithm:

1. **Target End Time**: TTS must end at exactly 22.5 seconds
2. **Calculation**: `Start Delay = 22.5 seconds - TTS Duration`
3. **Playback**: 
   - Music starts immediately and plays to completion
   - TTS starts after the calculated delay
   - TTS ends at 22.5 seconds, music continues until it naturally ends

### Example Scenarios

- **TTS Duration: 5 seconds** → TTS starts at 17.5 seconds
- **TTS Duration: 10 seconds** → TTS starts at 12.5 seconds
- **TTS Duration: 25 seconds** → TTS starts immediately (will be cut off at 22.5 seconds)

## Project Structure

```
tts-audio-sync/
├── pages/
│   ├── api/
│   │   ├── tts.js              # ElevenLabs TTS API endpoint
│   │   └── joke.js             # OpenAI joke generation endpoint
│   ├── _app.js                 # Next.js app configuration
│   └── index.js                # Main page component
├── public/
│   ├── js/
│   │   └── client.js           # Client-side JavaScript
│   └── song.mp3                # Background music file
├── styles/
│   └── globals.css             # Global styles
├── package.json                # Dependencies and scripts
├── next.config.js              # Next.js configuration
├── vercel.json                 # Vercel deployment config
├── .gitignore                  # Git ignore rules
├── env.example                 # Environment variables template
└── README.md                   # This file
```

## API Endpoints

### POST `/api/tts`
Generates TTS audio using ElevenLabs API. The API key is configured server-side via environment variables.

**Request Body**:
```json
{
  "text": "Text to convert to speech",
  "voiceId": "voice_id_from_elevenlabs"
}
```

**Response**:
```json
{
  "success": true,
  "audioData": "base64_encoded_audio_data",
  "mimeType": "audio/mpeg"
}
```

### POST `/api/joke`
Generates radio joke using OpenAI's ChatGPT-4o. The API key is configured server-side via environment variables.

**Request Body**:
```json
{
  "text": "Text to transform into a joke"
}
```

**Response**:
```json
{
  "success": true,
  "joke": "Generated radio joke text"
}
```

## Troubleshooting

### Common Issues

1. **"Error generating TTS"** or **"ElevenLabs API key not configured on server"**
   - Ensure the `ELEVENLABS_API_KEY` environment variable is set in your deployment
   - Check your API key is correct in the environment variables
   - Ensure you have credits in your ElevenLabs account
   - Try with shorter text

2. **"Error playing music file"**
   - Ensure `song.mp3` is in the `public/` directory
   - Check the file format is supported (MP3 recommended)
   - Clear browser cache

3. **"Error generating radio joke"** or **"OpenAI API key not configured on server"**
   - Ensure the `OPENAI_API_KEY` environment variable is set in your deployment
   - Check your OpenAI API key is correct in the environment variables
   - Ensure you have credits in your OpenAI account
   - Make sure there's text in the input box to transform

4. **Build errors on Vercel**
   - Check that all environment variables are set
   - Ensure Node.js version is 18 or higher
   - Check the build logs for specific error messages

5. **Audio not synchronized**
   - This is usually caused by browser audio policies
   - Try clicking the page before playing audio
   - Check browser console for errors

### Development Tips

- **Local API Testing**: Use `curl` or Postman to test API endpoints
- **Environment Variables**: Never commit `.env.local` to git
- **Audio Files**: Keep audio files under 10MB for better performance
- **Browser Compatibility**: Test on different browsers for audio support

## Security Notes

- **API Keys**: All API keys are stored securely in server-side environment variables and never exposed to the client
- **Zero Client-Side API Keys**: The client never handles or stores API keys - all external API calls are made server-side
- **CORS**: API endpoints are configured to accept requests from the same origin only
- **Environment Variables**: Sensitive data is stored in environment variables and never committed to version control
- **Client-Side Storage**: Only non-sensitive preferences are stored in localStorage

## Performance Optimizations

- **Audio Caching**: Audio files are cached with proper headers
- **API Timeouts**: Server-side API calls have 30-second timeout
- **Bundle Size**: Next.js automatically optimizes JavaScript bundles
- **Static Assets**: Audio files are served efficiently through Vercel CDN

## Browser Compatibility

- **Chrome**: Full support
- **Firefox**: Full support
- **Safari**: Full support (may require user interaction first)
- **Edge**: Full support
- **Mobile**: Responsive design works on mobile devices

## API Credits

This application uses both ElevenLabs and OpenAI APIs:
- **ElevenLabs**: Each TTS generation uses credits from your ElevenLabs account
- **OpenAI**: Each radio joke generation uses credits from your OpenAI account

Monitor your usage through your respective API dashboards.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally
5. Submit a pull request

## License

This project is open source and available under the MIT License.

## Support

For issues and questions:
- Check the troubleshooting section above
- Review the API documentation for ElevenLabs and OpenAI
- Open an issue on GitHub with detailed error messages 