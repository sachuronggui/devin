import { useState } from 'react';
import LanguageSelector from './components/LanguageSelector';
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Textarea } from "./components/ui/textarea";
import { Button } from "./components/ui/button";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import ImageTranslator from './components/ImageTranslator';
import VoiceTranslator from './components/VoiceTranslator';
import DocumentTranslator from './components/DocumentTranslator';
import WebpageTranslator from './components/WebpageTranslator';

function App() {
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('zh-CN');
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTranslate = async () => {
    if (!sourceText.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8000/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: sourceText,
          source_lang: sourceLang,
          target_lang: targetLang,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Translation failed');

      setTranslatedText(data.translated_text);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Translation failed');
      setTranslatedText('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="container mx-auto px-4">
        <Card className="max-w-4xl mx-auto">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl">Universal Translator</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="text" className="w-full space-y-6">
              <TabsList className="w-full flex justify-between space-x-4 p-2 py-3">
                <TabsTrigger value="text" className="flex-1 px-4 py-2">Text Translation</TabsTrigger>
                <TabsTrigger value="image" className="flex-1 px-4 py-2">Image Translation</TabsTrigger>
                <TabsTrigger value="voice" className="flex-1 px-4 py-2">Voice Translation</TabsTrigger>
                <TabsTrigger value="document" className="flex-1 px-4 py-2">Document Translation</TabsTrigger>
                <TabsTrigger value="webpage" className="flex-1 px-4 py-2">Webpage Translation</TabsTrigger>
              </TabsList>
              <TabsContent value="text">
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
                    <Textarea
                      placeholder="Enter text to translate..."
                      value={sourceText}
                      onChange={(e) => setSourceText(e.target.value)}
                      className="min-h-[120px]"
                    />

                    <Button
                      onClick={handleTranslate}
                      disabled={isLoading || !sourceText.trim()}
                      className="w-full md:w-auto md:self-center"
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

                    {error && (
                      <p className="text-sm text-red-500">{error}</p>
                    )}

                    <Textarea
                      placeholder="Translation will appear here..."
                      value={translatedText}
                      readOnly
                      className="min-h-[120px]"
                    />
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="image">
                <ImageTranslator />
              </TabsContent>
              <TabsContent value="voice">
                <VoiceTranslator />
              </TabsContent>
              <TabsContent value="document">
                <DocumentTranslator />
              </TabsContent>
              <TabsContent value="webpage">
                <WebpageTranslator />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default App;
