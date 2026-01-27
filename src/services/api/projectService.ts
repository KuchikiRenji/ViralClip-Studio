import { supabase, SUPABASE_ERROR_CODES } from '../../lib/supabase';

type ProjectType = 
  | 'video_ranking'
  | 'split_screen'
  | 'story_video'
  | 'text_story'
  | 'reddit_video'
  | 'auto_clip'
  | 'voice_clone'
  | 'custom_edit';

interface Project {
  id: string;
  user_id: string;
  name: string;
  type: ProjectType;
  description: string | null;
  data: Record<string, unknown>;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  is_template: boolean;
  is_public: boolean;
  export_count: number;
  last_exported_at: string | null;
  created_at: string;
  updated_at: string;
}

interface CreateProjectRequest {
  name: string;
  type: ProjectType;
  description?: string;
  data?: Record<string, unknown>;
}

interface UpdateProjectRequest {
  name?: string;
  description?: string;
  data?: Record<string, unknown>;
  thumbnail_url?: string;
  duration_seconds?: number;
  is_public?: boolean;
}

export const projectService = {
  async getProjects(type?: ProjectType): Promise<Project[]> {
    let query = supabase
      .from('projects')
      .select('*')
      .order('updated_at', { ascending: false });

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);
    return data as Project[];
  },

  async getProject(id: string): Promise<Project | null> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === SUPABASE_ERROR_CODES.NO_ROWS_RETURNED) return null;
      throw new Error(error.message);
    }

    return data as Project;
  },

  async createProject(request: CreateProjectRequest): Promise<Project> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        name: request.name,
        type: request.type,
        description: request.description,
        data: request.data || {},
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Project;
  },

  async updateProject(id: string, updates: UpdateProjectRequest): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Project;
  },

  async deleteProject(id: string): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  },

  async duplicateProject(id: string, newName?: string): Promise<Project> {
    const original = await this.getProject(id);
    if (!original) throw new Error('Project not found');

    return this.createProject({
      name: newName || `${original.name} (Copy)`,
      type: original.type,
      description: original.description,
      data: original.data,
    });
  },

  async getPublicProjects(type?: ProjectType, limit = 20): Promise<Project[]> {
    let query = supabase
      .from('projects')
      .select('*')
      .eq('is_public', true)
      .order('export_count', { ascending: false })
      .limit(limit);

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);
    return data as Project[];
  },

  async saveProjectData(id: string, data: Record<string, unknown>): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .update({ data })
      .eq('id', id);

    if (error) throw new Error(error.message);
  },
};

