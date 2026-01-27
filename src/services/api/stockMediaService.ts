import { invokeEdgeFunction } from '@/lib/supabase';
import { StockMediaItem } from '../../types/media';

interface SearchStockMediaParams {
  query?: string;
  type: 'image' | 'video';
  orientation?: 'all' | 'landscape' | 'portrait' | 'square';
  page?: number;
  per_page?: number;
}

interface StockMediaSearchResponse {
  results: StockMediaItem[];
  page: number;
  per_page: number;
  total: number;
}

export async function searchStockMedia(params: SearchStockMediaParams): Promise<StockMediaSearchResponse> {
  return invokeEdgeFunction<StockMediaSearchResponse>('stock-media-search', {
    query: params.query || 'abstract',
    type: params.type,
    orientation: params.orientation || 'all',
    page: params.page || 1,
    per_page: params.per_page || 15,
  });
}



