import { invokeEdgeFunction, supabase } from '../../lib/supabase';

type ExportQuality = '720p' | '1080p' | '4k';
type ExportFormat = 'mp4' | 'webm';

interface ExportRequest {
  project_id: string;
  quality: ExportQuality;
  format: ExportFormat;
  include_watermark?: boolean;
}

interface ExportJobResponse {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  message: string;
  upload_endpoint: string;
  project: {
    id: string;
    name: string;
    type: string;
    data: Record<string, unknown>;
  };
  settings: {
    quality: ExportQuality;
    format: ExportFormat;
    include_watermark: boolean;
  };
  credits_used: number;
}

interface UploadExportRequest {
  job_id: string;
  file_data: string;
  filename: string;
  mime_type: string;
  duration_seconds?: number;
}

interface UploadExportResponse {
  success: boolean;
  file_id: string;
  download_url: string;
  expires_at: string;
  size_bytes: number;
}

export const exportService = {
  async createExportJob(request: ExportRequest): Promise<ExportJobResponse> {
    return invokeEdgeFunction<ExportJobResponse>('export-video', request);
  },

  async uploadExportedVideo(request: UploadExportRequest): Promise<UploadExportResponse> {
    return invokeEdgeFunction<UploadExportResponse>('export-video/upload', request);
  },

  async uploadExportedBlob(
    jobId: string,
    blob: Blob,
    filename: string,
    durationSeconds?: number
  ): Promise<UploadExportResponse> {
    const arrayBuffer = await blob.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(arrayBuffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ''
      )
    );

    return this.uploadExportedVideo({
      job_id: jobId,
      file_data: base64,
      filename,
      mime_type: blob.type,
      duration_seconds: durationSeconds,
    });
  },

  async getExportHistory(limit = 20): Promise<{
    id: string;
    project_name: string;
    quality: string;
    format: string;
    status: string;
    download_url: string | null;
    created_at: string;
  }[]> {
    const { data, error } = await supabase
      .from('processing_jobs')
      .select(`
        id,
        input_data,
        output_data,
        status,
        created_at
      `)
      .eq('type', 'video_export')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);

    return data.map(job => {
      const input = job.input_data as { project_id?: string; quality?: string; format?: string };
      const output = job.output_data as { storage_path?: string } | null;
      
      return {
        id: job.id,
        project_name: input.project_id || 'Unknown',
        quality: input.quality || '1080p',
        format: input.format || 'mp4',
        status: job.status,
        download_url: output?.storage_path || null,
        created_at: job.created_at,
      };
    });
  },

  async getDownloadUrl(fileId: string): Promise<string | null> {
    const { data: file } = await supabase
      .from('media_files')
      .select('bucket, path')
      .eq('id', fileId)
      .single();

    if (!file) return null;

    const { data } = await supabase.storage
      .from(file.bucket)
      .createSignedUrl(file.path, 86400);

    return data?.signedUrl || null;
  },

  getQualityResolution(quality: ExportQuality): { width: number; height: number } {
    const resolutions: Record<ExportQuality, { width: number; height: number }> = {
      '720p': { width: 1280, height: 720 },
      '1080p': { width: 1920, height: 1080 },
      '4k': { width: 3840, height: 2160 },
    };
    return resolutions[quality];
  },

  estimateFileSize(durationSeconds: number, quality: ExportQuality): number {
    const BITRATES_KBPS: Record<ExportQuality, number> = {
      '720p': 5000,
      '1080p': 8000,
      '4k': 35000,
    };
    const BYTES_PER_KILOBYTE = 1000;
    const BITS_PER_BYTE = 8;
    return (durationSeconds * BITRATES_KBPS[quality]) / BITS_PER_BYTE * BYTES_PER_KILOBYTE;
  },
};

