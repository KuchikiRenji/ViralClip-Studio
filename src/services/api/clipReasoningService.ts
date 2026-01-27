import { scriptService } from './scriptService';

export interface ViralMoment {
  start: number;
  end: number;
  title: string;
  reason: string;
  score: number;
}

export const clipReasoningService = {
  async findViralMoments(transcript: string, duration: number): Promise<ViralMoment[]> {
    const prompt = `Analyze this video transcript and identify up to 6 most viral or engaging segments.
For each segment, provide a start time, end time, a catchy title, and a short reason why it's engaging.

Transcript:
${transcript}

Total Duration: ${duration} seconds

Return ONLY a JSON array of objects with the following structure:
[
  { "start": 10.5, "end": 25.0, "title": "Catchy Title", "reason": "Engaging hook...", "score": 95 },
  ...
]`;

    try {
      const result = await scriptService.generateScript({
        prompt,
        type: 'custom',
        tone: 'professional'
      });

      // The script service returns a full object, we need to extract the JSON from the 'script' field if it was wrapped or just parse it.
      // Since our scriptService is already configured to return JSON for 'custom' type in some cases, let's parse.
      try {
        const moments = JSON.parse(result.script);
        return moments;
      } catch (e) {
        console.error('Failed to parse AI moments:', e);
        // Fallback or cleanup
        const cleanJson = result.script.match(/\[.*\]/s)?.[0];
        if (cleanJson) return JSON.parse(cleanJson);
        throw new Error('AI returned invalid format for viral moments');
      }
    } catch (error) {
      console.error('Viral moment analysis error:', error);
      throw error;
    }
  }
};

