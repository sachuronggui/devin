import React, { useState } from 'react';
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Loader2, Upload, Image as ImageIcon } from "lucide-react";
import LanguageSelector from './LanguageSelector';

interface ImageTranslatorProps {
  className?: string;
}

const ImageTranslator = ({ className }: ImageTranslatorProps) => {
  const [sourceLang, setSourceLang] = useState('auto');  // Changed from 'en'
  const [targetLang, setTargetLang] = useState('en');    // Changed from 'zh-CN'
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [translatedImageUrl, setTranslatedImageUrl] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [hoveredBox, setHoveredBox] = useState<number | null>(null);
  const [textBoxes, setTextBoxes] = useState<Array<{left: number, top: number, width: number, height: number}>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setSelectedImage(file);
        setError('');
        // Create preview URL
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        // Clean up previous preview URL if it exists
        return () => URL.revokeObjectURL(url);
      } else {
        setError('Please select an image file');
        setSelectedImage(null);
        setPreviewUrl(null);
      }
    }
  };

  const handleTranslate = async () => {
    if (!selectedImage) return;

    setIsLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('image', selectedImage);
    formData.append('source_lang', sourceLang);
    formData.append('target_lang', targetLang);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/translate-image`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Translation failed');

      // Update to handle translated image URL
      setTranslatedImageUrl(data.translated_image_url);
      setExtractedText(data.original_text.join('\n'));
      setTranslatedText(data.translated_text.join('\n'));
      setTextBoxes(data.text_boxes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Translation failed');
      setTranslatedImageUrl(null);
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
              isSourceLanguage={true}
            />
            <LanguageSelector
              value={targetLang}
              onChange={setTargetLang}
              label="Target Language"
            />
          </div>

          <div className="grid gap-6">
            <div className="flex flex-col items-center gap-6">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
                id="image-input"
              />

              <div className="flex gap-4 w-full">
                <div className="flex-1">
                  <label
                    htmlFor="image-input"
                    className="flex flex-col items-center gap-2 p-6 border-2 border-dashed rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
                  >
                    {previewUrl ? (
                      <img src={previewUrl} alt="Original" className="max-w-full h-64 object-contain" />
                    ) : (
                      <>
                        <ImageIcon className="h-12 w-12 text-gray-400" />
                        <span className="text-sm text-gray-500">Click to select an image</span>
                      </>
                    )}
                  </label>
                  <p className="text-sm text-center mt-2">Original Image</p>
                </div>

                {translatedImageUrl && (
                  <div className="flex-1">
                    <div className="p-6 border-2 rounded-lg">
                      <img src={translatedImageUrl} alt="Translated" className="max-w-full h-64 object-contain" />
                    </div>
                    <p className="text-sm text-center mt-2">Translated Image</p>
                  </div>
                )}
              </div>

              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}

              <Button
                onClick={handleTranslate}
                disabled={isLoading || !selectedImage}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Translating...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Translate Image
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-2">Extracted Text</label>
              <textarea
                value={extractedText}
                readOnly
                className="w-full h-32 p-2 border rounded resize-none"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-2">Translated Text</label>
              <textarea
                value={translatedText}
                readOnly
                className="w-full h-32 p-2 border rounded resize-none"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImageTranslator;
