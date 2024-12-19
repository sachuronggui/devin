import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";

interface LanguageSelectorProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
}

const LanguageSelector = ({ value, onChange, label }: LanguageSelectorProps) => {
  const languages = {
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
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium">{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select language" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(languages).map(([code, name]) => (
            <SelectItem key={code} value={code}>
              {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default LanguageSelector;
