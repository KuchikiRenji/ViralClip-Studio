import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'
import { createServiceSupabaseClient, getBearerToken, hasActiveSubscription, paywallPayload, requireAuthenticatedUser } from '../_shared/auth.ts'
import { jsonResponse } from '../_shared/http.ts'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const supabase = createServiceSupabaseClient();

const CREDITS_PER_EXPORT = 20;

interface ExportRequest {
  project_id: string;
  quality: "720p" | "1080p" | "4k";
  format: "mp4" | "webm";
  include_watermark?: boolean;
}

interface UploadExportRequest {
  job_id: string;
  file_data: string;
  filename: string;
  mime_type: string;
  duration_seconds?: number;
}

const action = 'OPEN_PRICING'

const exportRequestSchema = z.object({
  project_id: z.string().min(1),
  quality: z.enum(["720p", "1080p", "4k"]),
  format: z.enum(["mp4", "webm"]).default("mp4"),
  include_watermark: z.boolean().optional(),
})

const uploadRequestSchema = z.object({
  job_id: z.string().min(1),
  file_data: z.string().min(1),
  filename: z.string().min(1).max(256),
  mime_type: z.string().min(1).max(128),
  duration_seconds: z.number().optional(),
})

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return jsonResponse({ error: "Unauthorized" }, 401, corsHeaders);
  }

  const token = getBearerToken(authHeader);
  if (!token) return jsonResponse({ error: "Unauthorized" }, 401, corsHeaders);

  const user = await requireAuthenticatedUser(supabase, token);
  if (!user) return jsonResponse({ error: "Unauthorized" }, 401, corsHeaders);

  const userId = user.id;

  const url = new URL(req.url);
  const isUpload = url.pathname.endsWith("/upload");

  const active = await hasActiveSubscription(supabase, userId);
  if (!active) {
    return jsonResponse(paywallPayload("Active subscription required", action), 402, corsHeaders);
  }

  if (isUpload) {
    let body: UploadExportRequest;
    try {
      body = uploadRequestSchema.parse(await req.json());
    } catch {
      return jsonResponse({ error: "Invalid request" }, 400, corsHeaders);
    }

    const { data: job } = await supabase
      .from("processing_jobs")
      .select("*")
      .eq("id", body.job_id)
      .eq("user_id", userId)
      .eq("type", "video_export")
      .single();

    if (!job) {
      return new Response(JSON.stringify({ error: "Export job not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const binaryData = Uint8Array.from(atob(body.file_data), c => c.charCodeAt(0));
      const storagePath = `${userId}/${body.filename}`;

      const { error: uploadError } = await supabase.storage
        .from("exports")
        .upload(storagePath, binaryData, {
          contentType: body.mime_type,
          upsert: true,
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { data: mediaFile } = await supabase
        .from("media_files")
        .insert({
          user_id: userId,
          bucket: "exports",
          path: storagePath,
          filename: body.filename,
          original_filename: body.filename,
          mime_type: body.mime_type,
          media_type: "video",
          size_bytes: binaryData.length,
          duration_seconds: body.duration_seconds,
          is_processed: true,
          expires_at: expiresAt.toISOString(),
        })
        .select("id")
        .single();

      await supabase
        .from("processing_jobs")
        .update({
          status: "completed",
          progress: 100,
          output_data: {
            file_id: mediaFile?.id,
            storage_path: storagePath,
            size_bytes: binaryData.length,
            expires_at: expiresAt.toISOString(),
          },
          completed_at: new Date().toISOString(),
        })
        .eq("id", job.id);

      const projectId = (job.input_data as { project_id?: string })?.project_id;
      if (projectId) {
        try {
          await supabase
            .from("projects")
            .update({ last_exported_at: new Date().toISOString() })
            .eq("id", projectId);
        } catch {
        }
      }

      await supabase
        .from("generated_content")
        .insert({
          user_id: userId,
          job_id: job.id,
          type: "exported_video",
          media_file_id: mediaFile?.id,
          metadata: {
            quality: (job.input_data as { quality?: string })?.quality,
            format: (job.input_data as { format?: string })?.format,
            size_bytes: binaryData.length,
            duration_seconds: body.duration_seconds,
          },
        });

      const { data: signedUrl } = await supabase.storage
        .from("exports")
        .createSignedUrl(storagePath, 86400);

      return new Response(JSON.stringify({
        success: true,
        file_id: mediaFile?.id,
        download_url: signedUrl?.signedUrl,
        expires_at: expiresAt.toISOString(),
        size_bytes: binaryData.length,
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });

    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      
      await supabase
        .from("processing_jobs")
        .update({
          status: "failed",
          error: message,
          completed_at: new Date().toISOString(),
        })
        .eq("id", job.id);

      return new Response(JSON.stringify({ error: message }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
  }

  let body: ExportRequest;
  try {
    body = exportRequestSchema.parse(await req.json());
  } catch {
    return jsonResponse({ error: "Invalid request" }, 400, corsHeaders);
  }

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", body.project_id)
    .eq("user_id", userId)
    .single();

  if (!project) {
    return new Response(JSON.stringify({ error: "Project not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const { data: creditResult } = await supabase.rpc("consume_credits", {
    p_user_id: userId,
    p_amount: CREDITS_PER_EXPORT,
    p_feature: "video_export",
    p_description: `Export: ${project.name} (${body.quality})`,
  });

  if (!creditResult?.[0]?.success) {
    return new Response(JSON.stringify({ 
      error: creditResult?.[0]?.error_message || "Insufficient credits" 
    }), {
      status: 402,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const { data: job, error: jobError } = await supabase
    .from("processing_jobs")
    .insert({
      user_id: userId,
      type: "video_export",
      status: "pending",
      input_data: {
        project_id: body.project_id,
        quality: body.quality,
        format: body.format || "mp4",
        include_watermark: body.include_watermark,
        project_data: project.data,
      },
      credits_charged: CREDITS_PER_EXPORT,
    })
    .select("id")
    .single();

  if (jobError || !job) {
    return new Response(JSON.stringify({ error: "Failed to create export job" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  return new Response(JSON.stringify({
    job_id: job.id,
    status: "pending",
    message: "Export job created. Process video client-side and upload result.",
    upload_endpoint: `/export-video/upload`,
    project: {
      id: project.id,
      name: project.name,
      type: project.type,
      data: project.data,
    },
    settings: {
      quality: body.quality,
      format: body.format || "mp4",
      include_watermark: body.include_watermark,
    },
    credits_used: CREDITS_PER_EXPORT,
  }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
});

