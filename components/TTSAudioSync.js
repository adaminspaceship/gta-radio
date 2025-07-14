import { useState, useEffect, useRef, useCallback } from 'react';

// Custom hook for typing effect
const useTypingEffect = (textInputRef, hasInputValue) => {
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const currentStringIndexRef = useRef(0);
  const currentCharIndexRef = useRef(0);
  
  const typingStrings = [
    "Our group is full of people who don't know shit about startups",
    "Noa and Jake split up because noa was too horny",
    "Ron caught his parents having sex in the bathroom",
  ];

  const typeNextChar = useCallback(() => {
    if (!isTyping || hasInputValue) return;
    
    const currentString = typingStrings[currentStringIndexRef.current];
    
    if (currentCharIndexRef.current < currentString.length) {
      // Typing forward
      const placeholder = currentString.substring(0, currentCharIndexRef.current + 1) + '|';
      if (textInputRef.current) {
        textInputRef.current.placeholder = placeholder;
      }
      currentCharIndexRef.current++;
      typingTimeoutRef.current = setTimeout(typeNextChar, 100);
    } else {
      // Pause then start backspacing
      typingTimeoutRef.current = setTimeout(backspaceChar, 2000);
    }
  }, [isTyping, hasInputValue, typingStrings]);

  const backspaceChar = useCallback(() => {
    if (!isTyping || hasInputValue) return;
    
    const currentString = typingStrings[currentStringIndexRef.current];
    
    if (currentCharIndexRef.current > 0) {
      // Backspacing
      currentCharIndexRef.current--;
      const placeholder = currentString.substring(0, currentCharIndexRef.current) + '|';
      if (textInputRef.current) {
        textInputRef.current.placeholder = placeholder;
      }
      typingTimeoutRef.current = setTimeout(backspaceChar, 50);
    } else {
      // Move to next string
      currentStringIndexRef.current = (currentStringIndexRef.current + 1) % typingStrings.length;
      typingTimeoutRef.current = setTimeout(typeNextChar, 100);
    }
  }, [isTyping, hasInputValue, typingStrings, typeNextChar]);

  const startTyping = useCallback(() => {
    if (!hasInputValue) {
      setIsTyping(true);
    }
  }, [hasInputValue]);

  const stopTyping = useCallback(() => {
    setIsTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (textInputRef.current) {
      textInputRef.current.placeholder = 'Enter your text here...';
    }
  }, []);

  useEffect(() => {
    if (isTyping) {
      typeNextChar();
    }
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [isTyping, typeNextChar]);

  return { startTyping, stopTyping };
};



// Custom hook for audio generation and download
const useAudioGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [fileName, setFileName] = useState('');

  // Client-side audio mixing using Web Audio API
  const mixAudioFiles = useCallback(async (audioData) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Decode audio data
    const ttsArrayBuffer = Uint8Array.from(atob(audioData.ttsAudio), c => c.charCodeAt(0)).buffer;
    const musicArrayBuffer = Uint8Array.from(atob(audioData.musicAudio), c => c.charCodeAt(0)).buffer;
    
    const ttsBuffer = await audioContext.decodeAudioData(ttsArrayBuffer);
    const musicBuffer = await audioContext.decodeAudioData(musicArrayBuffer);
    
    // Use the AudioContext's sample rate (usually 44100 or 48000)
    const sampleRate = audioContext.sampleRate;
    const outputBuffer = audioContext.createBuffer(2, 40 * sampleRate, sampleRate);
    
    console.log('Audio Context Sample Rate:', sampleRate);
    console.log('TTS Buffer Sample Rate:', ttsBuffer.sampleRate);
    console.log('Music Buffer Sample Rate:', musicBuffer.sampleRate);
    
    // Mix the audio with proper sample rate handling
    const startDelay = audioData.startDelay;
    const targetEndTime = audioData.targetEndTime;
    
    // Helper function to resample audio if needed
    const resampleAudio = (sourceBuffer, targetSampleRate) => {
      if (sourceBuffer.sampleRate === targetSampleRate) {
        return sourceBuffer;
      }
      
      const ratio = targetSampleRate / sourceBuffer.sampleRate;
      const newLength = Math.floor(sourceBuffer.length * ratio);
      const resampled = audioContext.createBuffer(
        sourceBuffer.numberOfChannels,
        newLength,
        targetSampleRate
      );
      
      for (let channel = 0; channel < sourceBuffer.numberOfChannels; channel++) {
        const sourceData = sourceBuffer.getChannelData(channel);
        const targetData = resampled.getChannelData(channel);
        
        for (let i = 0; i < newLength; i++) {
          const sourceIndex = i / ratio;
          const index = Math.floor(sourceIndex);
          const fraction = sourceIndex - index;
          
          if (index < sourceData.length - 1) {
            targetData[i] = sourceData[index] * (1 - fraction) + sourceData[index + 1] * fraction;
          } else if (index < sourceData.length) {
            targetData[i] = sourceData[index];
          }
        }
      }
      
      return resampled;
    };
    
    // Resample buffers to match output sample rate
    const resampledTTS = resampleAudio(ttsBuffer, sampleRate);
    const resampledMusic = resampleAudio(musicBuffer, sampleRate);
    
    // Add background music (reduced volume)
    for (let channel = 0; channel < outputBuffer.numberOfChannels; channel++) {
      const outputData = outputBuffer.getChannelData(channel);
      const musicData = resampledMusic.getChannelData(Math.min(channel, resampledMusic.numberOfChannels - 1));
      
      for (let i = 0; i < outputData.length && i < musicData.length; i++) {
        outputData[i] = musicData[i] * audioData.mixingParams.musicVolume;
      }
    }
    
    // Add TTS audio (with delay)
    const ttsStartSample = Math.floor(startDelay * sampleRate);
    const ttsEndSample = Math.floor(targetEndTime * sampleRate);
    
    for (let channel = 0; channel < outputBuffer.numberOfChannels; channel++) {
      const outputData = outputBuffer.getChannelData(channel);
      const ttsData = resampledTTS.getChannelData(Math.min(channel, resampledTTS.numberOfChannels - 1));
      
      for (let i = 0; i < ttsData.length; i++) {
        const outputIndex = ttsStartSample + i;
        if (outputIndex < outputData.length && outputIndex < ttsEndSample) {
          outputData[outputIndex] += ttsData[i] * audioData.mixingParams.ttsVolume;
        }
      }
    }
    
    // Convert to WAV format
    const wavData = audioBufferToWav(outputBuffer);
    return new Blob([wavData], { type: 'audio/wav' });
  }, []);

  const generateAudio = useCallback(async (text) => {
    if (!text.trim()) {
      throw new Error('Please enter some text');
    }

    setIsGenerating(true);
    setDownloadUrl(null);
    
    try {
      const response = await fetch('/api/generate-mixed-audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      // Get audio data and mixing parameters
      const audioData = await response.json();
      
      // Mix audio client-side
      const mixedBlob = await mixAudioFiles(audioData);
      
      // Create download URL
      const url = URL.createObjectURL(mixedBlob);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `radio-joke-${timestamp}.wav`;
      
      setDownloadUrl(url);
      setFileName(filename);
      
      return { url, filename };
    } finally {
      setIsGenerating(false);
    }
  }, [mixAudioFiles]);

  const clearDownload = useCallback(() => {
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
      setFileName('');
    }
  }, [downloadUrl]);

  return { isGenerating, generateAudio, downloadUrl, fileName, clearDownload };
};

