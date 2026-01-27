import { RefObject, DragEvent, ChangeEvent } from 'react';
import { FolderOpen, Type, Music, LayoutTemplate, Plus, Play, FileType } from 'lucide-react';
import { MediaAsset } from '../../../types';
import { TRANSITIONS } from '../../../constants';
import { MediaBrowserTab } from './types';
interface MediaBrowserProps {
  assets: MediaAsset[];
  activeTab: MediaBrowserTab;
  highlightedAssetId: string | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onTabChange: (tab: MediaBrowserTab) => void;
  onAssetClick: (assetId: string) => void;
  onAssetDoubleClick: (asset: MediaAsset) => void;
  onDragStart: (e: DragEvent, asset: MediaAsset) => void;
  onImportMedia: (e: ChangeEvent<HTMLInputElement>) => void;
}
export const MediaBrowser = ({
  assets,
  activeTab,
  highlightedAssetId,
  fileInputRef,
  onTabChange,
  onAssetClick,
  onAssetDoubleClick,
  onDragStart,
  onImportMedia,
}) => {
  const tabs: { id: MediaBrowserTab; icon: typeof FolderOpen }[] = [
    { id: 'media', icon: FolderOpen },
    { id: 'text', icon: Type },
    { id: 'audio', icon: Music },
    { id: 'transition', icon: LayoutTemplate },
  ];
  return (
    <div className="flex flex-col h-full bg-surface-dark border-r border-white/5">
      <div className="p-4 border-b border-white/5 bg-zinc-900/50">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all border border-blue-500/50 group"
        >
          <Plus size={20} className="group-hover:scale-110 transition-transform" /> Import Media
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={onImportMedia}
          className="hidden"
          multiple
          accept="video/*,image/*,audio/*"
        />
      </div>
      <div className="flex border-b border-white/5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 py-3 flex justify-center items-center border-b-2 transition-colors ${activeTab === tab.id ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-gray-500 hover:text-white hover:bg-white/5'}`}
          >
            <tab.icon size={16} />
          </button>
        ))}
      </div>
      <div className="p-3 overflow-y-auto flex-1 custom-scrollbar pb-20">
        {activeTab === 'media' && (
          <div className="grid grid-cols-2 gap-3">
            {assets.filter((a) => a.type === 'video' || a.type === 'image').map((asset) => (
              <div
                key={asset.id}
                draggable
                onDragStart={(e) => onDragStart(e, asset)}
                onClick={() => onAssetClick(asset.id)}
                onDoubleClick={() => onAssetDoubleClick(asset)}
                className={`aspect-square bg-zinc-900 rounded-xl overflow-hidden cursor-pointer active:cursor-grabbing relative group transition-all hover:shadow-lg ${highlightedAssetId === asset.id ? 'border-2 border-blue-500 shadow-md shadow-blue-900/20' : 'border border-white/5 hover:border-blue-500'}`}
              >
                <img src={asset.thumbnail || asset.src} className="w-full h-full object-cover pointer-events-none" alt="" loading="lazy" />
                <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/90 to-transparent text-[10px] font-bold text-white truncate">{asset.title}</div>
                <div className="absolute top-2 right-2 bg-black/60 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play size={12} className="text-white" />
                </div>
              </div>
            ))}
          </div>
        )}
        {activeTab === 'transition' && (
          <div className="space-y-3">
            {TRANSITIONS.map((asset) => (
              <div
                key={asset.id}
                draggable
                onDragStart={(e) => onDragStart(e, asset)}
                className="p-3 bg-zinc-900 border border-white/10 rounded-xl hover:border-purple-500 cursor-grab active:cursor-grabbing group flex items-center gap-3 transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
                  <LayoutTemplate size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white text-xs truncate">{asset.title}</h3>
                </div>
              </div>
            ))}
          </div>
        )}
        {activeTab === 'text' && (
          <div className="space-y-3">
            {assets.filter((a) => a.type === 'text').length === 0 ? (
              <div className="p-4 bg-zinc-900 border border-white/10 rounded-xl text-zinc-400 text-xs text-center">
                No text layers available
              </div>
            ) : (
              assets.filter((a) => a.type === 'text').map((asset) => (
                <div
                  key={asset.id}
                  draggable
                  onDragStart={(e) => onDragStart(e, asset)}
                  onClick={() => onAssetClick(asset.id)}
                  onDoubleClick={() => onAssetDoubleClick(asset)}
                  className={`p-4 bg-zinc-900 rounded-xl cursor-grab active:cursor-grabbing group transition-all ${highlightedAssetId === asset.id ? 'border-2 border-blue-500' : 'border border-white/10 hover:border-blue-500'}`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-bold text-white text-sm group-hover:text-blue-400">{asset.title}</h3>
                    <FileType size={14} className="text-gray-500" />
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        {activeTab === 'audio' && (
          <div className="space-y-3">
            {assets.filter((a) => a.type === 'audio').map((asset) => (
              <div
                key={asset.id}
                draggable
                onDragStart={(e) => onDragStart(e, asset)}
                onClick={() => onAssetClick(asset.id)}
                onDoubleClick={() => onAssetDoubleClick(asset)}
                className={`p-3 bg-zinc-900 rounded-xl cursor-pointer active:cursor-grabbing group flex items-center gap-3 transition-all ${highlightedAssetId === asset.id ? 'border-2 border-green-500' : 'border border-white/10 hover:border-green-500'}`}
              >
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                  <Music size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white text-xs truncate">{asset.title}</h3>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};