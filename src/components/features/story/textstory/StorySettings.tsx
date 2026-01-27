import { useRef, ChangeEvent } from 'react';
import { Upload, Smile, X, ChevronRight, ChevronDown, Check, Video, Phone, Shield } from 'lucide-react';
import { TextStoryState, TemplateType, CardAnimationType } from './types';
import { CARD_ANIMATIONS, TEMPLATE_CONFIG, TEMPLATES } from './constants';
import { useTranslation } from '../../../../hooks/useTranslation';
interface StorySettingsProps {
  state: TextStoryState;
  updateState: <K extends keyof TextStoryState>(key: K, value: TextStoryState[K]) => void;
  onProfilePhotoSelect?: (file: File) => void;
  onProfilePhotoRemove?: () => void;
  onLaunchTemplateBuilder?: () => void;
}
export const StorySettings = ({
  state,
  updateState,
  onProfilePhotoSelect,
  onProfilePhotoRemove,
  onLaunchTemplateBuilder,
}) => {
  const { t } = useTranslation();
  const profilePhotoInputRef = useRef<HTMLInputElement>(null);
  const handleProfilePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onProfilePhotoSelect) {
      onProfilePhotoSelect(file);
    }
  };
  const renderTemplatePreview = (template: TemplateType, isDark: boolean) => {
    const isSelected = state.selectedTemplate === template && state.darkMode === isDark;
    const config = TEMPLATE_CONFIG[template];
    const label = `${config.name} ${isDark ? 'Dark' : 'Light'}`;
    const bgColor = isDark ? 'bg-zinc-900' : 'bg-white';
    const borderColor = isDark ? 'border-zinc-700' : 'border-zinc-300';
    const textColor = isDark ? 'text-white' : 'text-zinc-900';
    const subTextColor = isDark ? 'text-zinc-400' : 'text-zinc-500';
    const bubbleBg = isDark ? 'bg-zinc-800' : config.bubbleColor;
    const bubbleText = isDark ? 'text-zinc-300' : 'text-zinc-700';
    return (
      <div
        key={`${template}-${isDark ? 'dark' : 'light'}`}
        onClick={() => {
          updateState('selectedTemplate', template);
          updateState('darkMode', isDark);
        }}
        className={`cursor-pointer transition-all duration-200 rounded-xl p-2 border-2 ${
          isSelected 
            ? 'border-blue-500 bg-blue-500/10' 
            : 'border-transparent hover:border-zinc-700 hover:bg-zinc-800/30'
        }`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            updateState('selectedTemplate', template);
            updateState('darkMode', isDark);
          }
        }}
      >
        <div className={`text-xs mb-2 flex items-center gap-2 ${isSelected ? 'text-blue-400 font-medium' : 'text-zinc-400'}`}>
          {isSelected && <Check size={12} className="text-blue-400" />}
          {label}
        </div>
        <div className={`rounded-xl overflow-hidden border ${borderColor} ${bgColor}`}>
          <div className={`flex items-center gap-2 px-3 py-2 border-b ${borderColor}`}>
            <ChevronRight size={14} className="rotate-180 text-blue-500 shrink-0" />
            {state.profilePhoto ? (
              <img
                src={state.profilePhoto}
                alt={state.contactName}
                className="w-5 h-5 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                {state.contactName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className={`text-xs font-medium flex-1 truncate ${textColor}`}>{state.contactName}</span>
            {template === 'tinder' && (
              <div className="flex gap-1 shrink-0">
                <Video size={12} className="text-blue-400" />
                <Shield size={12} className="text-blue-400" />
              </div>
            )}
            {template === 'instagram' && (
              <div className="flex gap-1.5 shrink-0">
                <Phone size={12} className={subTextColor} />
                <Video size={12} className={subTextColor} />
              </div>
            )}
            {template === 'messenger' && (
              <div className="flex gap-1.5 shrink-0">
                <Phone size={12} className={subTextColor} />
                <Video size={12} className="text-blue-500" />
              </div>
            )}
          </div>
          <div className="p-2.5 space-y-1.5">
            <div className={`text-[10px] px-2.5 py-1.5 rounded-2xl max-w-[85%] ${bubbleBg} ${bubbleText}`}>
              Hey there!
            </div>
            <div className={`text-[10px] px-2.5 py-1.5 rounded-2xl max-w-[75%] ml-auto text-white ${config.replyColor}`}>
              Hi! How are you?
            </div>
          </div>
        </div>
      </div>
    );
  };
  return (
    <div className="space-y-6">
      {onLaunchTemplateBuilder && (
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">{t('textStory.templateBuilder.title')}</h3>
              <p className="text-zinc-300 text-sm">
                {t('textStory.templateBuilder.description')}
              </p>
            </div>
            <button
              onClick={onLaunchTemplateBuilder}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
              type="button"
            >
              <Video size={18} />
              {t('textStory.templateBuilder.cta')}
            </button>
          </div>
        </div>
      )}

      <input
        ref={profilePhotoInputRef}
        type="file"
        accept="image/*"
        onChange={handleProfilePhotoChange}
        className="hidden"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div>
          <label className="block text-sm text-zinc-400 mb-2">{t('textStory.contactName')}</label>
          <div className="relative">
            <input
              type="text"
              value={state.contactName}
              onChange={(e) => updateState('contactName', e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
            />
            <button 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-500 hover:text-amber-400"
              type="button"
            >
              <Smile size={20} />
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm text-zinc-400 mb-2">{t('textStory.cardAnimationLabel')}</label>
          <div className="relative">
            <select
              value={state.cardAnimation}
              onChange={(e) => updateState('cardAnimation', e.target.value as CardAnimationType)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
            >
              {CARD_ANIMATIONS.map(anim => (
                <option key={anim.id} value={anim.id}>{t(anim.labelKey)}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {state.profilePhoto ? (
          <div className="relative">
            <img
              src={state.profilePhoto}
              alt={state.contactName}
              className="w-14 h-14 rounded-full object-cover"
            />
            <button
              onClick={onProfilePhotoRemove}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-400 transition-colors"
              type="button"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <div className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center text-white text-2xl font-bold">
            {state.contactName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1">
          <div className="text-sm text-zinc-400 mb-2">{t('textStory.uploadProfilePhoto')}</div>
          <button 
            onClick={() => profilePhotoInputRef.current?.click()}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors font-medium"
            type="button"
          >
            <Upload size={18} />
            {t('textStory.upload')}
          </button>
        </div>
      </div>
      <div>
        <div className="text-sm font-medium mb-4">{t('textStory.selectTemplate')}</div>
        <div className="grid grid-cols-2 gap-3 max-h-[450px] overflow-y-auto custom-scrollbar pr-1 items-start">
          {TEMPLATES.flatMap(template => [
            renderTemplatePreview(template, false),
            renderTemplatePreview(template, true),
          ])}
        </div>
      </div>
    </div>
  );
};
