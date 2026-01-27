import { useState, useCallback } from 'react';
import { GripVertical, Smile, Copy, Trash2, ChevronDown } from 'lucide-react';
import { TextStoryState, ScriptMode, Message, TextAnimationType } from './types';
import { TEXT_ANIMATIONS } from './constants';
import { AIGenerationPanel } from './AIGenerationPanel';
import { AIGenerationOptions } from './aiGenerationUtils';
import { useTranslation } from '../../../../hooks/useTranslation';
interface MessagesEditorProps {
  state: TextStoryState;
  updateState: <K extends keyof TextStoryState>(key: K, value: TextStoryState[K]) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  addMessage: () => void;
  deleteMessage: (id: string) => void;
  duplicateMessage: (id: string) => void;
  swapAllMessages: () => void;
  parseScript: (script: string) => void;
  generateAIScript: (options?: AIGenerationOptions) => void;
  onReorderMessages?: (messages: Message[]) => void;
}
export const MessagesEditor = ({
  state,
  updateState,
  updateMessage,
  addMessage,
  deleteMessage,
  duplicateMessage,
  swapAllMessages,
  parseScript,
  generateAIScript,
  onReorderMessages,
}) => {
  const { t } = useTranslation();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  }, []);
  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }, []);
  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);
  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = draggedIndex;
    if (dragIndex === null || dragIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }
    const newMessages = [...state.messages];
    const [removed] = newMessages.splice(dragIndex, 1);
    newMessages.splice(dropIndex, 0, removed);
    onReorderMessages?.(newMessages);
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, [draggedIndex, state.messages, onReorderMessages]);
  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);
  return (
    <div className="space-y-6">
      {state.validationError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
          <span className="text-red-400 text-sm">⚠️</span>
          <div className="flex-1">
            <div className="text-sm font-semibold text-red-400 mb-1">Error</div>
            <div className="text-xs text-red-300">{state.validationError}</div>
          </div>
          <button
            onClick={() => updateState('validationError', null)}
            className="text-red-400 hover:text-red-300 text-lg leading-none"
            type="button"
          >
            ×
          </button>
        </div>
      )}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{t('textStory.scriptMode')}</span>
        <div className="flex gap-2">
          {(['manual', 'paste', 'ai'] as ScriptMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => updateState('scriptMode', mode)}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                state.scriptMode === mode
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
              type="button"
            >
              {mode === 'manual' ? t('textStory.scriptModeManual') : mode === 'paste' ? t('textStory.scriptModePaste') : t('textStory.scriptModeAI')}
            </button>
          ))}
        </div>
      </div>
      {state.scriptMode === 'paste' && (
        <div className="space-y-3">
          <label className="block text-sm text-zinc-400">{t('textStory.pasteScriptLabel')}</label>
          <textarea
            value={state.pastedScript}
            onChange={(e) => updateState('pastedScript', e.target.value)}
            placeholder={t('textStory.pasteScriptPlaceholder')}
            className="w-full h-40 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 resize-none"
          />
          <button
            onClick={() => parseScript(state.pastedScript)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-colors"
            type="button"
          >
            {t('textStory.parseScript')}
          </button>
        </div>
      )}
      {state.scriptMode === 'ai' && (
        <AIGenerationPanel
          prompt={state.aiPrompt}
          onPromptChange={(prompt) => updateState('aiPrompt', prompt)}
          onGenerate={generateAIScript}
          isGenerating={state.isGenerating}
        />
      )}
      {state.scriptMode === 'manual' && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-400">{t('textStory.swapMessages')}</span>
          <button 
            onClick={swapAllMessages}
            className="px-4 py-1.5 bg-zinc-800 text-blue-400 text-sm font-medium rounded-full hover:bg-zinc-700 flex items-center gap-2 transition-colors"
            type="button"
          >
            {t('textStory.swapAll')}
          </button>
        </div>
      )}
      <div className="space-y-4">
        <div className="text-sm font-medium">{t('textStory.messagesCount', { count: state.messages.length })}</div>
        {state.messages.map((message, index) => (
          <div 
            key={message.id} 
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={`bg-zinc-900/50 border rounded-xl p-4 transition-all ${
              draggedIndex === index 
                ? 'opacity-50 border-blue-500' 
                : dragOverIndex === index 
                  ? 'border-blue-400 bg-blue-500/10' 
                  : 'border-zinc-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <GripVertical size={16} className="text-zinc-600 cursor-grab active:cursor-grabbing shrink-0" />
              <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-xs text-zinc-400 font-medium">
                {index + 1}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => updateMessage(message.id, { type: 'text' })}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    message.type === 'text' ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                  type="button"
                >
                  Text
                </button>
                <button
                  onClick={() => updateMessage(message.id, { type: 'image' })}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    message.type === 'image' ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                  type="button"
                >
                  Image
                </button>
              </div>
                <input
                  type="text"
                  value={message.content}
                  onChange={(e) => updateMessage(message.id, { content: e.target.value })}
                  placeholder={t('textStory.messagePlaceholder')}
                  className="flex-1 bg-transparent text-zinc-300 text-sm focus:outline-none placeholder-zinc-600"
                />
              <div className="flex gap-1">
                <button 
                  className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center hover:bg-amber-500/30 transition-colors"
                  type="button"
                >
                  <Smile size={14} />
                </button>
                <button 
                  onClick={() => updateMessage(message.id, { sender: message.sender === 'left' ? 'right' : 'left' })}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors text-xs font-bold ${
                    message.sender === 'left' 
                      ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600' 
                      : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                  }`}
                  type="button"
                >
                  {message.sender === 'left' ? 'L' : 'R'}
                </button>
                <button 
                  onClick={() => duplicateMessage(message.id)}
                  className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center hover:bg-blue-500/30 transition-colors"
                  type="button"
                >
                  <Copy size={14} />
                </button>
                <button 
                  onClick={() => deleteMessage(message.id)}
                  className="w-7 h-7 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500/30 transition-colors disabled:opacity-50"
                  disabled={state.messages.length <= 1}
                  type="button"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-6 mt-3 pl-7">
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">{t('textStory.delay')}</span>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={message.delay}
                  onChange={(e) => updateMessage(message.id, { delay: Math.max(0, Number(e.target.value)) })}
                  className="w-16 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">{t('textStory.animation')}</span>
                <div className="relative">
                  <select
                    value={message.animation}
                    onChange={(e) => updateMessage(message.id, { animation: e.target.value as TextAnimationType })}
                    className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-white focus:outline-none appearance-none pr-6 cursor-pointer focus:border-blue-500"
                  >
                    {TEXT_ANIMATIONS.map(anim => (
                      <option key={anim.id} value={anim.id}>{t(anim.labelKey)}</option>
                    ))}
                  </select>
                  <ChevronDown size={12} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button 
        onClick={addMessage}
        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-colors"
        type="button"
      >
        + {t('textStory.addMessage')}
      </button>
    </div>
  );
};







