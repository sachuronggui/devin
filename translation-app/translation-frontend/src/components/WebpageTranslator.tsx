import { useState } from 'react';
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Loader2, Globe } from "lucide-react";
import LanguageSelector from './LanguageSelector';

interface WebpageTranslatorProps {
  className?: string;
}

const WebpageTranslator = ({ className }: WebpageTranslatorProps) => {
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('zh-CN');
  const [url, setUrl] = useState('');
  const [translatedUrl, setTranslatedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTranslate = async () => {
    if (!url.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8000/translate-webpage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          source_lang: sourceLang,
          target_lang: targetLang,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Translation failed');
      }

      const data = await response.json();
      setTranslatedUrl(data.translated_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Translation failed');
    } finally {
      setIsLoading(false);
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
            <div className="flex gap-6">
              <Input
                type="url"
                placeholder="Enter webpage URL..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={handleTranslate}
                disabled={isLoading || !url.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Translating...
                  </>
                ) : (
                  <>
                    <Globe className="mr-2 h-4 w-4" />
                    Translate
                  </>
                )}
              </Button>
            </div>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            {translatedUrl && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Translated webpage:</p>
                <a
                  href={translatedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline break-all"
                >
                  {translatedUrl}
                </a>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WebpageTranslator;
