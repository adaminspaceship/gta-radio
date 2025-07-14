# TTS Audio Sync

A web application that synchronizes text-to-speech audio with background music, ensuring the TTS ends at exactly 22.5 seconds.

## Features

- **ElevenLabs TTS Integration**: Generate high-quality text-to-speech audio using ElevenLabs API
- **Perfect Synchronization**: Automatically calculates timing to ensure TTS ends at exactly 22.5 seconds
- **Multiple Voice Options**: Choose from 6 different ElevenLabs voices
- **Real-time Progress**: Visual progress bar showing playback status
- **Modern UI**: Clean, responsive design with smooth animations
- **API Key Storage**: Saves your API key locally for convenience

## Requirements

1. **ElevenLabs API Key**: You'll need an account and API key from [ElevenLabs](https://elevenlabs.io/)
2. **Audio File**: A `song.mp3` file in the same directory as the HTML file
3. **Modern Web Browser**: Chrome, Firefox, Safari, or Edge (latest versions)

## Setup

1. **Clone or Download**: Get all the files (`index.html`, `styles.css`, `script.js`)
2. **Add Music**: Place your `song.mp3` file in the same directory
3. **Get API Key**: 
   - Sign up at [ElevenLabs](https://elevenlabs.io/)
   - Go to your profile and copy your API key
4. **Open in Browser**: Open `index.html` in your web browser

## How to Use

1. **Enter API Key**: Paste your ElevenLabs API key in the API key field
2. **Enter Text**: Type the text you want to convert to speech
3. **Select Voice**: Choose from the available voice options
4. **Generate TTS**: Click "Generate TTS" to create the audio
5. **Review Timing**: The app will show:
   - TTS duration
   - Calculated start delay
6. **Play**: Click "Play Synchronized Audio" to start both audio tracks

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

3. **Audio not synchronized**
   - This is usually caused by browser audio policies
   - Try clicking the page before playing audio

### Browser Compatibility

- **Chrome**: Full support
- **Firefox**: Full support
- **Safari**: Full support (may require user interaction first)
- **Edge**: Full support

## Privacy & Security

- API keys are stored locally in your browser
- No data is sent to external servers except ElevenLabs
- Audio files are processed locally

## API Credits

This application uses the ElevenLabs API. Each TTS generation uses credits from your ElevenLabs account. Monitor your usage through your ElevenLabs dashboard.

## License

This project is open source and available under the MIT License. 