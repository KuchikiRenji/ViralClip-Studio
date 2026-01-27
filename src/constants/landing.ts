export interface TestimonialAuthor {
  name: string;
  avatar: string;
  key: string;
}

export const TESTIMONIAL_AUTHORS: TestimonialAuthor[] = [
  { name: 'Tasha Williams', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces', key: 'tasha' },
  { name: 'Ali Rahman', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces', key: 'ali' },
  { name: 'Mike Chen', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=faces', key: 'mike' },
  { name: 'Jennifer Moore', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=faces', key: 'jennifer' },
  { name: 'Brandon Torres', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=faces', key: 'brandon' },
  { name: 'Kevin Anderson', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=faces', key: 'kevin' },
  { name: 'Leo Martinez', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=faces', key: 'leo' },
  { name: 'Sahil Patel', avatar: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150&h=150&fit=crop&crop=faces', key: 'sahil' },
  { name: 'Nia Jackson', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=faces', key: 'nia' },
  { name: 'Marina Rodriguez', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=faces', key: 'marina' },
];

export interface PricingPlan {
  id: 'beginner' | 'pro' | 'premium';
  monthlyPrice: number;
  annualPrice: number;
  popular: boolean;
  icon: 'user' | 'star' | 'crown';
  features: {
    aiVideos: number;
    exportMinutes: number;
    voiceMinutes: number;
    aiImages: number;
  };
}

export const PRICING_PLANS: PricingPlan[] = [
  { id: 'beginner', monthlyPrice: 24.99, annualPrice: 150, popular: false, icon: 'user', features: { aiVideos: 50, exportMinutes: 40, voiceMinutes: 30, aiImages: 100 } },
  { id: 'pro', monthlyPrice: 49.99, annualPrice: 300, popular: true, icon: 'star', features: { aiVideos: 150, exportMinutes: 120, voiceMinutes: 120, aiImages: 300 } },
  { id: 'premium', monthlyPrice: 89.99, annualPrice: 540, popular: false, icon: 'crown', features: { aiVideos: 250, exportMinutes: 180, voiceMinutes: 180, aiImages: 500 } },
];

export const duplicateArray = <T,>(arr: T[]): T[] => [...arr, ...arr, ...arr];
