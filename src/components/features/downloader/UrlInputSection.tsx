import { ChangeEvent } from 'react';
import { Link as LinkIcon, Check, X, AlertCircle, ChevronDown, Download, Loader2 } from 'lucide-react';
interface DownloadQuality {
  id: string;
  label: string;
  resolution: string;
  estimatedSize: string;
}
interface UrlInputSectionProps {
  url: string;
  isValidUrl: boolean | null;
  selectedQuality: string;
  showQualityDropdown: boolean;
  isFetching: boolean;
  platformName: string;
  platformColor: string;
  placeholder: string;
  qualityOptions: DownloadQuality[];
  onUrlChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onToggleQualityDropdown: () => void;
  onSelectQuality: (qualityId: string) => void;
  onFetchVideo: () => void;
}
export const UrlInputSection = ({
  url,
  isValidUrl,
  selectedQuality,
  showQualityDropdown,
  isFetching,
  platformName,
  platformColor,
  placeholder,
  qualityOptions,
  onUrlChange,
  onToggleQualityDropdown,
  onSelectQuality,
  onFetchVideo,
}) => {
  return (
    <div className="bg-zinc-900/50 rounded-2xl p-4 sm:p-6 border border-white/5">
      <div className="flex items-center gap-3 mb-4">
        <LinkIcon size={18} className={platformColor} />
        <span className="text-sm font-medium text-white">Paste {platformName} URL</span>
      </div>
      <div className="space-y-4">
        <div className="relative flex items-center">
          <input
            type="url"
            value={url}
            onChange={onUrlChange}
            onInput={(e) => onUrlChange(e as React.ChangeEvent<HTMLInputElement>)}
            placeholder={placeholder}
            className={`w-full px-4 py-4 bg-zinc-800 border rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 transition-all ${
              isValidUrl === false
                ? 'border-red-500/50 focus:ring-red-500/50'
                : isValidUrl === true
                  ? 'border-green-500/50 focus:ring-green-500/50'
                  : 'border-white/10 focus:ring-blue-500/50'
            }`}
          />
          {isValidUrl !== null && (
            <div className="absolute right-4 w-4.5 h-4.5 flex items-center justify-center">
              {isValidUrl ? (
                <Check size={18} className="text-green-400" />
              ) : (
                <X size={18} className="text-red-400" />
              )}
            </div>
          )}
        </div>
        {isValidUrl === false && (
          <p className="text-red-400 text-xs flex items-center gap-1">
            <AlertCircle size={12} />
            Please enter a valid {platformName} URL
          </p>
        )}
        <div className="flex gap-3">
          <div className="relative">
            <button
              onClick={onToggleQualityDropdown}
              className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm font-medium transition-colors border border-white/10 flex items-center gap-2 min-w-[140px]"
              type="button"
            >
              {qualityOptions.find((q) => q.id === selectedQuality)?.label}
              <ChevronDown size={16} className={`transition-transform ${showQualityDropdown ? 'rotate-180' : ''}`} />
            </button>
            {showQualityDropdown && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-zinc-800 border border-white/10 rounded-xl overflow-hidden shadow-xl z-10">
                {qualityOptions.map((quality) => (
                  <button
                    key={quality.id}
                    onClick={() => {
                      onSelectQuality(quality.id);
                      onToggleQualityDropdown();
                    }}
                    className={`w-full px-4 py-3 text-left hover:bg-zinc-700 transition-colors ${
                      selectedQuality === quality.id ? 'bg-blue-600/20 text-blue-400' : 'text-white'
                    }`}
                    type="button"
                  >
                    <div className="text-sm font-medium">{quality.label}</div>
                    <div className="text-xs text-zinc-500">{quality.resolution}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={onFetchVideo}
            disabled={!isValidUrl || isFetching}
            className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-zinc-700 disabled:to-zinc-700 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
            type="button"
          >
            {isFetching ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Fetching...
              </>
            ) : (
              <>
                <Download size={18} />
                Fetch Video
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};