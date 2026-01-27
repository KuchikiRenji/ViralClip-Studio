import { forwardRef } from 'react';
import { cn } from '../../../../lib/utils';
import { Input, InputSize } from '../../atoms/Input';
import { Text } from '../../atoms/Text';

interface FormFieldProps {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const FormField = ({
  label,
  error,
  helperText,
  required = false,
  className,
  children,
}: FormFieldProps) => {
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="block">
          <Text variant="label" size="sm" weight="medium" className="mb-1">
            {label}
            {required && <span className="text-red-400 ml-1">*</span>}
          </Text>
        </label>
      )}
      <div className="relative">
        {children}
      </div>
      {error && (
        <Text variant="caption" size="xs" className="text-red-400">
          {error}
        </Text>
      )}
      {helperText && !error && (
        <Text variant="caption" size="xs" className="text-zinc-500">
          {helperText}
        </Text>
      )}
    </div>
  );
};

interface InputFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  size?: InputSize;
  required?: boolean;
  className?: string;
}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, error, helperText, size = 'md', required = false, className, ...props }, ref) => {
    return (
      <FormField
        label={label}
        error={error}
        helperText={helperText}
        required={required}
        className={className}
      >
        <Input ref={ref} size={size} error={!!error} {...props} />
      </FormField>
    );
  }
);

InputField.displayName = 'InputField';
