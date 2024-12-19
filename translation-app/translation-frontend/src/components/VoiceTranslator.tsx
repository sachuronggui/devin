import { useState, useRef } from 'react';
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Loader2, Mic, Square, Volume2 } from "lucide-react";
import LanguageSelector from './LanguageSelector';

interface VoiceTranslatorProps {
  className?: string;
}

const VoiceTranslator = ({ className }: VoiceTranslatorProps) => {
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('zh-CN');
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [translatedAudioUrl, setTranslatedAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setError('');
    } catch (err) {
      setError('Failed to access microphone');
      console.error('Error accessing microphone:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleTranslate = async () => {
    if (!audioBlob) return;

    setIsLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('audio', audioBlob);
    formData.append('source_lang', sourceLang);
    formData.append('target_lang', targetLang);

    try {
      const response = await fetch('http://localhost:8000/translate-voice', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Translation failed');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setTranslatedAudioUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Translation failed');
      setTranslatedAudioUrl(null);
    } finally {
      setIsLoading(false);
    }
  };

  const playTranslatedAudio = () => {
    if (translatedAudioUrl) {
      const audio = new Audio(translatedAudioUrl);
      audio.play();
    }
  };

  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:justify-start space-y-4 md:space-y-0 md:space-x-8">
            <LanguageSelector
              value={sourceLang}
              onChange={setSourceLang}
              label="Source Language"
            />
            <LanguageSelector
              value={targetLang}
              onChange={setTargetLang}
              label="Target Language"
            />
          </div>

          <div className="grid gap-6">
            <div className="flex flex-col items-center gap-6">
              <div className="flex gap-6">
                <Button
                  onClick={isRecording ? stopRecording : startRecording}
                  variant={isRecording ? "destructive" : "default"}
                >
                  {isRecording ? (
                    <>
                      <Square className="mr-2 h-4 w-4" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <Mic className="mr-2 h-4 w-4" />
                      Start Recording
                    </>
                  )}
                </Button>

                {audioBlob && (
                  <Button
                    onClick={handleTranslate}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Translating...
                      </>
                    ) : (
                      'Translate'
                    )}
                  </Button>
                )}

                {translatedAudioUrl && (
                  <Button
                    onClick={playTranslatedAudio}
                    variant="outline"
                  >
                    <Volume2 className="mr-2 h-4 w-4" />
                    Play Translation
                  </Button>
                )}
              </div>

              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VoiceTranslator;
