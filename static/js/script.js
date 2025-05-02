document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const loadingScreen = document.getElementById('loadingScreen');
    const mainContainer = document.getElementById('mainContainer');
    const loadingMessage = document.getElementById('loadingMessage');
    const loadingBar = document.getElementById('loadingBar');
    const recordButton = document.getElementById('recordButton');
    const stopButton = document.getElementById('stopButton');
    const micAnimation = document.getElementById('micAnimation');
    const waveformContainer = document.getElementById('waveformContainer');
    const playRecording = document.getElementById('playRecording');
    const clearRecording = document.getElementById('clearRecording');
    const translatingIndicator = document.getElementById('translatingIndicator');
    const resultsSection = document.getElementById('resultsSection');
    const sourceText = document.getElementById('sourceText');
    const translatedText = document.getElementById('translatedText');
    const audioOutput = document.getElementById('audioOutput');
    const detectedLanguage = document.getElementById('detectedLanguage');
    const errorSection = document.getElementById('errorSection');
    const errorMessage = document.getElementById('errorMessage');
    const newTranslationButton = document.getElementById('newTranslationButton');
    const targetLanguage = document.getElementById('targetLanguage');
    const audioFileUpload = document.getElementById('audioFileUpload');
    const uploadFileName = document.getElementById('uploadFileName');

    // Global variables
    let recorder = null;
    let audioBlob = null;
    let wavesurfer = null;
    let micStream = null;
    let isModelLoaded = false;
    let loadingProgress = 0;
    let loadingInterval = null;

    // Initialize WaveSurfer
    function initWaveSurfer() {
        wavesurfer = WaveSurfer.create({
            container: '#waveform',
            waveColor: '#8f94fb',
            progressColor: '#4e54c8',
            cursorColor: '#FF7E5F',
            height: 80,
            barWidth: 2,
            barGap: 1,
            responsive: true,
            normalize: true
        });

        wavesurfer.on('finish', function() {
            playRecording.innerHTML = '<i class="fas fa-play"></i> Play';
        });
    }

    // Initialize the recorder
    async function initRecorder() {
        try {
            const constraints = { audio: true };
            micStream = await navigator.mediaDevices.getUserMedia(constraints);
            
            const options = {
                mimeType: 'audio/webm',
                audioBitsPerSecond: 128000
            };
            
            const mediaRecorder = new MediaRecorder(micStream, options);
            let chunks = [];
            
            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunks.push(e.data);
                }
            };
            
            mediaRecorder.onstop = () => {
                audioBlob = new Blob(chunks, { type: 'audio/webm' });
                const audioUrl = URL.createObjectURL(audioBlob);
                
                // Load audio into wavesurfer
                wavesurfer.load(audioUrl);
                waveformContainer.classList.remove('d-none');
                
                // Enable play button
                playRecording.disabled = false;
            };
            
            recorder = mediaRecorder;
            return true;
        } catch (err) {
            console.error('Error initializing recorder:', err);
            showError(`Microphone access error: ${err.message}`);
            return false;
        }
    }

    // Start recording
    function startRecording() {
        if (!recorder || recorder.state === 'recording') return;
        
        // Reset UI
        hideResults();
        hideError();
        
        // Start recording
        recorder.start();
        
        // Update UI
        recordButton.classList.add('d-none');
        stopButton.classList.remove('d-none');
        micAnimation.classList.add('active');
    }

    // Stop recording
    function stopRecording() {
        if (!recorder || recorder.state !== 'recording') return;
        
        // Stop recording
        recorder.stop();
        
        // Update UI
        recordButton.classList.remove('d-none');
        stopButton.classList.add('d-none');
        micAnimation.classList.remove('active');
    }

    // Handle play button
    function togglePlayback() {
        if (!wavesurfer) return;
        
        if (wavesurfer.isPlaying()) {
            wavesurfer.pause();
            playRecording.innerHTML = '<i class="fas fa-play"></i> Play';
        } else {
            wavesurfer.play();
            playRecording.innerHTML = '<i class="fas fa-pause"></i> Pause';
        }
    }

    // Clear the recording
    function clearAudioRecording() {
        if (wavesurfer) {
            wavesurfer.empty();
        }
        audioBlob = null;
        waveformContainer.classList.add('d-none');
        hideResults();
        
        // Reset file upload if exists
        if (audioFileUpload.value) {
            audioFileUpload.value = '';
            uploadFileName.classList.add('d-none');
        }
    }

    // Show translation progress
    function showTranslating() {
        translatingIndicator.classList.remove('d-none');
        waveformContainer.classList.add('d-none');
    }

    // Hide translation progress
    function hideTranslating() {
        translatingIndicator.classList.add('d-none');
    }

    // Show results
    function showResults(data) {
        resultsSection.classList.remove('d-none');
        sourceText.textContent = data.sourceText || '';
        translatedText.textContent = data.translatedText || '';
        
        if (data.detectedLanguage) {
            let langName = 'Unknown';
            switch (data.detectedLanguage) {
                case 'en': langName = 'English'; break;
                case 'es': langName = 'Spanish'; break;
                case 'fr': langName = 'French'; break;
                case 'de': langName = 'German'; break;
                case 'hi': langName = 'Hindi'; break;
                case 'ta': langName = 'Tamil'; break;
                default: langName = data.detectedLanguage;
            }
            detectedLanguage.textContent = `Detected: ${langName}`;
        }
        
        if (data.outputPath) {
            audioOutput.src = data.outputPath;
        }
    }

    // Hide results
    function hideResults() {
        resultsSection.classList.add('d-none');
        sourceText.textContent = '';
        translatedText.textContent = '';
        audioOutput.src = '';
    }

    // Show error message
    function showError(message) {
        errorSection.classList.remove('d-none');
        errorMessage.textContent = message;
    }

    // Hide error message
    function hideError() {
        errorSection.classList.add('d-none');
    }

    // Send audio for processing
    async function processAudio(uploadedFile = null) {
        // If neither recorded audio nor uploaded file is available
        if (!audioBlob && !uploadedFile) {
            showError('No audio found. Please record or upload audio first.');
            return;
        }

        try {
            showTranslating();
            hideError();
            
            // Create FormData and append file
            const formData = new FormData();
            formData.append('targetLanguage', targetLanguage.value);
            
            if (uploadedFile) {
                // Use the uploaded file directly
                formData.append('audio', uploadedFile);
                
                // Send to server
                const response = await fetch('/upload-audio', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                hideTranslating();
                
                if (data.success) {
                    showResults(data);
                } else {
                    showError(data.error || 'Unknown error occurred');
                }
            } else {
                // Convert blob to base64
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = async function() {
                    const base64Audio = reader.result;
                    formData.append('audio_data', base64Audio);
                    
                    // Send to server
                    const response = await fetch('/upload-audio', {
                        method: 'POST',
                        body: formData
                    });
                    
                    const data = await response.json();
                    hideTranslating();
                    
                    if (data.success) {
                        showResults(data);
                    } else {
                        showError(data.error || 'Unknown error occurred');
                    }
                };
            }
        } catch (err) {
            hideTranslating();
            showError(`Error: ${err.message}`);
            console.error('Error processing audio:', err);
        }
    }

    // Check if models are loaded
    function checkModelsLoaded() {
        fetch('/check-models')
            .then(response => response.json())
            .then(data => {
                if (data.loaded) {
                    isModelLoaded = true;
                    loadingScreen.style.display = 'none';
                    mainContainer.classList.remove('d-none');
                    clearInterval(loadingInterval);
                } else if (data.error) {
                    loadingMessage.textContent = `Error loading models: ${data.error}`;
                    loadingBar.style.width = '100%';
                    loadingBar.classList.remove('progress-bar-animated', 'bg-primary');
                    loadingBar.classList.add('bg-danger');
                    clearInterval(loadingInterval);
                } else {
                    // Still loading
                    if (loadingProgress < 95) {
                        loadingProgress += 1;
                        loadingBar.style.width = `${loadingProgress}%`;
                    }
                    
                    // Check again in 2 seconds
                    setTimeout(checkModelsLoaded, 2000);
                }
            })
            .catch(err => {
                console.error('Error checking models:', err);
                loadingMessage.textContent = 'Error connecting to server';
                loadingBar.classList.remove('progress-bar-animated', 'bg-primary');
                loadingBar.classList.add('bg-danger');
                clearInterval(loadingInterval);
            });
    }

    // Start model loading check
    function startLoadingAnimation() {
        loadingInterval = setInterval(() => {
            if (loadingProgress < 95 && !isModelLoaded) {
                loadingProgress += 0.5;
                loadingBar.style.width = `${loadingProgress}%`;
            }
        }, 300);
        
        checkModelsLoaded();
    }

    // Initialize everything
    async function initialize() {
        initWaveSurfer();
        startLoadingAnimation();
        
        const recorderInitialized = await initRecorder();
        if (!recorderInitialized) {
            showError('Could not initialize audio recorder. Please check microphone permissions.');
        }
    }

    // Handle file upload
    function handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Display the file name
        const fileNameSpan = uploadFileName.querySelector('span');
        fileNameSpan.textContent = file.name;
        uploadFileName.classList.remove('d-none');
        
        // Reset UI
        hideResults();
        hideError();
        
        // If there's a recorded audio, clear it
        if (audioBlob) {
            clearAudioRecording();
        }
        
        // Load the file to wavesurfer
        const fileURL = URL.createObjectURL(file);
        wavesurfer.load(fileURL);
        waveformContainer.classList.remove('d-none');
        
        // Process the file
        processAudio(file);
    }

    // Event listeners
    recordButton.addEventListener('click', startRecording);
    stopButton.addEventListener('click', stopRecording);
    playRecording.addEventListener('click', togglePlayback);
    clearRecording.addEventListener('click', clearAudioRecording);
    stopButton.addEventListener('click', function() {
        stopRecording();
        setTimeout(() => processAudio(), 1000); // Process after a short delay
    });
    newTranslationButton.addEventListener('click', function() {
        hideResults();
        waveformContainer.classList.remove('d-none');
    });
    audioFileUpload.addEventListener('change', handleFileUpload);

    // Initialize the application
    initialize();
});
