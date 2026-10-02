import { useState, useCallback, useMemo } from 'react';
import { SchemaDefinition, validateSchema, ValidationResult } from '../utils/validation';

export interface UseFormValidationOptions<T extends Record<string, any>> {
  initialValues: T;
  schema?: SchemaDefinition<T>;
  customValidator?: (values: T) => ValidationResult<T>;
  onSubmit?: (values: T) => void | Promise<void>;
}

export function useFormValidation<T extends Record<string, any>>({
  initialValues,
  schema,
  customValidator,
  onSubmit,
}: UseFormValidationOptions<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // Validate entire dataset
  const validate = useCallback(
    (dataToValidate: T = values): ValidationResult<T> => {
      if (customValidator) {
        return customValidator(dataToValidate);
      }
      if (schema) {
        return validateSchema(dataToValidate, schema);
      }
      return { isValid: true, errors: {} };
    },
    [values, schema, customValidator]
  );

  // Set single field value
  const setValue = useCallback(
    <K extends keyof T>(field: K, val: T[K]) => {
      setValues((prev) => {
        const next = { ...prev, [field]: val };
        // If submitted or field is touched, validate live
        if (submitAttempted || touched[field as string]) {
          const res = validate(next);
          setErrors(res.errors);
        }
        return next;
      });
    },
    [submitAttempted, touched, validate]
  );

  // Mark field as touched and validate
  const handleBlur = useCallback(
    (field: keyof T) => {
      setTouched((prev) => ({ ...prev, [field as string]: true }));
      const res = validate(values);
      setErrors(res.errors);
    },
    [values, validate]
  );

  // Clear specific or all errors
  const clearErrors = useCallback((field?: keyof T) => {
    if (field) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field as string];
        return copy;
      });
    } else {
      setErrors({});
    }
  }, []);

  const setFieldError = useCallback((field: keyof T, errorMsg: string) => {
    setErrors((prev) => ({ ...prev, [field as string]: errorMsg }));
  }, []);

  // Form submission handler with hard-gated schema validation
  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e && e.preventDefault) {
        e.preventDefault();
      }
      setSubmitAttempted(true);
      setIsSubmitting(true);

      // Mark all fields as touched
      const allTouched: Record<string, boolean> = {};
      Object.keys(values).forEach((k) => {
        allTouched[k] = true;
      });
      setTouched(allTouched);

      const validationRes = validate(values);
      setErrors(validationRes.errors);

      if (!validationRes.isValid) {
        setIsSubmitting(false);
        return { success: false, errors: validationRes.errors, firstError: validationRes.firstError };
      }

      try {
        if (onSubmit) {
          await onSubmit(values);
        }
        setIsSubmitting(false);
        return { success: true, values };
      } catch (err) {
        setIsSubmitting(false);
        throw err;
      }
    },
    [values, validate, onSubmit]
  );

  const resetForm = useCallback((newValues?: T) => {
    setValues(newValues || initialValues);
    setErrors({});
    setTouched({});
    setSubmitAttempted(false);
    setIsSubmitting(false);
  }, [initialValues]);

  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

  return {
    values,
    setValues,
    setValue,
    errors,
    setErrors,
    setFieldError,
    clearErrors,
    touched,
    handleBlur,
    handleSubmit,
    resetForm,
    isValid,
    isSubmitting,
    submitAttempted,
    validate,
  };
}