// Helper function to convert AudioBuffer to WAV format
function audioBufferToWav(buffer) {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = buffer.length * blockAlign;
  const bufferSize = 44 + dataSize;
  
  const arrayBuffer = new ArrayBuffer(bufferSize);
  const view = new DataView(arrayBuffer);
  
  // WAV header
  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, bufferSize - 8, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);
  
  // Convert float samples to 16-bit PCM
  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
  }
  
  console.log('WAV created:', {
    sampleRate: sampleRate,
    channels: numChannels,
    duration: buffer.length / sampleRate,
    bufferSize: bufferSize
  });
  
  return arrayBuffer;
}

// Main Audio Generator Component
const TTSAudioSync = () => {
  const [inputText, setInputText] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [status, setStatus] = useState({ message: 'Ready to generate your radio joke audio', type: 'ready' });
  
  const textInputRef = useRef(null);
  
  // Custom hooks
  const { startTyping, stopTyping } = useTypingEffect(
    textInputRef, 
    inputText.trim() !== ''
  );
  
  const {
    isGenerating: isGeneratingAudio,
    generateAudio,
    downloadUrl,
    fileName,
    clearDownload
  } = useAudioGeneration();

  // Start typing effect on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      startTyping();
    }, 1000);
    return () => clearTimeout(timer);
  }, [startTyping]);

  // Handle input focus/blur for typing effect
  const handleInputFocus = () => {
    setIsInputFocused(true);
    // Ensure typing continues if no text is present
    if (inputText.trim() === '') {
      startTyping();
    }
  };

  const handleInputBlur = () => {
    setIsInputFocused(false);
    if (inputText.trim() === '') {
      setTimeout(() => {
        startTyping();
      }, 500);
    }
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (e.target.value.trim() !== '') {
      stopTyping();
    } else {
      // If text is cleared, restart typing immediately
      startTyping();
    }
  };

  // Audio generation handler
  const handleGenerateAudio = async () => {
    try {
      setStatus({ message: 'Generating radio joke and mixing 40-second audio file...', type: 'loading' });
      clearDownload(); // Clear any previous download
      
      const result = await generateAudio(inputText);
      
              setStatus({ message: 'Audio generated successfully! Click share to send.', type: 'success' });
    } catch (error) {
      console.error('Error generating audio:', error);
      setStatus({ message: `Error generating audio: ${error.message}`, type: 'error' });
    }
  };

  // Share handler with iOS native sharing
  const handleShare = async () => {
    if (!downloadUrl || !fileName) return;
    
    try {
      // Check if Web Share API is supported
      if (navigator.share) {
        // Convert blob URL to actual blob for sharing
        const response = await fetch(downloadUrl);
        const blob = await response.blob();
        
        // Create File object for sharing
        const file = new File([blob], fileName, { type: 'audio/wav' });
        
        // Try to share with file first
        try {
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: 'Radio Joke Audio',
              text: 'Check out this radio joke I generated!',
              files: [file]
            });
            
            setStatus({ message: 'Shared successfully!', type: 'success' });
            return;
          }
        } catch (fileShareError) {
          console.log('File sharing not supported, trying text share:', fileShareError);
        }
        
        // If file sharing fails, try sharing just text with a link
        try {
          await navigator.share({
            title: 'Radio Joke Audio',
            text: 'Check out this radio joke I generated on https://gta-radio-nu.vercel.app/!',
            url: window.location.href
          });
          
          setStatus({ message: 'Shared successfully! (File sharing not supported on this device)', type: 'success' });
          return;
        } catch (textShareError) {
          console.log('Text sharing also failed:', textShareError);
          
          // Check if user cancelled
          if (textShareError.name === 'AbortError') {
            setStatus({ message: 'Share cancelled', type: 'ready' });
            return;
          }
        }
      }
      
      // If Web Share API is not supported, show an error
      setStatus({ message: 'Sharing not supported on this device', type: 'error' });
      
    } catch (error) {
      console.error('Share failed:', error);
      
      // Check if user cancelled (AbortError)
      if (error.name === 'AbortError') {
        setStatus({ message: 'Share cancelled', type: 'ready' });
        return;
      }
      
      setStatus({ message: 'Share failed', type: 'error' });
    }
  };

  return (
    <div className="container">
      <h1>Radio Generator</h1>
      
      <div className="input-section">
        <label htmlFor="textInput">Give me a situation, I'll make the joke:</label>
        <textarea
          id="textInput"
          ref={textInputRef}
          value={inputText}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder="Enter your text here..."
          disabled={isGeneratingAudio}
        />
        
        <div className="button-group">
          <button 
            className="primary-button"
            onClick={handleGenerateAudio}
            disabled={isGeneratingAudio || !inputText.trim()}
          >
            {isGeneratingAudio ? '🎵 Generating Audio...' : '🎵 Generate Audio'}
          </button>
        </div>
      </div>
      
      {downloadUrl && (
        <div className="download-section">
          <div className="download-info">
            <h3>✅ Your audio is ready!</h3>
          </div>
          
          <div className="action-buttons">
            <button 
              className="share-button"
              onClick={handleShare}
            >
              📤 Share
            </button>
          </div>
        </div>
      )}
      
      <div className={`status ${status.type}`}>
        {status.message}
      </div>
    </div>
  );
};

export default TTSAudioSync; 