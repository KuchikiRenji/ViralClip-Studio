import { useState, useCallback } from 'react';
import type { TextStoryState } from './types';
import { INITIAL_STATE } from './constants';
export const useTextStoryState = () => {
  const [state, setState] = useState<TextStoryState>(INITIAL_STATE);
  const updateState = useCallback(<K extends keyof TextStoryState>(
    key: K,
    value: TextStoryState[K]
  ) => {
    setState(prev => ({ ...prev, [key]: value }));
  }, []);
  const resetState = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);
  return { state, setState, updateState, resetState };
};







