import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { ArrowLeft, Wand2, Download, RefreshCw, Image as ImageIcon, Maximize2, Sparkles, X, Heart, Copy, Check, Loader2 } from 'lucide-react';
import { CreateImageProps } from '../../../types';
import { useTranslation } from '../../../hooks/useTranslation';
import { usePaywall } from '../../../hooks/usePaywall';
import { downloadBlob } from '../../../utils/videoExport';
import { imageService } from '../../../services/api/imageService';

const ASPECT_RATIOS = ['1:1', '16:9', '9:16', '4:3', '3:4'] as const;
const STYLE_KEYS = ['realistic', 'anime', '3d', 'oil', 'pixel', 'vector', 'cinematic', 'fantasy'] as const;
type AspectRatioKey = (typeof ASPECT_RATIOS)[number];
type StyleKey = (typeof STYLE_KEYS)[number];
const GENERATION_STEPS = 20;

const STYLE_KEYWORDS: Record<StyleKey, string[]> = {
  realistic: ['photorealistic', '4k', 'detailed', 'nature', 'architecture'],
  anime: ['anime style', 'studio ghibli', 'vibrant', 'cel shaded'],
  '3d': ['3d render', 'unreal engine 5', 'octane render', 'isometric'],
  oil: ['oil painting', 'textured', 'canvas', 'impressionist'],
  pixel: ['pixel art', '16-bit', 'retro', 'dithering'],
  vector: ['vector art', 'flat design', 'illustrator', 'minimal'],
  cinematic: ['cinematic lighting', 'movie scene', 'dramatic', 'anamorphic'],
  fantasy: ['fantasy art', 'magical', 'ethereal', 'digital painting'],
};

const mapAspectRatioToSize = (ratio: AspectRatioKey): '1024x1024' | '1024x1792' | '1792x1024' => {
  switch (ratio) {
    case '16:9':
    case '4:3':
      return '1792x1024';
    case '9:16':
    case '3:4':
      return '1024x1792';
    default:
      return '1024x1024';
  }
};

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  style: StyleKey;
  aspectRatio: AspectRatioKey;
  isFavorite: boolean;
}

