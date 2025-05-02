import torch
import gradio as gr
import whisper
from transformers import (
    M2M100ForConditionalGeneration,
    M2M100Tokenizer,
    SpeechT5Processor,
    SpeechT5ForTextToSpeech,
    SpeechT5HifiGan
)
from datasets import load_dataset
import soundfile as sf

# ========== Load Models ==========

# 1. Whisper ASR
asr_model = whisper.load_model("small")

# 2. M2M100 Translator
translator_tokenizer = M2M100Tokenizer.from_pretrained("facebook/m2m100_418M")
translator_model = M2M100ForConditionalGeneration.from_pretrained("facebook/m2m100_418M")

# 3. French TTS
tts_processor = SpeechT5Processor.from_pretrained("microsoft/speecht5_tts")
tts_model = SpeechT5ForTextToSpeech.from_pretrained("microsoft/speecht5_tts")
vocoder = SpeechT5HifiGan.from_pretrained("microsoft/speecht5_hifigan")

# Speaker embedding for TTS
speaker_embeds = torch.tensor(
    load_dataset("Matthijs/cmu-arctic-xvectors", split="validation")[7306]["xvector"]
).unsqueeze(0)

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

# ========== Core Pipeline ==========

def full_pipeline(audio_path, target_language_name):
    # 1. Speech Recognition
    audio = whisper.load_audio(audio_path)
    audio = whisper.pad_or_trim(audio)
    mel = whisper.log_mel_spectrogram(audio).to(asr_model.device)

    options = whisper.DecodingOptions(fp16=False)
    result = whisper.decode(asr_model, mel, options)
    
    detected_lang = result.language  # e.g., 'en', 'ta', 'hi'
    source_text = result.text
    print(f"Detected Language: {detected_lang}")
    print(f"Transcription: {source_text}")

    # 2. Translate
    if detected_lang not in WHISPER_TO_M2M100:
        return "Unsupported input language.", "Unsupported input language.", None

    src_lang_code = WHISPER_TO_M2M100[detected_lang]
    translator_tokenizer.src_lang = src_lang_code

    inputs = translator_tokenizer(source_text, return_tensors="pt")

    # Target language
    target_lang_code = SUPPORTED_OUTPUT_LANGS.get(target_language_name, "fr")  # default French
    forced_bos_token_id = translator_tokenizer.get_lang_id(target_lang_code)

    translated_ids = translator_model.generate(
        **inputs,
        forced_bos_token_id=forced_bos_token_id,
        max_length=512
    )

    translated_text = translator_tokenizer.batch_decode(translated_ids, skip_special_tokens=True)[0]
    print(f"Translated Text: {translated_text}")

    # 3. TTS (still French only for now)
    tts_inputs = tts_processor(text=translated_text, return_tensors="pt")
    speech = tts_model.generate_speech(tts_inputs["input_ids"], speaker_embeds, vocoder=vocoder)

    output_wav_path = "output_output.wav"
    sf.write(output_wav_path, speech.numpy(), samplerate=16000)

    return source_text, translated_text, output_wav_path

# ========== Gradio Interface ==========

with gr.Blocks() as demo:
    gr.Markdown("# 🎙️ Multilingual Speech → Translation → Speech")

    with gr.Row():
        mic_input = gr.Audio(type="filepath", label="🎙️ Record Speech")
        target_lang = gr.Dropdown(
            choices=list(SUPPORTED_OUTPUT_LANGS.keys()),
            value="French",
            label="🌍 Choose Target Language"
        )

    transcribed = gr.Textbox(label="📝 Transcribed Input Text")
    translated = gr.Textbox(label="🌍 Translated Output Text")
    audio_output = gr.Audio(label="🔊 Output Speech")

    btn = gr.Button("🚀 Translate and Speak!")

    btn.click(fn=full_pipeline, inputs=[mic_input, target_lang], outputs=[transcribed, translated, audio_output])

demo.launch()
