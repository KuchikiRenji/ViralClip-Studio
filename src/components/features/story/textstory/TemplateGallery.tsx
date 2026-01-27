import { Check } from 'lucide-react';
import { TemplateConfig } from './types';
import { useTranslation } from '../../../../hooks/useTranslation';
import {
  IMessageIcon,
  WhatsAppIcon,
  InstagramIcon,
  MessengerIcon,
  TelegramIcon,
  DiscordIcon,
  SnapchatIcon,
  SlackIcon,
} from '../../../shared/SocialIcons';

interface TemplateGalleryProps {
  selectedTemplate: TemplateConfig | null;
  onSelectTemplate: (template: TemplateConfig) => void;
}

const MESSAGING_TEMPLATES: TemplateConfig[] = [
  {
    id: 'ios-messages',
    name: 'iOS Messages',
    platform: 'ios',
    previewImage: '/templates/ios-preview.png',
    sampleConversation: [
      {
        id: 'ios-1',
        type: 'text',
        content: 'Hey! How are you doing?',
        sender: 'left',
        delay: 0,
        animation: 'typing',
        readStatus: 'read',
        timestamp: new Date(),
      },
      {
        id: 'ios-2',
        type: 'text',
        content: 'I\'m great! Just finished that project we talked about 😊',
        sender: 'right',
        delay: 1000,
        animation: 'typing',
        readStatus: 'read',
        timestamp: new Date(),
      },
    ],
    features: ['Blue bubbles', 'Delivered/Read receipts', 'Typing indicators', 'iMessage effects'],
    colorScheme: {
      primary: '#007AFF',
      secondary: '#E5E5EA',
      accent: '#34C759',
    },
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    platform: 'whatsapp',
    previewImage: '/templates/whatsapp-preview.png',
    sampleConversation: [
      {
        id: 'wa-1',
        type: 'text',
        content: 'Hey! Check out this video I made 🎥',
        sender: 'left',
        delay: 0,
        animation: 'typing',
        readStatus: 'read',
        timestamp: new Date(),
      },
      {
        id: 'wa-2',
        type: 'video',
        content: 'Amazing work! 🔥',
        sender: 'right',
        delay: 800,
        animation: 'typing',
        readStatus: 'read',
        timestamp: new Date(),
      },
    ],
    features: ['Green bubbles', 'Double ticks', 'Voice messages', 'Document sharing'],
    colorScheme: {
      primary: '#25D366',
      secondary: '#E1F5E4',
      accent: '#128C7E',
    },
  },
  {
    id: 'instagram-dm',
    name: 'Instagram DM',
    platform: 'instagram',
    previewImage: '/templates/instagram-preview.png',
    sampleConversation: [
      {
        id: 'ig-1',
        type: 'text',
        content: 'Your story is fire! 🔥',
        sender: 'left',
        delay: 0,
        animation: 'typing',
        timestamp: new Date(),
      },
      {
        id: 'ig-2',
        type: 'text',
        content: 'Thanks! Working on something new...',
        sender: 'right',
        delay: 600,
        animation: 'typing',
        timestamp: new Date(),
      },
    ],
    features: ['Instagram branding', 'Story replies', 'Reels sharing', 'Emoji reactions'],
    colorScheme: {
      primary: '#E4405F',
      secondary: '#FAFAFA',
      accent: '#833AB4',
    },
  },
  {
    id: 'messenger',
    name: 'Messenger',
    platform: 'messenger',
    previewImage: '/templates/messenger-preview.png',
    sampleConversation: [
      {
        id: 'fb-1',
        type: 'text',
        content: 'Hey! Long time no see 👋',
        sender: 'left',
        delay: 0,
        animation: 'typing',
        timestamp: new Date(),
      },
      {
        id: 'fb-2',
        type: 'text',
        content: 'I know! How have you been?',
        sender: 'right',
        delay: 700,
        animation: 'typing',
        timestamp: new Date(),
      },
    ],
    features: ['Facebook branding', 'Like reactions', 'GIF support', 'Voice clips'],
    colorScheme: {
      primary: '#0084FF',
      secondary: '#F0F2F5',
      accent: '#42A5F5',
    },
  },
  {
    id: 'telegram',
    name: 'Telegram',
    platform: 'telegram',
    previewImage: '/templates/telegram-preview.png',
    sampleConversation: [
      {
        id: 'tg-1',
        type: 'text',
        content: 'Check this out! 📎',
        sender: 'left',
        delay: 0,
        animation: 'typing',
        timestamp: new Date(),
      },
      {
        id: 'tg-2',
        type: 'text',
        content: 'Wow, this is incredible!',
        sender: 'right',
        delay: 500,
        animation: 'typing',
        timestamp: new Date(),
      },
    ],
    features: ['Cloud storage', 'Secret chats', 'Bots integration', 'Channels support'],
    colorScheme: {
      primary: '#0088CC',
      secondary: '#FFFFFF',
      accent: '#35A1DE',
    },
  },
  {
    id: 'discord',
    name: 'Discord',
    platform: 'discord',
    previewImage: '/templates/discord-preview.png',
    sampleConversation: [
      {
        id: 'dc-1',
        type: 'text',
        content: 'Hey @everyone, new video dropped! 🎮',
        sender: 'left',
        delay: 0,
        animation: 'typing',
        timestamp: new Date(),
      },
      {
        id: 'dc-2',
        type: 'text',
        content: 'First! 🚀',
        sender: 'right',
        delay: 400,
        animation: 'typing',
        timestamp: new Date(),
      },
    ],
    features: ['Server channels', '@mentions', 'Roles system', 'Voice channels'],
    colorScheme: {
      primary: '#5865F2',
      secondary: '#36393F',
      accent: '#57F287',
    },
  },
  {
    id: 'slack',
    name: 'Slack',
    platform: 'slack',
    previewImage: '/templates/slack-preview.png',
    sampleConversation: [
      {
        id: 'sl-1',
        type: 'text',
        content: 'Hey team, check out the new feature! ✨',
        sender: 'left',
        delay: 0,
        animation: 'typing',
        timestamp: new Date(),
      },
      {
        id: 'sl-2',
        type: 'text',
        content: 'Looks great! When is the rollout?',
        sender: 'right',
        delay: 600,
        animation: 'typing',
        timestamp: new Date(),
      },
    ],
    features: ['Workspace channels', 'Threaded replies', 'File sharing', 'Integrations'],
    colorScheme: {
      primary: '#4A154B',
      secondary: '#FFFFFF',
      accent: '#36C5F0',
    },
  },
  {
    id: 'snapchat',
    name: 'Snapchat',
    platform: 'snapchat',
    previewImage: '/templates/snapchat-preview.png',
    sampleConversation: [
      {
        id: 'sc-1',
        type: 'text',
        content: 'Just sent you something 🔥',
        sender: 'left',
        delay: 0,
        animation: 'typing',
        timestamp: new Date(),
      },
      {
        id: 'sc-2',
        type: 'text',
        content: 'Ooh can\'t wait to see!',
        sender: 'right',
        delay: 300,
        animation: 'typing',
        timestamp: new Date(),
      },
    ],
    features: ['Snap streaks', 'Disappearing messages', 'Bitmoji integration', 'Discover content'],
    colorScheme: {
      primary: '#FFFC00',
      secondary: '#000000',
      accent: '#FFFFFF',
    },
  },
];

