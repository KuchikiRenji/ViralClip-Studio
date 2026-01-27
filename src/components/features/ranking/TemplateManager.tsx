import { useState, useEffect } from 'react';
import { Save, FolderOpen, Copy, Trash2, Download, Upload } from 'lucide-react';
import { RankingConfig, ProjectTemplate } from './types';

interface TemplateManagerProps {
  currentConfig: RankingConfig;
  onLoadTemplate: (config: Partial<RankingConfig>) => void;
}

const TEMPLATE_STORAGE_KEY = 'ranking_templates';

const CATEGORY_COLORS: Record<string, string> = {
  gaming: '#10b981',
  beauty: '#ec4899',
  tech: '#3b82f6',
  food: '#f59e0b',
  sports: '#8b5cf6',
  general: '#6b7280',
};

export const TemplateManager = ({
  currentConfig,
  onLoadTemplate,
}) => {
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateCategory, setTemplateCategory] = useState<ProjectTemplate['category']>('general');

  useEffect(() => {
    const stored = localStorage.getItem(TEMPLATE_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Array<Omit<ProjectTemplate, 'createdAt'> & { createdAt: string }>;
        setTemplates(parsed.map((t) => ({ ...t, createdAt: new Date(t.createdAt) })));
      } catch {
        setTemplates([]);
      }
    }
  }, []);

  const saveToStorage = (updatedTemplates: ProjectTemplate[]) => {
    try {
      localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(updatedTemplates));
      setTemplates(updatedTemplates);
    } catch {
    }
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim()) return;

    const newTemplate: ProjectTemplate = {
      id: `template_${Date.now()}`,
      name: templateName.trim(),
      description: templateDescription.trim(),
      category: templateCategory,
      config: {
        title: currentConfig.title,
        titleStroke: currentConfig.titleStroke,
        titleStrokeColor: currentConfig.titleStrokeColor,
        videoHeight: currentConfig.videoHeight,
        background: currentConfig.background,
        enableTitleDrag: currentConfig.enableTitleDrag,
        captionsEnabled: currentConfig.captionsEnabled,
        transitionSettings: currentConfig.transitionSettings,
        backgroundMusic: currentConfig.backgroundMusic
          ? {
              volume: currentConfig.backgroundMusic.volume,
              fadeIn: currentConfig.backgroundMusic.fadeIn,
              fadeOut: currentConfig.backgroundMusic.fadeOut,
              ducking: currentConfig.backgroundMusic.ducking,
              duckingAmount: currentConfig.backgroundMusic.duckingAmount,
            }
          : undefined,
        exportSettings: currentConfig.exportSettings,
        rankingStyle: currentConfig.rankingStyle,
      },
      createdAt: new Date(),
    };

    saveToStorage([...templates, newTemplate]);
    setShowSaveDialog(false);
    setTemplateName('');
    setTemplateDescription('');
    setTemplateCategory('general');
  };

  const handleLoadTemplate = (template: ProjectTemplate) => {
    onLoadTemplate(template.config);
  };

  const handleDeleteTemplate = (id: string) => {
    saveToStorage(templates.filter((t) => t.id !== id));
  };

  const handleDuplicateTemplate = (template: ProjectTemplate) => {
    const duplicate: ProjectTemplate = {
      ...template,
      id: `template_${Date.now()}`,
      name: `${template.name} (Copy)`,
      createdAt: new Date(),
    };
    saveToStorage([...templates, duplicate]);
  };

  const handleExportTemplate = (template: ProjectTemplate) => {
    const dataStr = JSON.stringify(template, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${template.name.replace(/\s+/g, '_')}_template.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportTemplate = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string) as ProjectTemplate;
        imported.id = `template_${Date.now()}`;
        imported.createdAt = new Date();
        saveToStorage([...templates, imported]);
      } catch {
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="template-manager">
      <style>{`
        .template-manager {
          background: linear-gradient(135deg, #0a0e1a 0%, #1a1f2e 100%);
          border: 1px solid rgba(139, 92, 246, 0.2);
          border-radius: 16px;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          max-width: 100%;
          box-sizing: border-box;
        }

        @media (min-width: 375px) {
          .template-manager {
            border-radius: 18px;
          }
        }

        @media (min-width: 640px) {
          .template-manager {
            border-radius: 20px;
          }
        }

        .template-header {
          padding: 16px;
          background: linear-gradient(90deg, rgba(139, 92, 246, 0.1) 0%, transparent 100%);
          border-bottom: 1px solid rgba(139, 92, 246, 0.15);
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }

        @media (min-width: 375px) {
          .template-header {
            padding: 20px;
          }
        }

        @media (min-width: 640px) {
          .template-header {
            padding: 24px;
            flex-wrap: nowrap;
          }
        }

        .template-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        @media (min-width: 375px) {
          .template-header-left {
            gap: 16px;
          }
        }

        .template-icon {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-center;
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(139, 92, 246, 0.4);
          flex-shrink: 0;
        }

        .template-icon svg {
          width: 24px;
          height: 24px;
        }

        @media (min-width: 375px) {
          .template-icon {
            width: 56px;
            height: 56px;
            border-radius: 16px;
          }
          .template-icon svg {
            width: 28px;
            height: 28px;
          }
        }

        .template-title {
          font-size: 16px;
          font-weight: 800;
          color: #ffffff;
          margin-bottom: 4px;
        }

        .template-subtitle {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.5);
        }

        @media (min-width: 375px) {
          .template-title {
            font-size: 18px;
          }
          .template-subtitle {
            font-size: 12px;
          }
        }

        @media (min-width: 640px) {
          .template-title {
            font-size: 20px;
          }
          .template-subtitle {
            font-size: 13px;
          }
        }

        .template-actions {
          display: flex;
          gap: 6px;
          width: 100%;
          justify-content: flex-end;
        }

        @media (min-width: 375px) {
          .template-actions {
            gap: 8px;
            width: auto;
          }
        }

        .template-btn {
          padding: 8px 12px;
          background: rgba(139, 92, 246, 0.1);
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: 8px;
          color: #8b5cf6;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        @media (min-width: 375px) {
          .template-btn {
            padding: 10px 16px;
            border-radius: 10px;
            font-size: 12px;
            gap: 6px;
          }
        }

        .template-btn:hover {
          background: rgba(139, 92, 246, 0.2);
          border-color: #8b5cf6;
          transform: translateY(-1px);
        }

        .template-btn-primary {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          border: none;
          color: #ffffff;
        }

        .template-btn-primary:hover {
          box-shadow: 0 4px 16px rgba(139, 92, 246, 0.4);
        }

        .template-body {
          padding: 16px;
        }

        @media (min-width: 375px) {
          .template-body {
            padding: 20px;
          }
        }

        @media (min-width: 640px) {
          .template-body {
            padding: 24px;
          }
        }

        .template-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }

        .template-card {
          padding: 20px;
          background: rgba(255, 255, 255, 0.02);
          border: 2px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .template-card:hover {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(139, 92, 246, 0.4);
          transform: translateY(-2px);
        }

        .template-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .template-card-category {
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .template-card-name {
          font-size: 16px;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 6px;
        }

        .template-card-desc {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 16px;
          line-height: 1.5;
        }

        .template-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .template-card-date {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.3);
        }

        .template-card-actions {
          display: flex;
          gap: 6px;
        }

        .template-icon-btn {
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

        .template-icon-btn:hover {
          background: rgba(139, 92, 246, 0.2);
          border-color: #8b5cf6;
          color: #8b5cf6;
        }

        .template-icon-btn.danger:hover {
          background: rgba(239, 68, 68, 0.2);
          border-color: #ef4444;
          color: #ef4444;
        }

        .template-empty {
          padding: 60px 20px;
          text-align: center;
          color: rgba(255, 255, 255, 0.3);
        }

        .template-empty-icon {
          width: 80px;
          height: 80px;
          margin: 0 auto 16px;
          display: flex;
          align-items: center;
          justify-center;
          background: rgba(139, 92, 246, 0.1);
          border-radius: 50%;
        }

        .template-dialog-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(8px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-center;
          padding: 20px;
        }

        .template-dialog {
          width: 100%;
          max-width: 500px;
          background: linear-gradient(135deg, #1a1f2e 0%, #0f1419 100%);
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: 20px;
          padding: 32px;
        }

        .template-dialog-title {
          font-size: 24px;
          font-weight: 800;
          color: #ffffff;
          margin-bottom: 8px;
        }

        .template-dialog-subtitle {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 24px;
        }

        .template-field {
          margin-bottom: 20px;
        }

        .template-label {
          display: block;
          font-size: 12px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.6);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }

        .template-input {
          width: 100%;
          padding: 12px 16px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          color: #ffffff;
          font-size: 14px;
          font-weight: 500;
        }

        .template-input:focus {
          outline: none;
          border-color: #8b5cf6;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
        }

        .template-textarea {
          min-height: 80px;
          resize: vertical;
        }

        .template-select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='white' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          padding-right: 40px;
        }

        .template-dialog-actions {
          display: flex;
          gap: 12px;
          margin-top: 28px;
        }

        .template-dialog-btn {
          flex: 1;
          padding: 14px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .template-dialog-btn-cancel {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.7);
        }

        .template-dialog-btn-cancel:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        .template-dialog-btn-save {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          border: none;
          color: #ffffff;
        }

        .template-dialog-btn-save:hover {
          box-shadow: 0 4px 16px rgba(139, 92, 246, 0.4);
          transform: translateY(-1px);
        }

        .template-dialog-btn-save:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>

      <div className="template-header">
        <div className="template-header-left">
          <div className="template-icon">
            <FolderOpen size={28} color="#ffffff" strokeWidth={2} />
          </div>
          <div>
            <div className="template-title">Template Manager</div>
            <div className="template-subtitle">{templates.length} template{templates.length !== 1 ? 's' : ''} saved</div>
          </div>
        </div>
        <div className="template-actions">
          <label className="template-btn">
            <Upload size={16} />
            Import
            <input
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleImportTemplate}
            />
          </label>
          <button className="template-btn template-btn-primary" onClick={() => setShowSaveDialog(true)}>
            <Save size={16} />
            Save Current
          </button>
        </div>
      </div>

      <div className="template-body">
        {templates.length === 0 ? (
          <div className="template-empty">
            <div className="template-empty-icon">
              <FolderOpen size={40} color="rgba(139, 92, 246, 0.5)" />
            </div>
            <p style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: 'rgba(255,255,255,0.6)' }}>
              No templates yet
            </p>
            <p>Save your current configuration as a template to reuse later</p>
          </div>
        ) : (
          <div className="template-grid">
            {templates.map((template) => (
              <div
                key={template.id}
                className="template-card"
                onClick={() => handleLoadTemplate(template)}
              >
                <div className="template-card-header">
                  <div
                    className="template-card-category"
                    style={{
                      backgroundColor: `${CATEGORY_COLORS[template.category]}20`,
                      color: CATEGORY_COLORS[template.category],
                    }}
                  >
                    {template.category}
                  </div>
                </div>
                <div className="template-card-name">{template.name}</div>
                <div className="template-card-desc">
                  {template.description || 'No description'}
                </div>
                <div className="template-card-footer">
                  <div className="template-card-date">
                    {new Date(template.createdAt).toLocaleDateString()}
                  </div>
                  <div className="template-card-actions">
                    <button
                      className="template-icon-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExportTemplate(template);
                      }}
                      title="Export"
                    >
                      <Download size={14} />
                    </button>
                    <button
                      className="template-icon-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicateTemplate(template);
                      }}
                      title="Duplicate"
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      className="template-icon-btn danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTemplate(template.id);
                      }}
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showSaveDialog && (
        <div className="template-dialog-overlay" onClick={() => setShowSaveDialog(false)}>
          <div className="template-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="template-dialog-title">Save as Template</div>
            <div className="template-dialog-subtitle">
              Save your current configuration to reuse later
            </div>

            <div className="template-field">
              <label className="template-label">Template Name</label>
              <input
                type="text"
                className="template-input"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g., Gaming Top 10"
                autoFocus
              />
            </div>

            <div className="template-field">
              <label className="template-label">Description (Optional)</label>
              <textarea
                className="template-input template-textarea"
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                placeholder="Describe this template..."
              />
            </div>

            <div className="template-field">
              <label className="template-label">Category</label>
              <select
                className="template-input template-select"
                value={templateCategory}
                onChange={(e) => setTemplateCategory(e.target.value as ProjectTemplate['category'])}
              >
                <option value="general">General</option>
                <option value="gaming">Gaming</option>
                <option value="beauty">Beauty</option>
                <option value="tech">Tech</option>
                <option value="food">Food</option>
                <option value="sports">Sports</option>
              </select>
            </div>

            <div className="template-dialog-actions">
              <button
                className="template-dialog-btn template-dialog-btn-cancel"
                onClick={() => setShowSaveDialog(false)}
              >
                Cancel
              </button>
              <button
                className="template-dialog-btn template-dialog-btn-save"
                onClick={handleSaveTemplate}
                disabled={!templateName.trim()}
              >
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
