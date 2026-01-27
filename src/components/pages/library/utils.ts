import { ProjectItem } from './types';

const STORAGE_KEY = 'creator-studio-library';
const RECENT_PROJECT_LIMIT = 3;

export const getStoredProjects = (): ProjectItem[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
};

export const saveProjects = (projects: ProjectItem[]): void => {
  const projectsToSave = projects.map(p => ({ ...p, videoBlob: undefined }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projectsToSave));
};

export const addProjectToLibrary = (project: Omit<ProjectItem, 'id' | 'createdAt'>): void => {
  const projects = getStoredProjects();
  const timestamp = Date.now();
  saveProjects([{ ...project, id: `${timestamp}`, createdAt: timestamp }, ...projects]);
};

export const getRecentProjects = (limit = RECENT_PROJECT_LIMIT): ProjectItem[] => {
  return getStoredProjects()
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit);
};