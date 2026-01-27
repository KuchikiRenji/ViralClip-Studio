import { useState, useCallback } from 'react';
import { RedditVideoState } from './types';
import { INITIAL_STATE } from './constants';

export const useRedditVideoState = () => {
  const [state, setState] = useState<RedditVideoState>(INITIAL_STATE);

  const updateState = useCallback(<K extends keyof RedditVideoState>(
    key: K,
    value: RedditVideoState[K]
  ) => {
    setState(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateIntro = useCallback(<K extends keyof RedditVideoState['intro']>(
    key: K,
    value: RedditVideoState['intro'][K]
  ) => {
    setState(prev => ({
      ...prev,
      intro: { ...prev.intro, [key]: value }
    }));
  }, []);

  const resetState = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  return {
    state,
    setState,
    updateState,
    updateIntro,
    resetState,
  };
};
