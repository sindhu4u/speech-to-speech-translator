# Multilingual Speech Translator Web App (Flask + Whisper + M2M100 )

This is a Flask-based web application that enables users to upload or record speech, detect the spoken language, translate it into another supported language, and convert the translated text back into speech using models from OpenAI Whisper and Facebook M2M100.

## Features
- **Speech Recognition** using OpenAI's Whisper
- **Translation** using Facebook's M2M100 model
- **Text-to-Speech** using Microsoft's SpeechT5
- **Web-based Interface** with CORS support for API integrations

## Setup Instructions

1. **Install Dependencies**
```bash
pip install -r requirements.txt
sudo apt update && sudo apt install -y ffmpeg
```

2. **Run the Application**
```bash
python main.py
```

3. **Open in Browser**
```
http://localhost:5000
```

## Python Dependencies
```txt
flask
flask_cors
torch
transformers
datasets
soundfile
openai-whisper
```

## Key Components

### 1. Model Initialization
- `whisper` for automatic speech recognition.
- `M2M100Tokenizer` and `M2M100ForConditionalGeneration` for multilingual translation.
- `SpeechT5Processor`, `SpeechT5ForTextToSpeech`, and `SpeechT5HifiGan` for generating speech output.
- CMU Arctic Xvectors dataset is used to obtain speaker embeddings for SpeechT5.

### 2. Supported Languages
```python
WHISPER_TO_M2M100 = {"en": "en", "ta": "ta", "hi": "hi"}
SUPPORTED_OUTPUT_LANGS = {"French": "fr", "Spanish": "es", "German": "de", "Hindi": "hi", "Tamil": "ta"}
```

### 3. Audio Processing Pipeline
- Load and trim audio.
- Convert to mel spectrogram and detect language using Whisper.
- Translate using M2M100 based on detected and target languages.
- Generate speech from translated text using SpeechT5 and vocoder.
- Output file is saved temporarily and sent back to the user.

### 4. Flask Endpoints
- `/` - Renders the HTML frontend.
- `/check-models` - Asynchronously loads models.
- `/upload-audio` - Accepts audio file or base64 string, processes it, and returns translated audio.
- `/get-audio/<filename>` - Serves the generated audio file.

## Error Handling
- Graceful fallbacks if model fails to load or process.
- Logs detailed error messages using Python’s `logging` module.

## Future Improvements
- Dockerize the application for production

---

Feel free to use this as a base template and customize it for more advanced use cases like emotion-based voice synthesis, speaker diarization, etc.
