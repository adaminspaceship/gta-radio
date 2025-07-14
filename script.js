class TTSAudioSync {
    constructor() {
        this.initElements();
        this.bindEvents();
        this.ttsAudioBlob = null;
        this.ttsDuration = 0;
        this.targetEndTime = 22.5; // TTS should end at 22.5 seconds
        this.musicShouldContinue = true; // Music continues after TTS ends
        this.isPlaying = false;
        this.startTime = 0;
        this.animationFrame = null;
        this.ttsTimeout = null;
        this.musicDuration = 0;
        this.ttsStoppedAt22 = false;
        
        // Load API key from localStorage if available
        const savedApiKey = localStorage.getItem('elevenlabs_api_key');
        if (savedApiKey) {
            this.apiKeyInput.value = savedApiKey;
        }
    }
    
    initElements() {
        this.textInput = document.getElementById('textInput');
        this.apiKeyInput = document.getElementById('apiKey');
        this.voiceSelect = document.getElementById('voiceSelect');
        this.generateButton = document.getElementById('generateTTS');
        this.playButton = document.getElementById('playButton');
        this.stopButton = document.getElementById('stopButton');
        this.status = document.getElementById('status');
        this.ttsInfo = document.getElementById('ttsInfo');
        this.ttsDurationSpan = document.getElementById('ttsDuration');
        this.startDelaySpan = document.getElementById('startDelay');
        this.progressFill = document.getElementById('progressFill');
        this.progressTime = document.getElementById('progressTime');
        this.musicAudio = document.getElementById('musicAudio');
        this.ttsAudio = document.getElementById('ttsAudio');
        
        this.status.className = 'status ready';
        this.status.textContent = 'Ready';
    }
    
    bindEvents() {
        this.generateButton.addEventListener('click', () => this.generateTTS());
        this.playButton.addEventListener('click', () => this.playSyncedAudio());
        this.stopButton.addEventListener('click', () => this.stopAudio());
        
        // Save API key to localStorage when changed
        this.apiKeyInput.addEventListener('input', () => {
            localStorage.setItem('elevenlabs_api_key', this.apiKeyInput.value);
        });
        
        // Audio event listeners - music continues after TTS ends
        this.musicAudio.addEventListener('ended', () => this.onMusicEnded());
        this.ttsAudio.addEventListener('ended', () => this.onTTSEnded());
        
        // Handle audio loading
        this.musicAudio.addEventListener('loadedmetadata', () => {
            console.log('Music duration:', this.musicAudio.duration);
            this.musicDuration = this.musicAudio.duration;
            
            // Update progress display with actual duration
            const totalMinutes = Math.floor(this.musicDuration / 60);
            const totalSeconds = Math.floor(this.musicDuration % 60);
            this.progressTime.textContent = `0:00 / ${totalMinutes}:${totalSeconds.toString().padStart(2, '0')}`;
            
            if (this.musicAudio.duration < this.targetEndTime) {
                console.warn(`Music duration (${this.musicAudio.duration}s) is shorter than target end time (${this.targetEndTime}s)`);
            }
        });
    }
    
    updateStatus(message, type = 'ready') {
        this.status.textContent = message;
        this.status.className = `status ${type}`;
    }
    
    async generateTTS() {
        const text = this.textInput.value.trim();
        const apiKey = this.apiKeyInput.value.trim();
        const voiceId = this.voiceSelect.value;
        
        if (!text) {
            this.updateStatus('Please enter some text', 'error');
            return;
        }
        
        if (!apiKey) {
            this.updateStatus('Please enter your ElevenLabs API key', 'error');
            return;
        }
        
        this.generateButton.disabled = true;
        this.updateStatus('Generating TTS...', 'loading');
        
        try {
            const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
                method: 'POST',
                headers: {
                    'Accept': 'audio/mpeg',
                    'Content-Type': 'application/json',
                    'xi-api-key': apiKey
                },
                body: JSON.stringify({
                    text: text,
                    model_id: 'eleven_multilingual_v2',
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.5
                    }
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const audioBlob = await response.blob();
            this.ttsAudioBlob = audioBlob;
            
            // Create audio URL and load it
            const audioUrl = URL.createObjectURL(audioBlob);
            this.ttsAudio.src = audioUrl;
            
            // Wait for audio to load to get duration
            await new Promise((resolve) => {
                this.ttsAudio.addEventListener('loadedmetadata', resolve, { once: true });
            });
            
            this.ttsDuration = this.ttsAudio.duration;
            this.calculateTiming();
            
            this.updateStatus('TTS generated successfully!', 'success');
            this.playButton.disabled = false;
            
        } catch (error) {
            console.error('Error generating TTS:', error);
            this.updateStatus('Error generating TTS. Check your API key and try again.', 'error');
        } finally {
            this.generateButton.disabled = false;
        }
    }
    
    calculateTiming() {
        // Calculate when to start TTS so it ends at exactly 22 seconds
        const startDelay = this.targetEndTime - this.ttsDuration;
        
        // Update UI
        this.ttsDurationSpan.textContent = this.ttsDuration.toFixed(2);
        this.startDelaySpan.textContent = startDelay.toFixed(2);
        this.ttsInfo.classList.remove('hidden');
        
        if (startDelay < 0) {
            this.updateStatus('Warning: TTS is longer than 22.5 seconds. It will be cut off.', 'error');
        }
    }
    
    async playSyncedAudio() {
        if (!this.ttsAudioBlob) {
            this.updateStatus('Please generate TTS first', 'error');
            return;
        }
        
        this.isPlaying = true;
        this.playButton.disabled = true;
        this.stopButton.disabled = false;
        this.updateStatus('Playing synchronized audio...', 'loading');
        
        // Reset audio positions and flags
        this.musicAudio.currentTime = 0;
        this.ttsAudio.currentTime = 0;
        this.ttsStoppedAt22 = false;
        
        // Start the music immediately
        try {
            await this.musicAudio.play();
        } catch (error) {
            console.error('Error playing music:', error);
            this.updateStatus('Error playing music file', 'error');
            this.stopAudio();
            return;
        }
        
        // Calculate delay for TTS
        const startDelay = this.targetEndTime - this.ttsDuration;
        this.startTime = Date.now();
        
        // Start progress animation
        this.updateProgress();
        
        // Start TTS after delay (if delay is positive)
        if (startDelay > 0) {
            this.ttsTimeout = setTimeout(async () => {
                if (this.isPlaying) {
                    try {
                        await this.ttsAudio.play();
                        console.log('TTS started at', startDelay, 'seconds');
                    } catch (error) {
                        console.error('Error playing TTS:', error);
                    }
                }
            }, startDelay * 1000);
        } else {
            // If TTS is longer than 22 seconds, start immediately
            try {
                await this.ttsAudio.play();
                console.log('TTS started immediately (longer than 22.5 seconds)');
                
                // Set up timeout to stop TTS at 22.5 seconds if it's too long
                this.ttsTimeout = setTimeout(() => {
                    if (this.isPlaying && !this.ttsAudio.paused) {
                        console.log('Stopping TTS at 22.5 seconds (was too long)');
                        this.ttsAudio.pause();
                    }
                }, this.targetEndTime * 1000);
            } catch (error) {
                console.error('Error playing TTS:', error);
            }
        }
    }
    
    updateProgress() {
        if (!this.isPlaying) return;
        
        const elapsed = (Date.now() - this.startTime) / 1000;
        const totalDuration = this.musicDuration || 30; // Default to 30 seconds if not loaded
        const progress = Math.min(elapsed / totalDuration, 1) * 100;
        
        this.progressFill.style.width = `${progress}%`;
        
        const minutes = Math.floor(elapsed / 60);
        const seconds = Math.floor(elapsed % 60);
        const totalMinutes = Math.floor(totalDuration / 60);
        const totalSeconds = Math.floor(totalDuration % 60);
        
        this.progressTime.textContent = 
            `${minutes}:${seconds.toString().padStart(2, '0')} / ${totalMinutes}:${totalSeconds.toString().padStart(2, '0')}`;
        
        // Stop TTS at exactly 22.5 seconds if it's still playing
        if (elapsed >= this.targetEndTime - 0.1 && !this.ttsStoppedAt22) {
            console.log('Reached 22.5 seconds, stopping TTS (music continues)');
            this.ttsAudio.pause();
            this.ttsStoppedAt22 = true;
            setTimeout(() => {
                this.updateStatus('TTS ended at 22.5 seconds - music continues', 'success');
            }, 100);
        }
        
        // Only stop everything when music actually ends or user stops it
        if (elapsed >= totalDuration - 0.1) {
            console.log('Music ended, stopping all audio');
            setTimeout(() => {
                this.updateStatus('Playback completed successfully!', 'success');
            }, 100);
            this.stopAudio();
        } else {
            this.animationFrame = requestAnimationFrame(() => this.updateProgress());
        }
    }
    
    stopAudio() {
        this.isPlaying = false;
        this.playButton.disabled = false;
        this.stopButton.disabled = true;
        
        // Stop all audio
        this.musicAudio.pause();
        this.ttsAudio.pause();
        
        // Clear timeouts and animation frames
        if (this.ttsTimeout) {
            clearTimeout(this.ttsTimeout);
            this.ttsTimeout = null;
        }
        
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        
        // Reset progress
        this.progressFill.style.width = '0%';
        const totalDuration = this.musicDuration || 30;
        const totalMinutes = Math.floor(totalDuration / 60);
        const totalSeconds = Math.floor(totalDuration % 60);
        this.progressTime.textContent = `0:00 / ${totalMinutes}:${totalSeconds.toString().padStart(2, '0')}`;
        
        this.updateStatus('Stopped', 'ready');
    }
    
    onMusicEnded() {
        // Music has naturally ended, stop everything
        console.log('Music ended naturally');
        this.stopAudio();
    }
    
    onTTSEnded() {
        // TTS has ended, but we continue until the full 22 seconds
        const elapsed = (Date.now() - this.startTime) / 1000;
        console.log('TTS ended at:', elapsed, 'seconds');
        // Don't stop here - let the timer handle stopping at 22 seconds
    }
    
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TTSAudioSync();
});

// Handle page visibility change to pause audio when tab is hidden
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Optionally pause audio when tab is hidden
        // You can uncomment the line below if you want this behavior
        // window.ttsSync?.stopAudio();
    }
}); 