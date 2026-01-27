import { useState, useRef } from 'react';
import {
  GripVertical,
  Clock,
  Play,
  Pause,
  Trash2,
  Copy,
  Settings,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  Zap
} from 'lucide-react';
import { TemplateBuilderState, Message, MessageSender } from './types';
import { useTranslation } from '../../../../hooks/useTranslation';

interface MessageTimelineEditorProps {
  state: TemplateBuilderState;
  onUpdateState: (updates: Partial<TemplateBuilderState>) => void;
}

interface DragState {
  draggedIndex: number | null;
  dragOverIndex: number | null;
}

export const MessageTimelineEditor = ({
  state,
  onUpdateState,
}) => {
  const { t } = useTranslation();
  const [dragState, setDragState] = useState<DragState>({
    draggedIndex: null,
    dragOverIndex: null,
  });
  const [expandedMessage, setExpandedMessage] = useState<string | null>(null);

  const updateMessage = (messageId: string, updates: Partial<Message>) => {
    onUpdateState({
      messages: state.messages.map(msg =>
        msg.id === messageId ? { ...msg, ...updates } : msg
      ),
    });
  };

  const deleteMessage = (messageId: string) => {
    onUpdateState({
      messages: state.messages.filter(msg => msg.id !== messageId),
    });
  };

  const duplicateMessage = (messageId: string) => {
    const message = state.messages.find(msg => msg.id === messageId);
    if (!message) return;

    const newMessage: Message = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      delay: message.delay + 500,
      timestamp: new Date(),
    };

    const index = state.messages.findIndex(msg => msg.id === messageId);
    const newMessages = [...state.messages];
    newMessages.splice(index + 1, 0, newMessage);

    onUpdateState({ messages: newMessages });
  };

  const moveMessage = (fromIndex: number, toIndex: number) => {
    const newMessages = [...state.messages];
    const [movedMessage] = newMessages.splice(fromIndex, 1);
    newMessages.splice(toIndex, 0, movedMessage);
    onUpdateState({ messages: newMessages });
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDragState({ draggedIndex: index, dragOverIndex: null });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragState(prev => ({ ...prev, dragOverIndex: index }));
  };

  const handleDragEnd = () => {
    setDragState({ draggedIndex: null, dragOverIndex: null });
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const { draggedIndex } = dragState;

    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      moveMessage(draggedIndex, dropIndex);
    }

    setDragState({ draggedIndex: null, dragOverIndex: null });
  };

  const calculateTotalDuration = (): number => {
    let totalTime = 0;
    state.messages.forEach((message, index) => {
      const delay = message.delay || state.timingConfig.messageDelay;
      const typingDuration = (message.content.length / (message.typingSpeed || state.timingConfig.typingSpeed)) * 1000;
      const readDelay = state.timingConfig.readDelay;

      totalTime += delay + typingDuration + readDelay;
    });
    return totalTime;
  };

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getParticipantName = (sender: MessageSender): string => {
    const participant = state.participants.find(p => p.position === sender);
    return participant?.name || 'Unknown';
  };

  const renderMessageRow = (message: Message, index: number) => {
    const isExpanded = expandedMessage === message.id;
    const isDragging = dragState.draggedIndex === index;
    const isDragOver = dragState.dragOverIndex === index;

    return (
      <div
        key={message.id}
        draggable
        onDragStart={(e) => handleDragStart(e, index)}
        onDragOver={(e) => handleDragOver(e, index)}
        onDrop={(e) => handleDrop(e, index)}
        onDragEnd={handleDragEnd}
        className={`group relative bg-zinc-800 rounded-lg border transition-all ${
          isDragging
            ? 'opacity-50 scale-95'
            : isDragOver
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-zinc-700 hover:border-zinc-600'
        }`}
      >
        <div className="absolute left-2 top-1/2 -translate-y-1/2 cursor-move opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical size={16} className="text-zinc-400" />
        </div>

        <div className="pl-10 pr-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-zinc-300">
                  #{index + 1}
                </span>
                <span className="text-xs text-zinc-500">
                  {getParticipantName(message.sender)}
                </span>
              </div>

              <div className={`px-2 py-1 rounded text-xs font-medium ${
                message.sender === 'left'
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'bg-green-500/20 text-green-400'
              }`}>
                {message.sender}
              </div>

              {message.type !== 'text' && (
                <div className="px-2 py-1 rounded text-xs font-medium bg-purple-500/20 text-purple-400">
                  {message.type}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setExpandedMessage(isExpanded ? null : message.id)}
                className="p-1 text-zinc-400 hover:text-white transition-colors"
                type="button"
              >
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              <button
                onClick={() => duplicateMessage(message.id)}
                className="p-1 text-zinc-400 hover:text-green-400 transition-colors"
                type="button"
                title={t('templateBuilder.timeline.duplicate')}
              >
                <Copy size={16} />
              </button>

              <button
                onClick={() => deleteMessage(message.id)}
                className="p-1 text-zinc-400 hover:text-red-400 transition-colors"
                type="button"
                title={t('templateBuilder.timeline.delete')}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          <div className="mb-3">
            <p className="text-sm text-zinc-200 line-clamp-2">
              {message.type === 'video' || message.type === 'image'
                ? `${message.type.charAt(0).toUpperCase() + message.type.slice(1)} attachment`
                : message.content
              }
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs text-zinc-400">
            <div className="flex items-center gap-1">
              <Clock size={12} />
              <span>{t('templateBuilder.timeline.delay')} {(message.delay || state.timingConfig.messageDelay) / 1000}s</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap size={12} />
              <span>{t('templateBuilder.timeline.typing')} {message.typingSpeed || state.timingConfig.typingSpeed} cps</span>
            </div>
          </div>

          {isExpanded && (
            <div className="mt-4 pt-4 border-t border-zinc-700 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    {t('templateBuilder.timeline.messageDelay')}
                  </label>
                  <input
                    type="number"
                    value={(message.delay || state.timingConfig.messageDelay) / 1000}
                    onChange={(e) => updateMessage(message.id, {
                      delay: parseFloat(e.target.value) * 1000
                    })}
                    className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white text-sm"
                    min="0"
                    step="0.1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    {t('templateBuilder.timeline.typingSpeed')}
                  </label>
                  <input
                    type="number"
                    value={message.typingSpeed || state.timingConfig.typingSpeed}
                    onChange={(e) => updateMessage(message.id, {
                      typingSpeed: parseFloat(e.target.value)
                    })}
                    className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white text-sm"
                    min="1"
                    max="100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  {t('templateBuilder.timeline.animationType')}
                </label>
                <select
                  value={message.animation}
                  onChange={(e) => updateMessage(message.id, {
                    animation: e.target.value as Message['animation']
                  })}
                  className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white text-sm"
                >
                  <option value="none">{t('templateBuilder.animation.none')}</option>
                  <option value="fade">{t('templateBuilder.animation.fade')}</option>
                  <option value="slide-up">{t('templateBuilder.animation.slideUp')}</option>
                  <option value="typewriter">{t('templateBuilder.animation.typewriter')}</option>
                  <option value="typing">{t('templateBuilder.animation.typing')}</option>
                </select>
              </div>

              {message.type === 'text' && (
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    {t('templateBuilder.timeline.messageContent')}
                  </label>
                  <textarea
                    value={message.content}
                    onChange={(e) => updateMessage(message.id, { content: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white text-sm resize-none"
                    rows={3}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">{t('templateBuilder.timeline.title')}</h2>
        <p className="text-zinc-400 max-w-2xl mx-auto">
          {t('templateBuilder.timeline.subtitle')}
        </p>
      </div>

      <div className="bg-zinc-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Settings size={20} />
          {t('templateBuilder.timeline.globalSettings')}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              {t('templateBuilder.timeline.defaultDelay')}
            </label>
            <input
              type="number"
              value={state.timingConfig.messageDelay / 1000}
              onChange={(e) => onUpdateState({
                timingConfig: {
                  ...state.timingConfig,
                  messageDelay: parseFloat(e.target.value) * 1000
                }
              })}
              className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white text-sm"
              min="0"
              step="0.1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              {t('templateBuilder.timeline.defaultTypingSpeed')}
            </label>
            <input
              type="number"
              value={state.timingConfig.typingSpeed}
              onChange={(e) => onUpdateState({
                timingConfig: {
                  ...state.timingConfig,
                  typingSpeed: parseFloat(e.target.value)
                }
              })}
              className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white text-sm"
              min="1"
              max="100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              {t('templateBuilder.timeline.readDelay')}
            </label>
            <input
              type="number"
              value={state.timingConfig.readDelay / 1000}
              onChange={(e) => onUpdateState({
                timingConfig: {
                  ...state.timingConfig,
                  readDelay: parseFloat(e.target.value) * 1000
                }
              })}
              className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white text-sm"
              min="0"
              step="0.1"
            />
          </div>
        </div>
      </div>

      <div className="bg-zinc-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{t('templateBuilder.timeline.overview')}</h3>
          <div className="text-sm text-zinc-400">
            {t('templateBuilder.timeline.totalDuration')} {formatDuration(calculateTotalDuration())}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{state.messages.length}</div>
            <div className="text-sm text-zinc-400">{t('templateBuilder.timeline.messages')}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {state.messages.filter(m => m.sender === 'left').length}
            </div>
            <div className="text-sm text-zinc-400">{t('templateBuilder.timeline.leftSide')}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">
              {state.messages.filter(m => m.sender === 'right').length}
            </div>
            <div className="text-sm text-zinc-400">{t('templateBuilder.timeline.rightSide')}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-400">
              {state.messages.filter(m => m.type !== 'text').length}
            </div>
            <div className="text-sm text-zinc-400">{t('templateBuilder.timeline.media')}</div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">{t('templateBuilder.timeline.messageTimeline')}</h3>

        {state.messages.length === 0 ? (
          <div className="text-center py-12 bg-zinc-800 rounded-lg">
            <Clock size={48} className="mx-auto mb-4 text-zinc-600" />
            <p className="text-zinc-400">{t('templateBuilder.timeline.noMessages')}</p>
            <p className="text-zinc-500 text-sm">{t('templateBuilder.timeline.goToConversation')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {state.messages.map((message, index) => renderMessageRow(message, index))}
          </div>
        )}
      </div>

      {state.messages.length > 0 && (
        <div className="bg-zinc-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">{t('templateBuilder.timeline.bulkActions')}</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onUpdateState({
                messages: [...state.messages].reverse()
              })}
              className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded-lg transition-colors flex items-center gap-2"
              type="button"
            >
              <RotateCcw size={16} />
              {t('templateBuilder.timeline.reverseOrder')}
            </button>

            <button
              onClick={() => {
                const updatedMessages = state.messages.map((msg, index) => ({
                  ...msg,
                  delay: index * 1000 + state.timingConfig.messageDelay
                }));
                onUpdateState({ messages: updatedMessages });
              }}
              className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded-lg transition-colors flex items-center gap-2"
              type="button"
            >
              <Clock size={16} />
              {t('templateBuilder.timeline.autoSpacing')}
            </button>

            <button
              onClick={() => {
                const updatedMessages = state.messages.map(msg => ({
                  ...msg,
                  typingSpeed: state.timingConfig.typingSpeed
                }));
                onUpdateState({ messages: updatedMessages });
              }}
              className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded-lg transition-colors flex items-center gap-2"
              type="button"
            >
              <Zap size={16} />
              {t('templateBuilder.timeline.resetSpeeds')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};