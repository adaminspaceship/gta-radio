import { useState, useEffect, useRef, useCallback } from 'react';

// Custom hook for typing effect
const useTypingEffect = (textInputRef, isInputFocused, hasInputValue) => {
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const currentStringIndexRef = useRef(0);
  const currentCharIndexRef = useRef(0);
  
  const typingStrings = [
    "Noa and Jake split up because noa was too horny",
    "Ron caught his parents having sex in the bathroom",
  ];

  const typeNextChar = useCallback(() => {
    if (!isTyping || hasInputValue || isInputFocused) return;
    
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
  }, [isTyping, hasInputValue, isInputFocused, typingStrings]);

  const backspaceChar = useCallback(() => {
    if (!isTyping || hasInputValue || isInputFocused) return;
    
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
  }, [isTyping, hasInputValue, isInputFocused, typingStrings, typeNextChar]);

  const startTyping = useCallback(() => {
    if (!hasInputValue && !isInputFocused) {
      setIsTyping(true);
    }
  }, [hasInputValue, isInputFocused]);

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

// Custom hook for joke generation
const useJokeGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateJoke = useCallback(async (text) => {
    if (!text.trim()) {
      throw new Error('Please enter some text to transform into a joke');
    }

    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/joke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data.joke;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return { isGenerating, generateJoke };
};

// Custom hook for audio generation and download
const useAudioGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [fileName, setFileName] = useState('');

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

      // Create blob from response
      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `radio-joke-${timestamp}.wav`;
      
      setDownloadUrl(url);
      setFileName(filename);
      
      return { url, filename };
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const clearDownload = useCallback(() => {
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
      setFileName('');
    }
  }, [downloadUrl]);

  return { isGenerating, generateAudio, downloadUrl, fileName, clearDownload };
};

// Main Audio Generator Component
const TTSAudioSync = () => {
  const [inputText, setInputText] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [status, setStatus] = useState({ message: 'Ready to generate your radio joke audio', type: 'ready' });
  
  const textInputRef = useRef(null);
  
  // Custom hooks
  const { startTyping, stopTyping } = useTypingEffect(
    textInputRef, 
    isInputFocused, 
    inputText.trim() !== ''
  );
  
  const { 
    isGenerating: isGeneratingJoke, 
    generateJoke 
  } = useJokeGeneration();
  
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
    stopTyping();
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
    }
  };

  // Joke generation handler
  const handleGenerateJoke = async () => {
    try {
      setStatus({ message: 'Generating radio joke...', type: 'loading' });
      
      const joke = await generateJoke(inputText);
      setInputText(joke);
      
      if (textInputRef.current) {
        textInputRef.current.focus();
      }
      
      setStatus({ message: 'Radio joke generated successfully!', type: 'success' });
    } catch (error) {
      console.error('Error generating radio joke:', error);
      setStatus({ message: `Error generating radio joke: ${error.message}`, type: 'error' });
    }
  };

  // Audio generation handler
  const handleGenerateAudio = async () => {
    try {
      setStatus({ message: 'Generating 40-second mixed audio file...', type: 'loading' });
      clearDownload(); // Clear any previous download
      
      const result = await generateAudio(inputText);
      
      setStatus({ message: 'Audio generated successfully! Click download to save.', type: 'success' });
    } catch (error) {
      console.error('Error generating audio:', error);
      setStatus({ message: `Error generating audio: ${error.message}`, type: 'error' });
    }
  };

  // Download handler
  const handleDownload = () => {
    if (downloadUrl && fileName) {
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setStatus({ message: 'Download started!', type: 'success' });
    }
  };

  const isAnyGenerating = isGeneratingJoke || isGeneratingAudio;

  return (
    <div className="container">
      <h1>Radio Joke Generator</h1>
      
      <div className="input-section">
        <label htmlFor="textInput">Write a funny joke:</label>
        <textarea
          id="textInput"
          ref={textInputRef}
          value={inputText}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder="Enter your text here..."
          disabled={isAnyGenerating}
        />
        
        <div className="button-group">
          <button 
            className="secondary-button"
            onClick={handleGenerateJoke}
            disabled={isAnyGenerating || !inputText.trim()}
          >
            {isGeneratingJoke ? '🎙️ Generating...' : '🎙️ Make Radio Joke'}
          </button>
          
          <button 
            className="primary-button"
            onClick={handleGenerateAudio}
            disabled={isAnyGenerating || !inputText.trim()}
          >
            {isGeneratingAudio ? '🎵 Generating Audio...' : '🎵 Generate 40s Audio'}
          </button>
        </div>
      </div>
      
      {downloadUrl && (
        <div className="download-section">
          <div className="download-info">
            <h3>✅ Your audio is ready!</h3>
            <p>40-second mixed audio file with synchronized TTS and background music</p>
          </div>
          
          <button 
            className="download-button"
            onClick={handleDownload}
          >
            📥 Download {fileName}
          </button>
        </div>
      )}
      
      <div className={`status ${status.type}`}>
        {status.message}
      </div>
    </div>
  );
};

export default TTSAudioSync; 