const getPlatformIcon = (platform: string) => {
  switch (platform) {
    case 'ios': return <IMessageIcon size={20} className="text-blue-500" />;
    case 'whatsapp': return <WhatsAppIcon size={20} className="text-green-500" />;
    case 'instagram': return <InstagramIcon size={20} className="text-pink-500" />;
    case 'messenger': return <MessengerIcon size={20} className="text-blue-600" />;
    case 'telegram': return <TelegramIcon size={20} className="text-blue-400" />;
    case 'discord': return <DiscordIcon size={20} className="text-indigo-500" />;
    case 'slack': return <SlackIcon size={20} className="text-purple-600" />;
    case 'snapchat': return <SnapchatIcon size={20} className="text-yellow-500" />;
    default: return <IMessageIcon size={20} className="text-gray-500" />;
  }
};

export const TemplateGallery = ({
  selectedTemplate,
  onSelectTemplate,
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">{t('templateBuilder.gallery.title')}</h2>
        <p className="text-zinc-400 max-w-2xl mx-auto">
          {t('templateBuilder.gallery.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MESSAGING_TEMPLATES.map((template) => {
          const isSelected = selectedTemplate?.id === template.id;

          return (
            <div
              key={template.id}
              onClick={() => onSelectTemplate(template)}
              className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all hover:scale-105 ${
                isSelected
                  ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20'
                  : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
              }`}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <Check size={14} className="text-white" />
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                {getPlatformIcon(template.platform)}
                <div>
                  <h3 className="font-semibold text-lg">{template.name}</h3>
                  <p className="text-sm text-zinc-400">{template.platform}</p>
                </div>
              </div>

              <div className="bg-zinc-900 rounded-lg p-3 mb-4 min-h-[120px]">
                <div className="space-y-2">
                  {template.sampleConversation.slice(0, 2).map((message, index) => (
                    <div
                      key={message.id}
                      className={`text-xs px-3 py-2 rounded-lg max-w-[80%] ${
                        message.sender === 'left'
                          ? 'bg-zinc-700 text-zinc-300 ml-auto'
                          : 'bg-zinc-600 text-zinc-200'
                      }`}
                    >
                      {message.content}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-zinc-300">{t('templateBuilder.gallery.features')}</h4>
                <div className="flex flex-wrap gap-1">
                  {template.features.slice(0, 3).map((feature, index) => (
                    <span
                      key={index}
                      className="text-xs px-2 py-1 bg-zinc-700 text-zinc-300 rounded-full"
                    >
                      {feature}
                    </span>
                  ))}
                  {template.features.length > 3 && (
                    <span className="text-xs px-2 py-1 bg-zinc-700 text-zinc-400 rounded-full">
                      {t('templateBuilder.gallery.moreFeatures', { count: template.features.length - 3 })}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-1 mt-4">
                <div
                  className="w-4 h-4 rounded-full border border-zinc-600"
                  style={{ backgroundColor: template.colorScheme.primary }}
                />
                <div
                  className="w-4 h-4 rounded-full border border-zinc-600"
                  style={{ backgroundColor: template.colorScheme.secondary }}
                />
                <div
                  className="w-4 h-4 rounded-full border border-zinc-600"
                  style={{ backgroundColor: template.colorScheme.accent }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {selectedTemplate && (
        <div className="mt-8 p-6 bg-zinc-800/50 rounded-xl border border-zinc-700">
          <div className="flex items-center gap-3 mb-4">
            {getPlatformIcon(selectedTemplate.platform)}
            <h3 className="text-xl font-semibold">{t('templateBuilder.gallery.selected', { name: selectedTemplate.name })}</h3>
          </div>
          <p className="text-zinc-400 mb-4">
            {t('templateBuilder.gallery.selectedDesc', { name: selectedTemplate.name, platform: selectedTemplate.platform })}
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedTemplate.features.map((feature, index) => (
              <span
                key={index}
                className="text-sm px-3 py-1 bg-zinc-700 text-zinc-300 rounded-full"
              >
                {feature}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};