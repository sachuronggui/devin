from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from deep_translator import GoogleTranslator
import pytesseract
from PIL import Image, ImageDraw, ImageFont
import speech_recognition as sr
from gtts import gTTS
import io
import logging
import requests
from bs4 import BeautifulSoup
import html
import os
import tempfile
import uuid

# Create directory for storing translated images
UPLOAD_DIR = os.path.join(tempfile.gettempdir(), "translated_images")
os.makedirs(UPLOAD_DIR, exist_ok=True)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

class TranslationRequest(BaseModel):
    text: str
    source_lang: str
    target_lang: str

class TranslationResponse(BaseModel):
    translated_text: str

@app.post("/translate", response_model=TranslationResponse)
async def translate_text(request: TranslationRequest):
    try:
        logger.info(f"Translating text from {request.source_lang} to {request.target_lang}")
        logger.info(f"Text to translate: {request.text}")

        source_lang = 'auto' if request.source_lang == 'auto' else request.source_lang

        # Map language codes for Chinese
        target_lang = request.target_lang
        if target_lang.startswith('zh-'):
            target_lang = 'zh-CN' if target_lang == 'zh-CN' else 'zh-TW'

        translator = GoogleTranslator(
            source=source_lang,
            target=target_lang
        )

        translated = translator.translate(text=request.text)
        if not translated:
            raise HTTPException(status_code=500, detail="Translation failed")

        logger.info(f"Translation successful: {translated}")
        return TranslationResponse(translated_text=translated)

    except Exception as e:
        logger.error(f"Translation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/translate-image")
async def translate_image(
    image: UploadFile = File(...),
    source_lang: str = Form(...),
    target_lang: str = Form('en')  # Default to English if not specified
):
    try:
        logger.info(f"Processing image translation from {source_lang} to {target_lang}")

        # Read and process the image
        contents = await image.read()
        img = Image.open(io.BytesIO(contents))

        # Get image data including bounding boxes
        data = pytesseract.image_to_data(img, lang=source_lang, output_type=pytesseract.Output.DICT)

        # Create a copy of the original image for translation
        translated_img = img.copy()
        draw = ImageDraw.Draw(translated_img)

        # Try to load a font that supports the target language
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 20)
        except:
            font = ImageFont.load_default()

        # Collect all text for translation
        text_to_translate = []
        boxes = []

        for i in range(len(data['text'])):
            if int(data['conf'][i]) > 60:  # Filter out low confidence detections
                text = data['text'][i].strip()
                if text:
                    text_to_translate.append(text)
                    boxes.append({
                        'left': data['left'][i],
                        'top': data['top'][i],
                        'width': data['width'][i],
                        'height': data['height'][i]
                    })

        if not text_to_translate:
            raise HTTPException(status_code=400, detail="No text found in image")

        # Translate all text at once
        source_lang = 'auto' if source_lang == 'auto' else source_lang
        target_lang_mapped = 'zh-CN' if target_lang == 'zh-CN' else ('zh-TW' if target_lang == 'zh-TW' else target_lang)

        translator = GoogleTranslator(
            source=source_lang,
            target=target_lang_mapped
        )

        translated_texts = [translator.translate(text=text) for text in text_to_translate]

        # Draw translated text on image
        for translated_text, box in zip(translated_texts, boxes):
            # Draw white background for better readability
            draw.rectangle(
                [
                    box['left'],
                    box['top'],
                    box['left'] + box['width'],
                    box['top'] + box['height']
                ],
                fill='white'
            )
            # Draw translated text
            draw.text(
                (box['left'], box['top']),
                translated_text,
                font=font,
                fill='black'
            )

        # Save the translated image
        filename = f"{uuid.uuid4()}.png"
        filepath = os.path.join(UPLOAD_DIR, filename)
        translated_img.save(filepath, "PNG")

        # Return the URL for the translated image and text data
        image_url = f"/images/{filename}"
        return {
            "translated_image_url": image_url,
            "original_text": text_to_translate,
            "translated_text": translated_texts,
            "text_boxes": boxes
        }

    except Exception as e:
        logger.error(f"Image translation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/languages")
async def get_languages():
    languages = {
        "en": "English",
        "zh-CN": "Chinese (Simplified)",
        "zh-TW": "Chinese (Traditional)",
        "es": "Spanish",
        "fr": "French",
        "de": "German",
        "ja": "Japanese",
        "ko": "Korean",
        "ru": "Russian",
        "ar": "Arabic",
        "hi": "Hindi"
    }
    return languages

@app.post("/translate-voice")
async def translate_voice(
    audio: UploadFile = File(...),
    source_lang: str = Form(...),
    target_lang: str = Form(...)
):
    try:
        logger.info(f"Processing voice translation from {source_lang} to {target_lang}")

        # Read the audio file
        audio_content = await audio.read()

        # Save temporary audio file
        temp_input = '/tmp/input_audio.wav'
        temp_output = '/tmp/output_audio.mp3'

        with open(temp_input, 'wb') as f:
            f.write(audio_content)

        # Initialize speech recognition
        recognizer = sr.Recognizer()

        # Convert speech to text
        with sr.AudioFile(temp_input) as source:
            audio_data = recognizer.record(source)
            text = recognizer.recognize_google(audio_data, language=source_lang)

        logger.info(f"Extracted text: {text}")

        # Handle 'auto' detection for source language
        source_lang = 'auto' if source_lang == 'auto' else source_lang

        # Map language codes for Chinese
        target_lang_mapped = target_lang
        if target_lang.startswith('zh-'):
            target_lang_mapped = 'zh-CN' if target_lang == 'zh-CN' else 'zh-TW'

        # Translate the text
        translator = GoogleTranslator(
            source=source_lang,
            target=target_lang_mapped
        )

        translated = translator.translate(text=text)
        if not translated:
            raise HTTPException(status_code=500, detail="Translation failed")

        logger.info(f"Translation successful: {translated}")

        # Convert translated text to speech
        tts = gTTS(text=translated, lang=target_lang_mapped)
        tts.save(temp_output)

        # Read the generated audio file
        with open(temp_output, 'rb') as f:
            translated_audio = f.read()

        # Clean up temporary files
        import os
        os.remove(temp_input)
        os.remove(temp_output)

        # Return the audio file
        from fastapi.responses import Response
        return Response(content=translated_audio, media_type="audio/mpeg")

    except Exception as e:
        logger.error(f"Voice translation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
