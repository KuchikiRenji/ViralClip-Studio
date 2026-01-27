import { useState, useRef, ChangeEvent } from 'react';
import {
  Plus,
  Trash2,
  Video,
  Image,
  Send,
  User,
  Settings,
  Edit3,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Upload,
  X,
  MessageCircle
} from 'lucide-react';
import { TemplateBuilderState, Message, Participant, MessageSender } from './types';
import { useTranslation } from '../../../../hooks/useTranslation';

interface ConversationBuilderProps {
  state: TemplateBuilderState;
  onUpdateState: (updates: Partial<TemplateBuilderState>) => void;
}

const createMessage = (
  sender: MessageSender,
  content: string = '',
  type: 'text' | 'image' | 'video' = 'text'
): Message => ({
  id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  type,
  content,
  sender,
  delay: 1000,
  animation: 'typing',
  typingSpeed: 50,
  timestamp: new Date(),
});

export const ConversationBuilder = ({
  state,
  onUpdateState,
}) => {
  const { t } = useTranslation();
  const [newMessageContent, setNewMessageContent] = useState('');
  const [selectedSender, setSelectedSender] = useState<MessageSender>('left');
  const [editingParticipant, setEditingParticipant] = useState<string | null>(null);
  const [participantName, setParticipantName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addMessage = (content: string, type: 'text' | 'image' | 'video' = 'text') => {
    if (!content.trim() && type === 'text') return;

    const message = createMessage(selectedSender, content, type);
    onUpdateState({
      messages: [...state.messages, message],
    });
    setNewMessageContent('');
  };

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

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isVideo && !isImage) {
      alert('Please select a video or image file');
      return;
    }

    const url = URL.createObjectURL(file);
    const message = createMessage(
      selectedSender,
      isVideo ? 'Video attachment' : 'Image attachment',
      isVideo ? 'video' : 'image'
    );

    if (isVideo) {
      message.videoUrl = url;
      message.videoFile = file;
      message.videoThumbnail = url;
    } else {
      message.content = url;
    }

    onUpdateState({
      messages: [...state.messages, message],
    });


    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const updateParticipant = (participantId: string, updates: Partial<Participant>) => {
    onUpdateState({
      participants: state.participants.map(p =>
        p.id === participantId ? { ...p, ...updates } : p
      ),
    });
  };

  const getParticipantBySender = (sender: MessageSender): Participant | undefined => {
    return state.participants.find(p => p.position === sender);
  };

  const renderMessageBubble = (message: Message) => {
    const participant = getParticipantBySender(message.sender);
    const isVideo = message.type === 'video';
    const isImage = message.type === 'image';

    const getBubbleStyle = () => {
      if (!state.selectedTemplate) {
        return {
          bubbleClass: message.sender === 'right' ? 'bg-blue-500 text-white' : 'bg-zinc-700 text-zinc-100',
          bubbleShape: 'rounded-2xl'
        };
      }

      switch (state.selectedTemplate.platform) {
        case 'ios':
          return {
            bubbleClass: message.sender === 'right'
              ? 'bg-blue-500 text-white'
              : 'bg-zinc-200 text-zinc-900',
            bubbleShape: 'rounded-2xl'
          };
        case 'whatsapp':
          return {
            bubbleClass: message.sender === 'right'
              ? 'bg-emerald-500 text-white'
              : 'bg-zinc-100 text-zinc-900',
            bubbleShape: 'rounded-lg'
          };
        case 'instagram':
          return {
            bubbleClass: message.sender === 'right'
              ? 'bg-purple-500 text-white'
              : 'bg-zinc-100 text-zinc-900',
            bubbleShape: 'rounded-2xl'
          };
        case 'messenger':
          return {
            bubbleClass: message.sender === 'right'
              ? 'bg-blue-600 text-white'
              : 'bg-zinc-100 text-zinc-900',
            bubbleShape: 'rounded-2xl'
          };
        case 'telegram':
          return {
            bubbleClass: message.sender === 'right'
              ? 'bg-blue-400 text-white'
              : 'bg-zinc-100 text-zinc-900',
            bubbleShape: 'rounded-xl'
          };
        case 'discord':
          return {
            bubbleClass: message.sender === 'right'
              ? 'bg-indigo-500 text-white'
              : 'bg-zinc-200 text-zinc-900',
            bubbleShape: 'rounded-lg'
          };
        case 'slack':
          return {
            bubbleClass: message.sender === 'right'
              ? 'bg-purple-600 text-white'
              : 'bg-zinc-100 text-zinc-900',
            bubbleShape: 'rounded-lg'
          };
        case 'snapchat':
          return {
            bubbleClass: message.sender === 'right'
              ? 'bg-yellow-500 text-black'
              : 'bg-zinc-100 text-zinc-900',
            bubbleShape: 'rounded-2xl'
          };
        default:
          return {
            bubbleClass: message.sender === 'right' ? 'bg-blue-500 text-white' : 'bg-zinc-700 text-zinc-100',
            bubbleShape: 'rounded-2xl'
          };
      }
    };

    const { bubbleClass, bubbleShape } = getBubbleStyle();

    return (
      <div className={`flex items-end gap-2 mb-4 group ${
        message.sender === 'right' ? 'justify-end' : 'justify-start'
      }`}>
        {message.sender === 'left' && participant && (
          <div className="flex-shrink-0">
            {participant.avatar ? (
              <img
                src={participant.avatar}
                alt={participant.name}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                style={{ backgroundColor: participant.color }}
              >
                {participant.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        )}

        <div className={`max-w-[70%] ${
          message.sender === 'right' ? 'order-first' : 'order-last'
        }`}>
          <div className={`flex items-center gap-2 mb-1 text-xs text-zinc-400 ${
            message.sender === 'right' ? 'justify-end' : 'justify-start'
          }`}>
            <span className="font-medium">{participant?.name || 'Unknown'}</span>
            <span>{message.timestamp?.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}</span>
          </div>

          <div className={`relative group ${
            message.sender === 'right'
              ? 'ml-auto'
              : 'mr-auto'
          }`}>
            {isVideo && message.videoUrl ? (
              <div className={`relative p-2 ${bubbleClass} ${bubbleShape}`}>
                <video
                  src={message.videoUrl}
                  className="w-full max-w-[200px] rounded-lg"
                  controls
                  preload="metadata"
                />
                <div className="mt-1 text-xs opacity-75">
                  🎥 {t('templateBuilder.conversation.videoMessage')}
                </div>
              </div>
            ) : isImage && message.content ? (
              <div className={`relative p-2 ${bubbleClass} ${bubbleShape}`}>
                <img
                  src={message.content}
                  alt="Attachment"
                  className="w-full max-w-[200px] rounded-lg"
                />
                <div className="mt-1 text-xs opacity-75">
                  📷 {t('templateBuilder.conversation.photo')}
                </div>
              </div>
            ) : (
              <div className={`px-4 py-3 ${bubbleShape} ${bubbleClass}`}>
                <p className="text-sm leading-relaxed">{message.content}</p>
              </div>
            )}

            <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <button
                onClick={() => deleteMessage(message.id)}
                className="w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs"
                type="button"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        </div>

        {message.sender === 'right' && participant && (
          <div className="flex-shrink-0">
            {participant.avatar ? (
              <img
                src={participant.avatar}
                alt={participant.name}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                style={{ backgroundColor: participant.color }}
              >
                {participant.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">{t('templateBuilder.conversation.title')}</h2>
        <p className="text-zinc-400 max-w-2xl mx-auto">
          {t('templateBuilder.conversation.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-lg font-semibold">{t('templateBuilder.conversation.participants')}</h3>
          {state.participants.map((participant) => (
            <div key={participant.id} className="bg-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: participant.color }}
                >
                  {participant.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{participant.name}</h4>
                  <p className="text-xs text-zinc-400 capitalize">{participant.position === 'left' ? t('templateBuilder.conversation.leftSide') : t('templateBuilder.conversation.rightSide')}</p>
                </div>
                <button
                  onClick={() => {
                    setEditingParticipant(participant.id);
                    setParticipantName(participant.name);
                  }}
                  className="text-zinc-400 hover:text-white"
                  type="button"
                >
                  <Edit3 size={16} />
                </button>
              </div>

              {editingParticipant === participant.id && (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={participantName}
                    onChange={(e) => setParticipantName(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white text-sm"
                    placeholder="Participant name"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        updateParticipant(participant.id, { name: participantName });
                        setEditingParticipant(null);
                        setParticipantName('');
                      }}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded"
                      type="button"
                    >
                      {t('templateBuilder.conversation.save')}
                    </button>
                    <button
                      onClick={() => {
                        setEditingParticipant(null);
                        setParticipantName('');
                      }}
                      className="px-3 py-1 bg-zinc-600 hover:bg-zinc-500 text-white text-sm rounded"
                      type="button"
                    >
                      {t('templateBuilder.conversation.cancel')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="lg:col-span-2">
          <div className="bg-zinc-900 rounded-lg p-6 min-h-[400px]">
            <h3 className="text-lg font-semibold mb-4">{t('templateBuilder.conversation.preview')}</h3>

            <div className="space-y-1 max-h-[500px] overflow-y-auto">
              {state.messages.length === 0 ? (
                <div className="text-center py-12 text-zinc-500">
                  <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
                  <p>{t('templateBuilder.conversation.noMessages')}</p>
                </div>
              ) : (
                state.messages.map((message) => (
                  <div key={message.id}>
                    {renderMessageBubble(message)}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-zinc-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">{t('templateBuilder.conversation.addMessage')}</h3>

        <div className="flex items-center gap-4 mb-4">
          <label className="text-sm font-medium">{t('templateBuilder.conversation.from')}</label>
          <div className="flex gap-2">
            {state.participants.map((participant) => (
              <button
                key={participant.id}
                onClick={() => setSelectedSender(participant.position)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedSender === participant.position
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                }`}
                type="button"
              >
                {participant.name} ({participant.position})
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <textarea
                value={newMessageContent}
                onChange={(e) => setNewMessageContent(e.target.value)}
                placeholder={t('templateBuilder.conversation.typePlaceholder', { name: getParticipantBySender(selectedSender)?.name || 'participant' })}
                className="w-full px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 resize-none min-h-[60px]"
                rows={2}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    addMessage(newMessageContent);
                  }
                }}
              />
            </div>

            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*,image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-3 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded-lg transition-colors"
                type="button"
                title="Attach video or image"
              >
                <Upload size={20} />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-zinc-400">
              {newMessageContent.length > 0 && `${newMessageContent.length} characters`}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setNewMessageContent('')}
                disabled={!newMessageContent.trim()}
                className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-300 rounded-lg transition-colors"
                type="button"
              >
                {t('templateBuilder.conversation.clear')}
              </button>
              <button
                onClick={() => addMessage(newMessageContent)}
                disabled={!newMessageContent.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
                type="button"
              >
                <Send size={16} />
                {t('templateBuilder.conversation.send')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {state.messages.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-zinc-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{state.messages.length}</div>
            <div className="text-sm text-zinc-400">{t('templateBuilder.conversation.totalMessages')}</div>
          </div>
          <div className="bg-zinc-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-400">
              {state.messages.filter(m => m.sender === 'left').length}
            </div>
            <div className="text-sm text-zinc-400">{state.participants.find(p => p.position === 'left')?.name}</div>
          </div>
          <div className="bg-zinc-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">
              {state.messages.filter(m => m.sender === 'right').length}
            </div>
            <div className="text-sm text-zinc-400">{state.participants.find(p => p.position === 'right')?.name}</div>
          </div>
        </div>
      )}
    </div>
  );
};