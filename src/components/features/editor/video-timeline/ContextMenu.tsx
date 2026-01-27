import { useEffect, useRef } from 'react';
import {
  Scissors,
  Copy,
  Trash2,
  ArrowRightToLine,
  Music,
  ClipboardCopy,
  ClipboardPaste,
  ScissorsLineDashed,
  ArrowLeftToLine,
} from 'lucide-react';
import { ContextMenuProps } from './types';
import { useTranslation } from '../../../../hooks/useTranslation';

export const ContextMenu = ({
  state,
  onClose,
  onSplit,
  onDuplicate,
  onDelete,
  onRippleDelete,
  onDetachAudio,
  onCopy,
  onCut,
  onPaste,
  onTrimStart,
  onTrimEnd,
  clipboardHasContent,
}: ContextMenuProps) => {
  const { t } = useTranslation();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!state.isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [state.isOpen, onClose]);

  if (!state.isOpen) return null;

  const menuItems = [
    {
      icon: ScissorsLineDashed,
      label: t('timeline.contextMenu.cut'),
      shortcut: 'Ctrl+X',
      onClick: () => {
        onCut();
        onClose();
      },
      disabled: !state.clipId,
    },
    {
      icon: ClipboardCopy,
      label: t('timeline.contextMenu.copy'),
      shortcut: 'Ctrl+C',
      onClick: () => {
        onCopy();
        onClose();
      },
      disabled: !state.clipId,
    },
    {
      icon: ClipboardPaste,
      label: t('timeline.contextMenu.paste'),
      shortcut: 'Ctrl+V',
      onClick: () => {
        onPaste();
        onClose();
      },
      disabled: !clipboardHasContent,
    },
    {
      icon: Copy,
      label: t('timeline.duplicate'),
      shortcut: 'Ctrl+D',
      onClick: () => {
        onDuplicate();
        onClose();
      },
      disabled: !state.clipId,
    },
    { type: 'divider' as const },
    {
      icon: Scissors,
      label: t('timeline.split'),
      shortcut: 'Ctrl+Shift+S',
      onClick: () => {
        onSplit();
        onClose();
      },
      disabled: !state.clipId,
    },
    {
      icon: ArrowLeftToLine,
      label: t('timeline.trimStart'),
      shortcut: '[',
      onClick: () => {
        onTrimStart();
        onClose();
      },
      disabled: !state.clipId,
    },
    {
      icon: ArrowRightToLine,
      label: t('timeline.trimEnd'),
      shortcut: ']',
      onClick: () => {
        onTrimEnd();
        onClose();
      },
      disabled: !state.clipId,
    },
    { type: 'divider' as const },
    {
      icon: Trash2,
      label: t('timeline.delete'),
      shortcut: 'Del',
      onClick: () => {
        onDelete();
        onClose();
      },
      disabled: !state.clipId,
      danger: true,
    },
    {
      icon: ArrowRightToLine,
      label: t('timeline.rippleDelete'),
      shortcut: 'Shift+Del',
      onClick: () => {
        onRippleDelete();
        onClose();
      },
      disabled: !state.clipId,
      danger: true,
    },
    { type: 'divider' as const },
    {
      icon: Music,
      label: t('timeline.contextMenu.detachAudio'),
      onClick: () => {
        onDetachAudio();
        onClose();
      },
      disabled: !state.clipId,
    },
  ];

  return (
    <div
      ref={menuRef}
      className="fixed bg-zinc-800 border border-white/10 rounded-lg shadow-2xl py-1 z-50 min-w-[180px]"
      style={{
        left: state.x,
        top: state.y,
        transform: `translate(
          ${state.x + 200 > window.innerWidth ? '-100%' : '0'},
          ${state.y + 250 > window.innerHeight ? '-100%' : '0'}
        )`,
      }}
    >
      {menuItems.map((item, index) => {
        if (item.type === 'divider') {
          return <div key={index} className="h-px bg-white/10 my-1" />;
        }

        const Icon = item.icon;

        return (
          <button
            key={index}
            onClick={item.onClick}
            disabled={item.disabled}
            className={`w-full flex items-center gap-2 px-3 py-1.5 text-left text-[12px] transition-colors
              ${item.disabled ? 'text-zinc-600 cursor-not-allowed' : ''}
              ${item.danger && !item.disabled ? 'text-red-400 hover:bg-red-500/10' : ''}
              ${!item.danger && !item.disabled ? 'text-white hover:bg-white/10' : ''}`}
            type="button"
          >
            <Icon size={14} className="flex-shrink-0" />
            <span className="flex-1">{item.label}</span>
            {item.shortcut && (
              <span className="text-[10px] text-zinc-500 ml-2">{item.shortcut}</span>
            )}
          </button>
        );
      })}
    </div>
  );
};
