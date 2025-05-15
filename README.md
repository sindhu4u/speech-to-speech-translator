<<<<<<< HEAD
# Multilingual Speech-to-Speech Translation Web App

This web application provides a user-friendly interface for multilingual speech-to-speech translation. It allows users to record speech in one language, have it translated to another language, and then hear the translated speech.

## Features

- **Speech Recognition**: Uses OpenAI's Whisper model to transcribe audio in multiple languages
- **Translation**: Translates text between languages using Facebook's M2M100 model
- **Text-to-Speech**: Converts translated text to speech using Microsoft's SpeechT5 model
- **Interactive UI**: Features animations, audio recording, and playback functionality
- **Responsive Design**: Works on desktop and mobile devices

## Supported Languages

### Input Languages (Automatic Detection)
- English
- Tamil
- Hindi

### Output Languages
- French
- Spanish
- German
- Hindi
- Tamil

## Technical Details

### Technology Stack

- **Backend**: Flask, PyTorch, Whisper, Transformers, SoundFile
- **Frontend**: HTML5, CSS3, JavaScript, Bootstrap, Font Awesome
- **Audio Processing**: Web Audio API, WaveSurfer.js

### Machine Learning Models

- **ASR**: Whisper (small model)
- **Translation**: M2M100 (418M parameter model)
- **TTS**: SpeechT5 with HiFi-GAN vocoder

## Getting Started

### Prerequisites

- Python 3.8+
- PyTorch
- Flask
- Other dependencies listed in `requirements.txt`

### Installation

1. Clone the repository
2. Install the required packages:

=======
# speech-to-speech-translator
>>>>>>> 4fe1a8af7e3e2f8ad491aac834ee71028a68a5a5
