import { scriptService } from '@/services/api/scriptService';
import { Message, MessageSender } from './types';
import { createInitialMessage } from './constants';

export type AIProvider = 'openai' | 'anthropic' | 'local';

export interface AIGenerationOptions {
  prompt: string;
  provider?: AIProvider;
  temperature?: number;
  maxMessages?: number;
  conversationStyle?: 'casual' | 'formal' | 'funny' | 'dramatic' | 'romantic';
  messageLength?: 'short' | 'medium' | 'long';
}

export interface AIGenerationResult {
  messages: Message[];
  error?: string;
}

export function validateAPIConfig(provider: AIProvider): { valid: boolean; error?: string } {
  return { valid: true };
}

export async function generateAIConversation(
  options: AIGenerationOptions
): Promise<AIGenerationResult> {
  const provider = options.provider || 'openai';

  if (provider === 'local') {
    return generateLocal(options);
  }

  try {
    const styleMap: Record<string, 'casual' | 'professional' | 'humorous' | 'dramatic' | 'inspirational'> = {
      casual: 'casual',
      formal: 'professional',
      funny: 'humorous',
      dramatic: 'dramatic',
      romantic: 'casual',
    };

    const result = await scriptService.generateScript({
      prompt: options.prompt,
      type: 'chat-story',
      tone: styleMap[options.conversationStyle || 'casual'],
      duration_seconds: (options.maxMessages || 8) * 5,
    });

    if (!result.script) {
      throw new Error('No content received from AI');
    }

    return parseConversation(result.script);
  } catch (error) {
    console.error('AI conversation generation failed:', error);
    return {
      messages: [],
      error: error instanceof Error ? error.message : 'Failed to generate conversation',
    };
  }
}

async function generateLocal(options: AIGenerationOptions): Promise<AIGenerationResult> {
  const prompt = options.prompt.toLowerCase();

  let messages: Message[] = [];

  if (prompt.includes('lottery') || prompt.includes('won')) {
    messages = [
      createInitialMessage('left', 'Hey, I need to tell you something important.'),
      createInitialMessage('right', 'What is it? You\'re scaring me.'),
      createInitialMessage('left', 'I just found out I won the lottery!'),
      createInitialMessage('right', 'OMG that\'s amazing! Congratulations! 🎉'),
      createInitialMessage('left', 'Thanks! I still can\'t believe it.'),
      createInitialMessage('right', 'We need to celebrate this!'),
    ];
  } else if (prompt.includes('funny') || prompt.includes('joke')) {
    messages = [
      createInitialMessage('left', 'Why did the chicken cross the road?'),
      createInitialMessage('right', 'I don\'t know, why?'),
      createInitialMessage('left', 'To get to the other side! 😂'),
      createInitialMessage('right', 'That\'s terrible lol'),
      createInitialMessage('left', 'I know right 😅'),
    ];
  } else if (prompt.includes('drama') || prompt.includes('argument')) {
    messages = [
      createInitialMessage('left', 'We need to talk...'),
      createInitialMessage('right', 'About what?'),
      createInitialMessage('left', 'I saw your messages'),
      createInitialMessage('right', 'What messages?'),
      createInitialMessage('left', 'Don\'t play dumb with me'),
    ];
  } else if (prompt.includes('romantic') || prompt.includes('love') || prompt.includes('date')) {
    messages = [
      createInitialMessage('left', 'Hey, are you free tonight?'),
      createInitialMessage('right', 'Yeah, what\'s up?'),
      createInitialMessage('left', 'Want to grab dinner?'),
      createInitialMessage('right', 'I\'d love to! 💕'),
      createInitialMessage('left', 'Great! Pick you up at 7?'),
      createInitialMessage('right', 'Perfect! See you then'),
    ];
  } else {
    messages = [
      createInitialMessage('left', 'Hey, did you see the news?'),
      createInitialMessage('right', 'No, what happened?'),
      createInitialMessage('left', 'Something interesting about ' + options.prompt.slice(0, 20)),
      createInitialMessage('right', 'Tell me more!'),
      createInitialMessage('left', 'I\'ll send you the link'),
    ];
  }

  return { messages };
}

function parseConversation(content: string): AIGenerationResult {
  const lines = content.split('\n').filter(line => line.trim());
  const messages: Message[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    const leftMatch = trimmed.match(/^LEFT:\s*(.+)/i);
    const rightMatch = trimmed.match(/^RIGHT:\s*(.+)/i);

    if (leftMatch) {
      messages.push(createInitialMessage('left', leftMatch[1].trim()));
    } else if (rightMatch) {
      messages.push(createInitialMessage('right', rightMatch[1].trim()));
    } else if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('//')) {
      const sender: MessageSender = messages.length % 2 === 0 ? 'left' : 'right';
      messages.push(createInitialMessage(sender, trimmed));
    }
  }

  if (messages.length === 0) {
    return {
      messages: [],
      error: 'Could not parse any messages from the response',
    };
  }

  return { messages };
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function estimateCost(provider: AIProvider, promptTokens: number): number {
  const costs = {
    openai: 0.00015 / 1000,
    anthropic: 0.003 / 1000,
    local: 0,
  };

  return (costs[provider] || 0) * promptTokens;
}
