import { useState, useCallback } from 'react';
import type { StoryVideoState } from './StoryVideoTypes';
import { INITIAL_STATE } from './StoryVideoConstants';
export const useStoryVideoState = () => {
  const [state, setState] = useState<StoryVideoState>(INITIAL_STATE);
  const updateState = useCallback(<K extends keyof StoryVideoState>(
    key: K,
    value: StoryVideoState[K]
  ) => {
    setState(prev => ({ ...prev, [key]: value, validationError: null }));
  }, []);
  const resetState = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);
  return { state, setState, updateState, resetState };
};







