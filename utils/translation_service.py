import torch
import soundfile as sf
import logging

logger = logging.getLogger(__name__)

def translate_text(source_text, src_lang_code, target_lang_code, tokenizer, model):
    """
    Translate text from source language to target language using M2M100.
    
    Args:
        source_text (str): Text to translate
        src_lang_code (str): Source language code (e.g., 'en')
        target_lang_code (str): Target language code (e.g., 'fr')
        tokenizer: M2M100 tokenizer
        model: M2M100 translation model
        
    Returns:
        str: Translated text
    """
    try:
        # Set source language
        tokenizer.src_lang = src_lang_code
        
        # Tokenize input text
        inputs = tokenizer(source_text, return_tensors="pt")
        
        # Get target language token ID
        forced_bos_token_id = tokenizer.get_lang_id(target_lang_code)
        
        # Generate translation
        translated_ids = model.generate(
            **inputs,
            forced_bos_token_id=forced_bos_token_id,
            max_length=512
        )
        
        # Decode the generated IDs to text
        translated_text = tokenizer.batch_decode(translated_ids, skip_special_tokens=True)[0]
        logger.info(f"Translated Text: {translated_text}")
        
        return translated_text
    
    except Exception as e:
        logger.error(f"Translation error: {e}")
        raise

def generate_speech(text, output_path, processor, model, vocoder, speaker_embeds):
    """
    Generate speech from text using SpeechT5.
    
    Args:
        text (str): Text to convert to speech
        output_path (str): Path to save the output WAV file
        processor: SpeechT5 processor
        model: SpeechT5 model
        vocoder: SpeechT5 HiFi-GAN vocoder
        speaker_embeds: Speaker embeddings tensor
        
    Returns:
        str: Path to the generated audio file
    """
    try:
        # Process text input
        tts_inputs = processor(text=text, return_tensors="pt")
        
        # Generate speech
        speech = model.generate_speech(tts_inputs["input_ids"], speaker_embeds, vocoder=vocoder)
        
        # Save to WAV file
        sf.write(output_path, speech.numpy(), samplerate=16000)
        
        return output_path
    
    except Exception as e:
        logger.error(f"Speech generation error: {e}")
        raise
