import { invokeEdgeFunction } from '@/lib/supabase';

export type RunwayModel = 'gen3a_turbo' | 'gen4.5' | 'veo3' | 'veo3.1' | 'veo3.1_fast';

interface RunwayGenerateRequest {
  prompt: string;
  model?: RunwayModel;
  seconds?: number;
  aspect_ratio?: '16:9' | '9:16' | '1:1';
  style?: 'cinematic' | 'anime' | 'photographic';
}

interface RunwayTaskResponse {
  id: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';
  output?: string[];
  failure?: string;
  progress?: number;
}

const POLLING_INTERVAL = 1000; // Reduced from 2000ms to 1000ms for faster updates
const MAX_ATTEMPTS = 120; // Increased to compensate for faster polling (120 seconds total) 

export const runwayService = {
  async generateVideo(
    request: RunwayGenerateRequest,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    const ratioMap = {
      '16:9': '1280:720',
      '9:16': '720:1280',
      '1:1': '1024:1024'
    };
    const resolution = ratioMap[request.aspect_ratio || '9:16'] || '720:1280';

    let finalPrompt = request.prompt;
    if (request.style) {
      finalPrompt += `, ${request.style} style`;
    }

    const modelToUse = request.model || 'gen3a_turbo';

    // Runway API only accepts duration: 4, 6, or 8 seconds
    // Round to nearest valid value
    let duration = request.seconds || 6;
    if (duration <= 4) duration = 4;
    else if (duration <= 6) duration = 6;
    else duration = 8;

    // Some models might have specific duration requirements
    // Based on validation error "expected 8", veo3 models may require duration: 8
    // For veo3 models, use duration 8 if user selected 6 or less
    let finalDuration = duration;
    if (modelToUse.startsWith('veo3')) {
      // veo3 models seem to require duration: 8 based on validation error
      if (duration < 8) {
        console.log(`ℹ️ veo3 model requires duration: 8, adjusting from ${duration} to 8`);
        finalDuration = 8;
      }
    }

    // Runway API request format
    // Ensure duration is a number (not string) and is one of: 4, 6, or 8
    const requestBody: Record<string, unknown> = {
      promptText: finalPrompt,
      model: modelToUse,
      duration: finalDuration, // Must be number: 4, 6, or 8
      ratio: resolution,
    };
    
    // Ensure all values are the correct type
    console.log('📤 Request body types:', {
      promptText: typeof requestBody.promptText,
      model: typeof requestBody.model,
      duration: typeof requestBody.duration,
      ratio: typeof requestBody.ratio,
      durationValue: requestBody.duration
    });
    
    // Add audio field (optional but might help)
    // requestBody.audio = true; // Uncomment if needed
    
    console.log('📤 Sending to Runway API:', {
      promptText: finalPrompt.substring(0, 50) + '...',
      model: modelToUse,
      duration: finalDuration, // Use finalDuration, not duration
      ratio: resolution,
      fullBody: requestBody,
      bodyString: JSON.stringify(requestBody)
    });
    
    const taskData = await invokeEdgeFunction<{ id?: string; error?: string; message?: string; details?: unknown; issues?: unknown[] }>('runway-proxy', {
      path: '/text_to_video',
      method: 'POST',
      body: requestBody
    });

    // Check if Runway returned an error
    if (taskData.error) {
      console.error('❌ Runway service error:', taskData);
      let errorMessage = taskData.error;
      
      // Check if it's a credit-related error from Runway API
      const errorLower = errorMessage.toLowerCase();
      if (errorLower.includes('credit') || 
          errorLower.includes('insufficient') || 
          errorLower.includes('not have enough') ||
          errorLower.includes('do not have enough')) {
        errorMessage = '⚠️ Runway API Account Issue: The Runway API account associated with this service has insufficient credits. This is separate from your app credits. Please add credits to your Runway API account at runwayml.com or contact support.';
      }
      
      // Include issues if available
      if (taskData.details && typeof taskData.details === 'object') {
        const details = taskData.details as { issues?: unknown[]; error?: string | { message?: string } };
        
        // Check for credit errors in details
        const detailsError = details.error;
        if (detailsError) {
          const errorText = typeof detailsError === 'string' ? detailsError : detailsError.message || '';
          const errorTextLower = errorText.toLowerCase();
          if (errorTextLower.includes('credit') || 
              errorTextLower.includes('insufficient') || 
              errorTextLower.includes('not have enough') ||
              errorTextLower.includes('do not have enough')) {
            errorMessage = '⚠️ Runway API Account Issue: The Runway API account associated with this service has insufficient credits. This is separate from your app credits. Please add credits to your Runway API account at runwayml.com or contact support.';
          }
        }
        
        if (details.issues && Array.isArray(details.issues) && details.issues.length > 0) {
          const issuesText = details.issues.map(issue => {
            if (typeof issue === 'string') return issue;
            if (issue && typeof issue === 'object' && 'path' in issue) {
              const path = (issue as { path?: unknown[] }).path;
              const message = (issue as { message?: string }).message || String(issue);
              return path ? `${path.join('.')}: ${message}` : message;
            }
            return JSON.stringify(issue);
          }).join('; ');
          errorMessage = `${errorMessage}\n\nValidation Issues:\n${issuesText}`;
        }
      }
      
      const errorDetails = taskData.details ? `\n\nFull Details: ${JSON.stringify(taskData.details, null, 2)}` : '';
      throw new Error(`${errorMessage}${errorDetails}`);
    }
    
    if (taskData.message && !taskData.id) {
      throw new Error(taskData.message);
    }

    const taskId = taskData.id;

    if (!taskId) throw new Error('No task ID returned from Runway');

    let attempts = 0;
    let lastProgress = 0;
    
    console.log(`🔄 Starting polling for task ${taskId} (max ${MAX_ATTEMPTS} attempts, ${POLLING_INTERVAL}ms interval)`);
    
    while (attempts < MAX_ATTEMPTS) {
      await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
      
      const statusData = await invokeEdgeFunction<RunwayTaskResponse>('runway-proxy', {
        path: `/tasks/${taskId}`,
        method: 'GET'
      });

      console.log(`📊 Poll attempt ${attempts + 1}/${MAX_ATTEMPTS}:`, {
        status: statusData.status,
        progress: statusData.progress,
        hasOutput: !!statusData.output?.[0],
        failure: statusData.failure
      });

      // Update progress if available and callback provided
      if (onProgress) {
        if (statusData.progress !== undefined) {
          // Map backend progress (0-100) to our range (56-100)
          // Backend progress 0% = our 56%, backend progress 100% = our 100%
          const mappedProgress = 56 + (statusData.progress * 0.44); // 44% range from 56% to 100%
          onProgress(mappedProgress);
          lastProgress = mappedProgress;
        } else {
          // If no progress from API, simulate gradual progress based on attempts
          // Estimate: 30-60 seconds typical, so progress from 56% to 95% over attempts
          const estimatedProgress = Math.min(56 + (attempts / MAX_ATTEMPTS) * 39, 95);
          if (estimatedProgress > lastProgress) {
            onProgress(estimatedProgress);
            lastProgress = estimatedProgress;
          }
        }
      }

      if (statusData.status === 'SUCCEEDED' && statusData.output?.[0]) {
        console.log('✅ Video generation succeeded!', { videoUrl: statusData.output[0] });
        if (onProgress) onProgress(100);
        return statusData.output[0];
      }

      if (statusData.status === 'FAILED') {
        console.error('❌ Video generation failed:', statusData.failure);
        throw new Error(statusData.failure || 'Runway video generation failed');
      }

      attempts++;
    }

    console.error('⏱️ Video generation timed out after', attempts, 'attempts');

    throw new Error('Runway generation timed out');
  }
};