export const CreateImage = ({ onBack }: CreateImageProps) => {
  const { t } = useTranslation();
  const { requireSubscription } = usePaywall();
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatioKey>('1:1');
  const [style, setStyle] = useState<StyleKey>('realistic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const generationRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (generationRef.current) {
        clearInterval(generationRef.current);
      }
      // Clean up blob URLs when component unmounts
      generatedImages.forEach(img => {
        if (img.url.startsWith('blob:')) {
          URL.revokeObjectURL(img.url);
        }
      });
    };
  }, [generatedImages]);

  const styleLabels = useMemo<Record<StyleKey, string>>(
    () => ({
      realistic: t('createImage.style.realistic'),
      anime: t('createImage.style.anime'),
      '3d': t('createImage.style.threeD'),
      oil: t('createImage.style.oil'),
      pixel: t('createImage.style.pixel'),
      vector: t('createImage.style.vector'),
      cinematic: t('createImage.style.cinematic'),
      fantasy: t('createImage.style.fantasy'),
    }),
    [t]
  );

  const generate = useCallback(async () => {
    if (!prompt.trim()) return;
    if (!requireSubscription('AI Images')) return;
    
    setIsGenerating(true);
    setGenerationProgress(0);
    setCurrentStep(0);
    setError(null);

    // Fake progress for UX while waiting for API
    let step = 0;
    generationRef.current = setInterval(() => {
      step++;
      // Cap step at GENERATION_STEPS to prevent exceeding the limit
      const cappedStep = Math.min(step, GENERATION_STEPS);
      setCurrentStep(cappedStep);
      const progress = Math.min((cappedStep / GENERATION_STEPS) * 90, 90);
      setGenerationProgress(progress);
      
      // Stop interval when we reach 90% or GENERATION_STEPS
      if (cappedStep >= GENERATION_STEPS || progress >= 90) {
        if (generationRef.current) {
          clearInterval(generationRef.current);
          generationRef.current = null;
        }
      }
    }, 500);

    try {
      const size = mapAspectRatioToSize(aspectRatio);
      // Enhance prompt with style keywords
      const styleWords = STYLE_KEYWORDS[style].join(', ');
      const enhancedPrompt = `${prompt}. Style: ${style}. Keywords: ${styleWords}. ${negativePrompt ? `Avoid: ${negativePrompt}` : ''}`;

      console.log('🚀 Starting image generation...');
      // Stop the interval before starting API call
      if (generationRef.current) {
        clearInterval(generationRef.current);
        generationRef.current = null;
      }
      setGenerationProgress(85); // Update progress when API call starts
      
      const response = await imageService.generateImage({
        prompt: enhancedPrompt,
        size: size,
        style: 'vivid',
        quality: 'standard'
      });

      console.log('✅ Image generated, converting base64 to blob...');
      setGenerationProgress(95); // Update progress when conversion starts

      // OpenAI now returns base64 instead of URL to avoid timeout/CORS issues
      let imageUrl: string;
      try {
        if (response.data[0].b64_json) {
          // Convert base64 to blob URL
          const base64Data = response.data[0].b64_json;
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'image/png' });
          imageUrl = URL.createObjectURL(blob);
          console.log('✅ Base64 image converted to blob URL');
          setGenerationProgress(100);
        } else if (response.data[0].url) {
          // Fallback: if URL is provided (shouldn't happen with b64_json format)
          console.warn('⚠️ Received URL instead of base64, using URL');
          imageUrl = response.data[0].url;
          setGenerationProgress(100);
        } else {
          throw new Error('No image data received (neither b64_json nor url)');
        }
      } catch (conversionError) {
        console.error('❌ Failed to convert base64 to blob:', conversionError);
        setError('Failed to process image data. Please try again.');
        setGenerationProgress(0);
        throw conversionError;
      }

      const newImage: GeneratedImage = {
        id: `img_${Date.now()}`,
        url: imageUrl,
        prompt: response.data[0].revised_prompt || prompt,
        style,
        aspectRatio,
        isFavorite: false,
      };
        
      setGeneratedImages([newImage]);
      console.log('✅ Image generation complete!');
      
      // Clear interval after success
      if (generationRef.current) {
        clearInterval(generationRef.current);
        generationRef.current = null;
      }
      setIsGenerating(false);
    } catch (error) {
      console.error('❌ Generation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate image';
      setError(errorMessage);
      setGenerationProgress(0);
      
      // Clear interval on error
      if (generationRef.current) {
        clearInterval(generationRef.current);
        generationRef.current = null;
      }
      setIsGenerating(false);
      setCurrentStep(0);
    }
  }, [prompt, style, aspectRatio, negativePrompt, requireSubscription]);

  const handleRegenerate = useCallback((imageId: string) => {
    generate();
  }, [generate]);

  const handleToggleFavorite = useCallback((imageId: string) => {
    setGeneratedImages(prev =>
      prev.map(img =>
        img.id === imageId ? { ...img, isFavorite: !img.isFavorite } : img
      )
    );
  }, []);

  const handleDownload = useCallback(async (image: GeneratedImage) => {
    // For DALL-E urls (which expire), we might need to proxy or use downloadBlob immediately
    try {
    const response = await fetch(image.url);
    const blob = await response.blob();
      downloadBlob(blob, `zitro-ai-${image.id}.png`); // DALL-E returns png
    } catch (e) {
      console.error("Download failed", e);
    }
  }, []);

  const handleCopyPrompt = useCallback((image: GeneratedImage) => {
    navigator.clipboard.writeText(image.prompt);
    setCopiedId(image.id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const getProgressPhase = () => {
    if (currentStep < 5) return t('createImage.progress.analyzing');
    if (currentStep < 10) return t('createImage.progress.composing');
    if (currentStep < 15) return t('createImage.progress.rendering');
    return t('createImage.progress.finalizing');
  };

  return (
    <div className="min-h-screen bg-background text-white p-4 sm:p-6 animate-fade-in flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8 border-b border-white/5 pb-4">
        <button onClick={onBack} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-white transition-colors touch-target active:scale-95">
          <ArrowLeft size={18} />
          <span className="font-medium text-sm">{t('createImage.back')}</span>
        </button>
        <div className="flex items-center gap-2">
          <span className="text-[10px] sm:text-xs font-bold text-blue-400 bg-blue-500/10 px-2 sm:px-3 py-1 rounded-full border border-blue-500/20">
            <Sparkles size={10} className="sm:hidden inline mr-1" />
            <Sparkles size={12} className="hidden sm:inline mr-1" />
            {t('createImage.badge')}
          </span>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-8">
        <div className="lg:col-span-4 space-y-4 sm:space-y-6">
          <div>
            <label className="text-xs sm:text-sm font-bold text-gray-300 mb-2 block">{t('createImage.promptLabel')}</label>
            <textarea
              className="w-full h-24 sm:h-32 bg-zinc-900 border border-white/10 rounded-lg sm:rounded-xl p-3 sm:p-4 text-xs sm:text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none"
              placeholder={t('createImage.promptPlaceholder')}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1"
          >
            {showAdvanced ? '▼' : '▶'} {t('createImage.advancedOptions')}
          </button>

          {showAdvanced && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="text-xs font-bold text-gray-300 mb-2 block">{t('createImage.negativePrompt')}</label>
                <textarea
                  className="w-full h-16 bg-zinc-900 border border-white/10 rounded-lg p-3 text-xs focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  placeholder={t('createImage.negativePromptPlaceholder')}
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs sm:text-sm font-bold text-gray-300 mb-2 block">{t('createImage.aspectLabel')}</label>
            <div className="grid grid-cols-5 gap-2">
              {ASPECT_RATIOS.map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => setAspectRatio(ratio)}
                  className={`py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-medium border transition-all ${aspectRatio === ratio ? 'bg-blue-600 border-blue-500 text-white' : 'bg-zinc-900 border-white/10 text-gray-400 hover:bg-zinc-800'}`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs sm:text-sm font-bold text-gray-300 mb-2 block">{t('createImage.styleLabel')}</label>
            <div className="grid grid-cols-4 sm:grid-cols-2 gap-2">
              {STYLE_KEYS.map((styleKey) => (
                <button
                  key={styleKey}
                  onClick={() => setStyle(styleKey)}
                  className={`py-2 sm:py-3 rounded-lg text-[10px] sm:text-xs font-medium border transition-all flex items-center justify-center gap-1 sm:gap-2 ${style === styleKey ? 'bg-purple-600/20 border-purple-500 text-purple-300' : 'bg-zinc-900 border-white/10 text-gray-400 hover:bg-zinc-800'}`}
                >
                  {styleLabels[styleKey]}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={generate}
            disabled={!prompt || isGenerating}
            className="w-full py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-lg sm:rounded-xl shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {isGenerating ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {t('createImage.generating')} ({Math.round(generationProgress)}%)
              </>
            ) : (
              <>
                <Wand2 size={18} />
                {t('createImage.generate')}
              </>
            )}
          </button>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs animate-fade-in">
              <p className="font-semibold mb-1">Error:</p>
              <p>{error}</p>
            </div>
          )}

          {isGenerating && (
            <div className="space-y-2 animate-fade-in">
              <div className="flex justify-between text-xs text-zinc-400">
                <span>{getProgressPhase()}</span>
                <span>{Math.min(currentStep, GENERATION_STEPS)}/{GENERATION_STEPS}</span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-150"
                  style={{ width: `${generationProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-8 bg-zinc-900/30 border border-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex flex-col min-h-card sm:min-h-card-lg">
          {isGenerating ? (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="relative w-24 h-24 mb-6">
                <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full" />
                <div className="absolute inset-0 border-4 border-transparent border-t-blue-500 rounded-full animate-spin" />
                <div className="absolute inset-2 border-4 border-transparent border-t-purple-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
              </div>
              <p className="text-lg font-semibold text-white mb-2">{t('createImage.creatingMasterpiece')}</p>
              <p className="text-sm text-zinc-400">{getProgressPhase()}</p>
            </div>
          ) : generatedImages.length > 0 ? (
            <div className="grid grid-cols-1 gap-2 sm:gap-4 h-full place-items-center">
              {generatedImages.map((img) => (
                <div key={img.id} className="relative group rounded-lg sm:rounded-xl overflow-hidden bg-black max-w-full max-h-[600px]">
                  <img 
                    src={img.url} 
                    className="w-full h-full object-contain cursor-pointer" 
                    alt={img.prompt}
                    onClick={() => setSelectedImage(img)}
                    loading="eager"
                    onError={(e) => {
                      console.error('❌ Failed to load image:', img.url, e);
                      const target = e.currentTarget;
                      const parent = target.parentElement;
                      if (parent && !parent.querySelector('.image-error-message')) {
                        target.style.display = 'none';
                        // Show error message
                        const errorDiv = document.createElement('div');
                        errorDiv.className = 'image-error-message absolute inset-0 flex items-center justify-center bg-red-500/10 text-red-400 p-4 text-center rounded-lg';
                        errorDiv.innerHTML = `
                          <div class="text-center">
                            <p class="font-semibold mb-2">Failed to load image</p>
                            <p class="text-xs text-red-300">The image URL may have expired or there was a network error.</p>
                            ${img.url.startsWith('blob:') ? '' : `<p class="text-xs text-red-400 mt-2">Original URL: ${img.url.substring(0, 50)}...</p>`}
                          </div>
                        `;
                        parent.appendChild(errorDiv);
                      }
                    }}
                    onLoad={() => {
                      console.log('✅ Image loaded successfully');
                    }}
                  />
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleToggleFavorite(img.id); }}
                      className={`p-1.5 rounded-full backdrop-blur-md transition-colors ${img.isFavorite ? 'bg-red-500 text-white' : 'bg-black/50 text-white hover:bg-black/70'}`}
                    >
                      <Heart size={14} fill={img.isFavorite ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleRegenerate(img.id); }}
                        className="p-2 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 text-white transition-colors"
                        title={t('createImage.regenerate')}
                      >
                        <RefreshCw size={14} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedImage(img); }}
                        className="p-2 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 text-white transition-colors"
                        title={t('createImage.expand')}
                      >
                        <Maximize2 size={14} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDownload(img); }}
                        className="p-2 bg-blue-600 rounded-full hover:bg-blue-500 text-white transition-colors"
                        title={t('createImage.download')}
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-zinc-500 border-2 border-dashed border-white/5 rounded-xl sm:rounded-2xl py-12">
              <ImageIcon size={36} className="sm:hidden mb-3 opacity-20" />
              <ImageIcon size={48} className="hidden sm:block mb-4 opacity-20" />
              <p className="text-xs sm:text-sm text-center px-4">{t('createImage.emptyState')}</p>
              <p className="text-[10px] sm:text-xs text-zinc-600 mt-2 text-center px-4">{t('createImage.emptyStateHint')}</p>
            </div>
          )}
        </div>
      </div>

      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 p-2 text-white hover:text-zinc-300 transition-colors"
            >
              <X size={24} />
            </button>
            <img 
              src={selectedImage.url} 
              alt={selectedImage.prompt}
              className="w-full h-full object-contain rounded-xl"
            />
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent rounded-b-xl">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0 mr-4">
                  <p className="text-sm text-white font-medium truncate">{selectedImage.prompt}</p>
                  <p className="text-xs text-zinc-400">{styleLabels[selectedImage.style as keyof typeof styleLabels]} • {selectedImage.aspectRatio}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleCopyPrompt(selectedImage)}
                    className="p-2 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 text-white transition-colors"
                    title={t('createImage.copyPrompt')}
                  >
                    {copiedId === selectedImage.id ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                  <button 
                    onClick={() => handleToggleFavorite(selectedImage.id)}
                    className={`p-2 rounded-full backdrop-blur-md transition-colors ${selectedImage.isFavorite ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                  >
                    <Heart size={16} fill={selectedImage.isFavorite ? 'currentColor' : 'none'} />
                  </button>
                  <button 
                    onClick={() => handleDownload(selectedImage)}
                    className="p-2 bg-blue-600 rounded-full hover:bg-blue-500 text-white transition-colors"
                  >
                    <Download size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
