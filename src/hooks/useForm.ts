import { useState, useCallback } from 'react';
export interface FormField<T = unknown> {
  value: T;
  error?: string;
  touched?: boolean;
}
export interface FormState {
  [key: string]: FormField<unknown>;
}
export interface FormOptions<T extends Record<string, unknown> = Record<string, unknown>> {
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  initialValues?: T;
  onSubmit?: (values: T) => void | Promise<void>;
}
export interface UseFormReturn<T extends Record<string, unknown> = Record<string, unknown>> {
  values: T;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
  setValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setError: (field: string, error: string) => void;
  setTouched: (field: string, touched?: boolean) => void;
  handleChange: <K extends keyof T>(field: K) => (value: T[K]) => void;
  handleBlur: (field: string) => () => void;
  handleSubmit: (e: React.FormEvent) => void;
  reset: (values?: Partial<T>) => void;
  validate: () => boolean;
}
export const useForm = <T extends Record<string, unknown> = Record<string, unknown>>(
  options: FormOptions<T> = {}
): UseFormReturn<T> => {
  const {
    validateOnChange = true,
    validateOnBlur = true,
    initialValues = {} as T,
    onSubmit,
  } = options;
  const [state, setState] = useState<FormState>(() =>
    Object.keys(initialValues).reduce((acc, key) => ({
      ...acc,
      [key]: {
        value: initialValues[key as keyof T],
        error: undefined,
        touched: false,
      },
    }), {} as FormState)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const values = Object.keys(state).reduce((acc, key) => ({
    ...acc,
    [key]: state[key].value,
  }), {} as T);
  const errors = Object.keys(state).reduce((acc, key) => ({
    ...acc,
    [key]: state[key].error,
  }), {} as Record<string, string>);
  const touched = Object.keys(state).reduce((acc, key) => ({
    ...acc,
    [key]: state[key].touched || false,
  }), {} as Record<string, boolean>);
  const isValid = Object.values(errors).every(error => !error);
  const isDirty = Object.values(touched).some(t => t);
  const setValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setState(prev => ({
      ...prev,
      [field as string]: {
        ...prev[field as string],
        value,
        error: validateOnChange ? validateField(field as string, value) : prev[field as string]?.error,
      },
    }));
  }, [validateOnChange]);
  const setError = useCallback((field: string, error: string) => {
    setState(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        error,
      },
    }));
  }, []);
  const setTouched = useCallback((field: string, touchedValue = true) => {
    setState(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        touched: touchedValue,
        error: validateOnBlur ? validateField(field, prev[field]?.value) : prev[field]?.error,
      },
    }));
  }, [validateOnBlur]);
  const handleChange = useCallback(<K extends keyof T>(field: K) => (value: T[K]) => {
    setValue(field, value);
  }, [setValue]);
  const handleBlur = useCallback((field: string) => () => {
    setTouched(field, true);
  }, [setTouched]);
  const validate = useCallback(() => {
    let isFormValid = true;
    const newState = { ...state };
    Object.keys(newState).forEach(field => {
      const error = validateField(field, newState[field].value);
      newState[field] = {
        ...newState[field],
        error,
        touched: true,
      };
      if (error) isFormValid = false;
    });
    setState(newState);
    return isFormValid;
  }, [state]);
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await onSubmit?.(values);
    } finally {
      setIsSubmitting(false);
    }
  }, [validate, onSubmit, values]);
  const reset = useCallback((newValues: Partial<T> = {}) => {
    const resetValues = { ...initialValues, ...newValues };
    setState(
      Object.keys(resetValues).reduce((acc, key) => ({
        ...acc,
        [key]: {
          value: resetValues[key as keyof T],
          error: undefined,
          touched: false,
        },
      }), {} as FormState)
    );
    setIsSubmitting(false);
  }, [initialValues]);
  return {
    values,
    errors,
    touched,
    isValid,
    isDirty,
    isSubmitting,
    setValue,
    setError,
    setTouched,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    validate,
  };
};
const validateField = (field: string, value: unknown): string | undefined => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return `${field} is required`;
  }
  if (field.toLowerCase().includes('email') && typeof value === 'string') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Invalid email address';
    }
  }
  return undefined;
};