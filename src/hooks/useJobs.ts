import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

type JobType = 
  | 'transcription'
  | 'voice_clone'
  | 'text_to_speech'
  | 'script_generation'
  | 'image_generation'
  | 'video_export'
  | 'media_processing'
  | 'background_removal'
  | 'vocal_separation';

type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'canceled';

interface ProcessingJob {
  id: string;
  user_id: string;
  type: JobType;
  status: JobStatus;
  progress: number;
  input_data: Record<string, unknown>;
  output_data: Record<string, unknown> | null;
  error: string | null;
  credits_charged: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

interface JobsState {
  jobs: ProcessingJob[];
  activeJobs: ProcessingJob[];
  loading: boolean;
  error: Error | null;
}

export function useJobs() {
  const { user } = useAuth();
  const [state, setState] = useState<JobsState>({
    jobs: [],
    activeJobs: [],
    loading: true,
    error: null,
  });

  const fetchJobs = useCallback(async (limit = 50) => {
    if (!user) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    const { data, error } = await supabase
      .from('processing_jobs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      setState(prev => ({ 
        ...prev, 
        error: new Error(error.message), 
        loading: false 
      }));
      return;
    }

    const jobs = (data as ProcessingJob[]) || [];
    const activeJobs = jobs.filter(j => 
      j.status === 'pending' || j.status === 'processing'
    );

    setState({
      jobs,
      activeJobs,
      loading: false,
      error: null,
    });
  }, [user]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('jobs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'processing_jobs',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setState(prev => {
              const newJob = payload.new as ProcessingJob;
              const jobs = [newJob, ...prev.jobs];
              const activeJobs = jobs.filter(j => 
                j.status === 'pending' || j.status === 'processing'
              );
              return { ...prev, jobs, activeJobs };
            });
          } else if (payload.eventType === 'UPDATE') {
            setState(prev => {
              const updatedJob = payload.new as ProcessingJob;
              const jobs = prev.jobs.map(j => 
                j.id === updatedJob.id ? updatedJob : j
              );
              const activeJobs = jobs.filter(j => 
                j.status === 'pending' || j.status === 'processing'
              );
              return { ...prev, jobs, activeJobs };
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const getJob = useCallback(async (jobId: string): Promise<ProcessingJob | null> => {
    const { data, error } = await supabase
      .from('processing_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    return error ? null : (data as ProcessingJob);
  }, []);

  const cancelJob = useCallback(async (jobId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('processing_jobs')
      .update({ 
        status: 'canceled',
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId)
      .eq('status', 'pending');

    return !error;
  }, []);

  const subscribeToJob = useCallback((
    jobId: string,
    onUpdate: (job: ProcessingJob) => void
  ) => {
    const channel = supabase
      .channel(`job-${jobId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'processing_jobs',
          filter: `id=eq.${jobId}`,
        },
        (payload) => {
          onUpdate(payload.new as ProcessingJob);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getJobsByType = useCallback((type: JobType): ProcessingJob[] => {
    return state.jobs.filter(j => j.type === type);
  }, [state.jobs]);

  const hasActiveJobOfType = useCallback((type: JobType): boolean => {
    return state.activeJobs.some(j => j.type === type);
  }, [state.activeJobs]);

  return {
    ...state,
    getJob,
    cancelJob,
    subscribeToJob,
    getJobsByType,
    hasActiveJobOfType,
    refresh: fetchJobs,
  };
}
