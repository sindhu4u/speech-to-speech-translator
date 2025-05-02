import os
import uuid
import torch
import whisper
import soundfile as sf
import logging

from utils.translation_service import translate_text, generate_speech

logger = logging.getLogger(__name__)

# Create uploads directory if it doesn't exist
UPLOAD_FOLDER = 'temp_uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def process_audio(audio_path, target_language, asr_model, translator_tokenizer, 
                 translator_model, tts_processor, tts_model, vocoder, speaker_embeds):
    """
    Process audio through the full translation pipeline.
    
    Args:
        audio_path (str): Path to the audio file
        target_language (str): Target language name (e.g., 'French')
        asr_model: Whisper ASR model
        translator_tokenizer: M2M100 tokenizer
        translator_model: M2M100 model
        tts_processor: SpeechT5 processor
        tts_model: SpeechT5 model
        vocoder: SpeechT5 HiFi-GAN vocoder
        speaker_embeds: Speaker embeddings tensor
        
    Returns:
        dict: Result dictionary containing success status and processed data
    """
    try:
        # Language mapping Whisper ➔ M2M100
        WHISPER_TO_M2M100 = {
            "en": "en",  # English
            "ta": "ta",  # Tamil
            "hi": "hi",  # Hindi
        }

        # Supported output languages (for user)
        SUPPORTED_OUTPUT_LANGS = {
            "French": "fr",
            "Spanish": "es",
            "German": "de",
            "Hindi": "hi",
            "Tamil": "ta"
        }
        
        # 1. Speech Recognition with Whisper
        audio = whisper.load_audio(audio_path)
        audio = whisper.pad_or_trim(audio)
        mel = whisper.log_mel_spectrogram(audio).to(asr_model.device)

        options = whisper.DecodingOptions(fp16=False)
        result = whisper.decode(asr_model, mel, options)
        
        detected_lang = result.language  # e.g., 'en', 'ta', 'hi'
        source_text = result.text
        logger.info(f"Detected Language: {detected_lang}")
        logger.info(f"Transcription: {source_text}")

        # 2. Translate text
        if detected_lang not in WHISPER_TO_M2M100:
            return {
                "success": False,
                "error": "Unsupported input language.",
                "detected_language": detected_lang
            }

        src_lang_code = WHISPER_TO_M2M100[detected_lang]
        target_lang_code = SUPPORTED_OUTPUT_LANGS.get(target_language, "fr")  # default French
        
        translated_text = translate_text(
            source_text, 
            src_lang_code, 
            target_lang_code, 
            translator_tokenizer, 
            translator_model
        )
        
        # 3. Generate speech from translated text
        output_uuid = str(uuid.uuid4())
        output_wav_path = os.path.join(UPLOAD_FOLDER, f"output_{output_uuid}.wav")
        
        generate_speech(
            translated_text, 
            output_wav_path, 
            tts_processor, 
            tts_model, 
            vocoder, 
            speaker_embeds
        )

        return {
            "success": True,
            "source_text": source_text,
            "translated_text": translated_text,
            "output_path": output_wav_path,
            "detected_language": detected_lang
        }
    
    except Exception as e:
        logger.error(f"Error in processing audio: {e}")
        return {
            "success": False,
            "error": str(e)
        }
