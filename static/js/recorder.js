// Recorder.js - A simple recorder for capturing audio in the browser

class AudioRecorder {
    constructor(options = {}) {
        this.options = Object.assign({
            mimeType: 'audio/webm',
            audioBitsPerSecond: 128000
        }, options);
        
        this.mediaRecorder = null;
        this.stream = null;
        this.chunks = [];
        this.audioBlob = null;
        this.audioUrl = null;
        this.isRecording = false;
        
        // Callbacks
        this.onStart = null;
        this.onStop = null;
        this.onDataAvailable = null;
        this.onError = null;
    }
    
    /**
     * Request microphone access and prepare recorder
     */
    async init() {
        try {
            const constraints = { audio: true };
            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            
            // Create MediaRecorder instance
            this.mediaRecorder = new MediaRecorder(this.stream, this.options);
            
            // Set up event handlers
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.chunks.push(event.data);
                    
                    if (typeof this.onDataAvailable === 'function') {
                        this.onDataAvailable(event.data);
                    }
                }
            };
            
            this.mediaRecorder.onstop = () => {
                this.audioBlob = new Blob(this.chunks, { type: this.options.mimeType });
                this.audioUrl = URL.createObjectURL(this.audioBlob);
                this.isRecording = false;
                
                if (typeof this.onStop === 'function') {
                    this.onStop({
                        blob: this.audioBlob,
                        url: this.audioUrl
                    });
                }
            };
            
            return true;
        } catch (err) {
            console.error('Error initializing recorder:', err);
            if (typeof this.onError === 'function') {
                this.onError(err);
            }
            return false;
        }
    }
    
    /**
     * Start recording audio
     */
    start() {
        if (!this.mediaRecorder) {
            console.error('Recorder not initialized. Call init() first.');
            return false;
        }
        
        this.chunks = [];
        this.mediaRecorder.start(100); // Collect data every 100ms
        this.isRecording = true;
        
        if (typeof this.onStart === 'function') {
            this.onStart();
        }
        
        return true;
    }
    
    /**
     * Stop recording audio
     */
    stop() {
        if (!this.mediaRecorder || this.mediaRecorder.state !== 'recording') {
            console.error('Not recording.');
            return false;
        }
        
        this.mediaRecorder.stop();
        this.stopStream();
        
        return true;
    }
    
    /**
     * Stop all media tracks to release the microphone
     */
    stopStream() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
    }
    
    /**
     * Get the recorded audio as a Blob
     */
    getBlob() {
        return this.audioBlob;
    }
    
    /**
     * Get the URL for the recorded audio
     */
    getUrl() {
        return this.audioUrl;
    }
    
    /**
     * Convert Blob to base64 string
     */
    async blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }
    
    /**
     * Clean up resources
     */
    dispose() {
        this.stopStream();
        if (this.audioUrl) {
            URL.revokeObjectURL(this.audioUrl);
        }
        this.mediaRecorder = null;
        this.stream = null;
        this.chunks = [];
        this.audioBlob = null;
        this.audioUrl = null;
    }
}
