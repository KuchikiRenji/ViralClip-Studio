import { useState, useRef } from 'react';
import { Layers, Plus, Trash2, Image, Type, X, Upload } from 'lucide-react';
import { Overlay, OverlayType } from './types';

interface OverlayManagerProps {
  overlays: Overlay[];
  onChange: (overlays: Overlay[]) => void;
}

import type { LucideIcon } from 'lucide-react';

interface OverlayTypeOption {
  type: OverlayType;
  label: string;
  icon: LucideIcon;
  color: string;
}

const OVERLAY_TYPES: OverlayTypeOption[] = [
  { type: 'text', label: 'Text', icon: Type, color: '#3b82f6' },
  { type: 'image', label: 'Image', icon: Image, color: '#10b981' },
  { type: 'logo', label: 'Logo', icon: Image, color: '#f59e0b' },
  { type: 'watermark', label: 'Watermark', icon: Layers, color: '#8b5cf6' },
];

export const OverlayManager = ({ overlays, onChange }: OverlayManagerProps) => {
  const [selectedOverlay, setSelectedOverlay] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addOverlay = (type: OverlayType) => {
    const newOverlay: Overlay = {
      id: `overlay_${Date.now()}`,
      type,
      enabled: true,
      position: { x: 50, y: 50 },
      size: { width: 200, height: 100 },
      content: type === 'text' ? 'New Text' : undefined,
    };
    onChange([...overlays, newOverlay]);
    setSelectedOverlay(newOverlay.id);
  };

  const updateOverlay = (id: string, updates: Partial<Overlay>) => {
    onChange(overlays.map((o) => (o.id === id ? { ...o, ...updates } : o)));
  };

  const deleteOverlay = (id: string) => {
    onChange(overlays.filter((o) => o.id !== id));
    if (selectedOverlay === id) setSelectedOverlay(null);
  };

  const handleImageUpload = (id: string, file: File) => {
    if (file.type.startsWith('image/')) {
      // Revoke old blob URL if it exists
      const oldOverlay = overlays.find((o) => o.id === id);
      if (oldOverlay?.imageUrl && oldOverlay.imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(oldOverlay.imageUrl);
      }
      
      const url = URL.createObjectURL(file);
      updateOverlay(id, { imageUrl: url, imageFile: file });
    }
  };

  const selected = overlays.find((o) => o.id === selectedOverlay);

  return (
    <div className="overlay-manager">
      <style>{`
        .overlay-manager {
          background: linear-gradient(135deg, #0f1419 0%, #1a1f2e 100%);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 16px;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          max-width: 100%;
          box-sizing: border-box;
        }

        @media (min-width: 375px) {
          .overlay-manager {
            border-radius: 18px;
          }
        }

        @media (min-width: 640px) {
          .overlay-manager {
            border-radius: 20px;
          }
        }

        .overlay-header {
          padding: 16px;
          background: linear-gradient(90deg, rgba(59, 130, 246, 0.1) 0%, transparent 100%);
          border-bottom: 1px solid rgba(59, 130, 246, 0.15);
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }

        @media (min-width: 375px) {
          .overlay-header {
            padding: 20px;
          }
        }

        @media (min-width: 640px) {
          .overlay-header {
            padding: 24px;
            flex-wrap: nowrap;
          }
        }

        .overlay-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        @media (min-width: 375px) {
          .overlay-header-left {
            gap: 16px;
          }
        }

        .overlay-icon {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-center;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);
          flex-shrink: 0;
        }

        .overlay-icon svg {
          width: 24px;
          height: 24px;
        }

        @media (min-width: 375px) {
          .overlay-icon {
            width: 56px;
            height: 56px;
            border-radius: 16px;
          }
          .overlay-icon svg {
            width: 28px;
            height: 28px;
          }
        }

        .overlay-title {
          font-size: 16px;
          font-weight: 800;
          color: #ffffff;
          margin-bottom: 4px;
        }

        .overlay-subtitle {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.5);
        }

        @media (min-width: 375px) {
          .overlay-title {
            font-size: 18px;
          }
          .overlay-subtitle {
            font-size: 12px;
          }
        }

        @media (min-width: 640px) {
          .overlay-title {
            font-size: 20px;
          }
          .overlay-subtitle {
            font-size: 13px;
          }
        }

        .overlay-add-menu {
          display: flex;
          gap: 6px;
          width: 100%;
          justify-content: flex-end;
        }

        @media (min-width: 375px) {
          .overlay-add-menu {
            gap: 8px;
            width: auto;
          }
        }

        .overlay-add-btn {
          padding: 8px 12px;
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 8px;
          color: #3b82f6;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        @media (min-width: 375px) {
          .overlay-add-btn {
            padding: 10px 16px;
            border-radius: 10px;
            font-size: 12px;
            gap: 6px;
          }
        }

        .overlay-add-btn:hover {
          background: rgba(59, 130, 246, 0.2);
          border-color: #3b82f6;
          transform: translateY(-1px);
        }

        .overlay-body {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        @media (min-width: 375px) {
          .overlay-body {
            padding: 20px;
            gap: 18px;
          }
        }

        @media (min-width: 640px) {
          .overlay-body {
            padding: 24px;
            flex-direction: row;
            gap: 20px;
          }
        }

        .overlay-list {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .overlay-empty {
          padding: 40px 20px;
          text-align: center;
          color: rgba(255, 255, 255, 0.3);
          font-size: 14px;
        }

        .overlay-item {
          padding: 16px;
          background: rgba(255, 255, 255, 0.03);
          border: 2px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .overlay-item:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.15);
        }

        .overlay-item.selected {
          background: rgba(59, 130, 246, 0.15);
          border-color: #3b82f6;
        }

        .overlay-item-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-center;
          background: var(--overlay-color);
          border-radius: 10px;
        }

        .overlay-item-info {
          flex: 1;
          min-width: 0;
        }

        .overlay-item-label {
          font-size: 14px;
          font-weight: 600;
          color: #ffffff;
          margin-bottom: 2px;
        }

        .overlay-item-type {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
          text-transform: uppercase;
        }

        .overlay-item-actions {
          display: flex;
          gap: 6px;
        }

        .overlay-item-btn {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-center;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .overlay-item-btn:hover {
          background: rgba(239, 68, 68, 0.2);
          border-color: #ef4444;
          color: #ef4444;
        }

        .overlay-editor {
          flex: 1;
          padding: 20px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .overlay-editor-empty {
          padding: 60px 20px;
          text-align: center;
          color: rgba(255, 255, 255, 0.3);
          font-size: 14px;
        }

        .overlay-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .overlay-label {
          font-size: 11px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .overlay-input {
          padding: 12px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #ffffff;
          font-size: 14px;
          font-weight: 500;
        }

        .overlay-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .overlay-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 8px;
          background: rgba(255, 255, 255, 0.06);
          border-radius: 4px;
          outline: none;
          cursor: pointer;
        }

        .overlay-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          border: 3px solid #0f1419;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 12px rgba(59, 130, 246, 0.6);
        }

        .overlay-upload-btn {
          padding: 12px;
          background: rgba(59, 130, 246, 0.1);
          border: 2px dashed rgba(59, 130, 246, 0.3);
          border-radius: 10px;
          color: #3b82f6;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          text-align: center;
          transition: all 0.2s ease;
        }

        .overlay-upload-btn:hover {
          background: rgba(59, 130, 246, 0.2);
          border-color: #3b82f6;
        }

        .overlay-toggle {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
        }

        .overlay-toggle.active {
          background: rgba(59, 130, 246, 0.15);
          border-color: #3b82f6;
        }

        .overlay-toggle-label {
          font-size: 13px;
          font-weight: 600;
          color: #ffffff;
        }

        .overlay-toggle-switch {
          width: 48px;
          height: 26px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 13px;
          position: relative;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .overlay-toggle.active .overlay-toggle-switch {
          background: #3b82f6;
        }

        .overlay-toggle-thumb {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 20px;
          height: 20px;
          background: #ffffff;
          border-radius: 50%;
          transition: all 0.3s ease;
        }

        .overlay-toggle.active .overlay-toggle-thumb {
          transform: translateX(22px);
        }
      `}</style>

      <div className="overlay-header">
        <div className="overlay-header-left">
          <div className="overlay-icon">
            <Layers size={28} color="#ffffff" strokeWidth={2} />
          </div>
          <div>
            <div className="overlay-title">Overlay Manager</div>
            <div className="overlay-subtitle">{overlays.length} overlay{overlays.length !== 1 ? 's' : ''} added</div>
          </div>
        </div>
        <div className="overlay-add-menu">
          {OVERLAY_TYPES.map((type) => (
            <button
              key={type.type}
              className="overlay-add-btn"
              onClick={() => addOverlay(type.type)}
              title={`Add ${type.label}`}
            >
              <type.icon size={16} />
              <Plus size={14} />
            </button>
          ))}
        </div>
      </div>

      <div className="overlay-body">
        <div className="overlay-list">
          {overlays.length === 0 ? (
            <div className="overlay-empty">
              No overlays yet. Click + buttons above to add text, images, or logos.
            </div>
          ) : (
            overlays.map((overlay) => {
              const typeInfo = OVERLAY_TYPES.find((t) => t.type === overlay.type);
              return (
                <div
                  key={overlay.id}
                  className={`overlay-item ${selectedOverlay === overlay.id ? 'selected' : ''}`}
                  onClick={() => setSelectedOverlay(overlay.id)}
                  style={{ '--overlay-color': typeInfo?.color } as React.CSSProperties}
                >
                  <div className="overlay-item-icon">
                    {typeInfo && <typeInfo.icon size={20} color="#ffffff" />}
                  </div>
                  <div className="overlay-item-info">
                    <div className="overlay-item-label">
                      {overlay.content || overlay.type.charAt(0).toUpperCase() + overlay.type.slice(1)}
                    </div>
                    <div className="overlay-item-type">{overlay.type}</div>
                  </div>
                  <div className="overlay-item-actions">
                    <button
                      className="overlay-item-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteOverlay(overlay.id);
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="overlay-editor">
          {!selected ? (
            <div className="overlay-editor-empty">
              Select an overlay to edit its properties
            </div>
          ) : (
            <>
              <div
                className={`overlay-toggle ${selected.enabled ? 'active' : ''}`}
                onClick={() => updateOverlay(selected.id, { enabled: !selected.enabled })}
              >
                <span className="overlay-toggle-label">
                  {selected.enabled ? 'Enabled' : 'Disabled'}
                </span>
                <div className="overlay-toggle-switch">
                  <div className="overlay-toggle-thumb" />
                </div>
              </div>

              {selected.type === 'text' && (
                <div className="overlay-field">
                  <label className="overlay-label">Text Content</label>
                  <input
                    type="text"
                    className="overlay-input"
                    value={selected.content || ''}
                    onChange={(e) => updateOverlay(selected.id, { content: e.target.value })}
                    placeholder="Enter text..."
                  />
                </div>
              )}

              {(selected.type === 'image' || selected.type === 'logo' || selected.type === 'watermark') && (
                <div className="overlay-field">
                  <label className="overlay-label">Image Upload</label>
                  <button
                    className="overlay-upload-btn"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
                    {selected.imageUrl ? 'Change Image' : 'Upload Image'}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(selected.id, file);
                    }}
                  />
                </div>
              )}

              <div className="overlay-field">
                <label className="overlay-label">Position X: {selected.position.x}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={selected.position.x}
                  onChange={(e) =>
                    updateOverlay(selected.id, {
                      position: { ...selected.position, x: Number(e.target.value) },
                    })
                  }
                  className="overlay-slider"
                />
              </div>

              <div className="overlay-field">
                <label className="overlay-label">Position Y: {selected.position.y}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={selected.position.y}
                  onChange={(e) =>
                    updateOverlay(selected.id, {
                      position: { ...selected.position, y: Number(e.target.value) },
                    })
                  }
                  className="overlay-slider"
                />
              </div>

              {selected.size && (
                <>
                  <div className="overlay-field">
                    <label className="overlay-label">Width: {selected.size.width}px</label>
                    <input
                      type="range"
                      min="50"
                      max="800"
                      value={selected.size.width}
                      onChange={(e) =>
                        updateOverlay(selected.id, {
                          size: { ...selected.size!, width: Number(e.target.value) },
                        })
                      }
                      className="overlay-slider"
                    />
                  </div>

                  <div className="overlay-field">
                    <label className="overlay-label">Height: {selected.size.height}px</label>
                    <input
                      type="range"
                      min="30"
                      max="600"
                      value={selected.size.height}
                      onChange={(e) =>
                        updateOverlay(selected.id, {
                          size: { ...selected.size!, height: Number(e.target.value) },
                        })
                      }
                      className="overlay-slider"
                    />
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
