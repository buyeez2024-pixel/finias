import React from 'react';
import { AlertCircle } from 'lucide-react';

interface FormFieldErrorProps {
  error?: string | null;
  className?: string;
  showIcon?: boolean;
}

export const FormFieldError: React.FC<FormFieldErrorProps> = ({
  error,
  className = '',
  showIcon = true,
}) => {
  if (!error) return null;

  return (
    <div
      role="alert"
      className={`flex items-center gap-1.5 text-xs text-red-500 dark:text-red-400 mt-1.5 font-medium animate-fadeIn ${className}`}
    >
      {showIcon && <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500 dark:text-red-400" />}
      <span>{error}</span>
    </div>
  );
};
