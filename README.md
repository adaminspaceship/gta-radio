# TTS Audio Sync

A web application that synchronizes text-to-speech audio with background music, ensuring the TTS ends at exactly 22.5 seconds.

## Features

- **ElevenLabs TTS Integration**: Generate high-quality text-to-speech audio using ElevenLabs API
- **Perfect Synchronization**: Automatically calculates timing to ensure TTS ends at exactly 22.5 seconds
- **AI-Powered Radio Jokes**: Uses Grok AI to transform any text into hilarious 10-second radio jokes with punchy endings
- **Multiple Voice Options**: Choose from 6 different ElevenLabs voices
- **Real-time Progress**: Visual progress bar showing playback status
- **Modern UI**: Clean, responsive design with smooth animations
- **API Key Storage**: Saves your API keys locally for convenience

## Requirements

1. **ElevenLabs API Key**: You'll need an account and API key from [ElevenLabs](https://elevenlabs.io/)
2. **Grok API Key**: You'll need an account and API key from [X.AI](https://x.ai/) for the radio joke feature
3. **Audio File**: A `song.mp3` file in the same directory as the HTML file
4. **Modern Web Browser**: Chrome, Firefox, Safari, or Edge (latest versions)

## Setup

1. **Clone or Download**: Get all the files (`index.html`, `styles.css`, `script.js`)
2. **Add Music**: Place your `song.mp3` file in the same directory
3. **Get API Keys**: 
   - Sign up at [ElevenLabs](https://elevenlabs.io/) and copy your API key
   - Sign up at [X.AI](https://x.ai/) and copy your Grok API key
4. **Open in Browser**: Open `index.html` in your web browser

## How to Use

1. **Enter API Keys**: Paste your ElevenLabs and Grok API keys in the respective fields
2. **Enter Text**: Type the text you want to convert to speech
3. **Optional - Radio Joke**: Click "🎙️ Make Radio Joke" to transform your text into a funny 10-second radio joke with a punchy ending
4. **Select Voice**: Choose from the available voice options
5. **Generate TTS**: Click "Generate TTS" to create the audio
6. **Review Timing**: The app will show:
   - TTS duration
   - Calculated start delay
7. **Play**: Click "Play Synchronized Audio" to start both audio tracks

## Radio Joke Feature

The **🎙️ Make Radio Joke** button uses Grok AI to transform any text into a professional radio-style joke:

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
   - Music starts immediately
   - TTS starts after the calculated delay
   - Both end at the same time

### Example Scenarios

- **TTS Duration: 5 seconds** → TTS starts at 17.5 seconds
- **TTS Duration: 10 seconds** → TTS starts at 12.5 seconds
- **TTS Duration: 25 seconds** → TTS starts immediately (will be cut off at 22.5 seconds)

## File Structure

```
threejs/
├── index.html          # Main HTML file
├── styles.css          # CSS styling
├── script.js           # JavaScript functionality
├── song.mp3           # Your background music
└── README.md          # This file
```

## Troubleshooting

### Common Issues

1. **"Error generating TTS"**
   - Check your API key is correct
   - Ensure you have credits in your ElevenLabs account
   - Try with shorter text

2. **"Error playing music file"**
   - Ensure `song.mp3` is in the same directory
   - Check the file format is supported (MP3 recommended)

3. **"Error generating radio joke"**
   - Check your Grok API key is correct
   - Ensure you have credits in your X.AI account
   - Make sure there's text in the input box to transform

4. **Audio not synchronized**
   - This is usually caused by browser audio policies
   - Try clicking the page before playing audio

### Browser Compatibility

- **Chrome**: Full support
- **Firefox**: Full support
- **Safari**: Full support (may require user interaction first)
- **Edge**: Full support

## Privacy & Security

- API keys are stored locally in your browser
- No data is sent to external servers except ElevenLabs and X.AI (Grok)
- Audio files are processed locally
- Text sent to Grok is only used for joke generation

## API Credits

This application uses both ElevenLabs and Grok APIs:
- **ElevenLabs**: Each TTS generation uses credits from your ElevenLabs account
- **Grok**: Each radio joke generation uses credits from your X.AI account

Monitor your usage through your respective API dashboards.

## License

This project is open source and available under the MIT License. 