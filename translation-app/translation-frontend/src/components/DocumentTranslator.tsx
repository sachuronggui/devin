import React, { useState } from 'react';
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Loader2, Upload, FileText, Download } from "lucide-react";
import LanguageSelector from './LanguageSelector';

interface DocumentTranslatorProps {
  className?: string;
}

const DocumentTranslator = ({ className }: DocumentTranslatorProps) => {
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('zh-CN');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [translatedFileUrl, setTranslatedFileUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file type
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      if (!validTypes.includes(file.type)) {
        setError('Please upload a PDF, DOCX, or TXT file');
        return;
      }
      setSelectedFile(file);
      setError('');
    }
  };

  const handleTranslate = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('document', selectedFile);
    formData.append('source_lang', sourceLang);
    formData.append('target_lang', targetLang);

    try {
      const response = await fetch('http://localhost:8000/translate-document', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Translation failed');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setTranslatedFileUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Translation failed');
      setTranslatedFileUrl(null);
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
            <div className="flex flex-col items-center gap-6">
              <div className="flex gap-6">
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Select Document
                </Button>
                <input
                  id="file-upload"
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {selectedFile && (
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
                      <>
                        <FileText className="mr-2 h-4 w-4" />
                        Translate Document
                      </>
                    )}
                  </Button>
                )}

                {translatedFileUrl && (
                  <Button
                    variant="outline"
                    onClick={() => window.open(translatedFileUrl, '_blank')}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Translation
                  </Button>
                )}
              </div>

              {selectedFile && (
                <p className="text-sm text-gray-500">
                  Selected file: {selectedFile.name}
                </p>
              )}

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

export default DocumentTranslator;
