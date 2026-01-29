import { ReactNode } from 'react';
import {
  useFormContext,
  FieldValues,
  Path,
  RegisterOptions,
} from 'react-hook-form';
import { cn } from '@/lib/utils';

interface FormFieldProps<T extends FieldValues> {
  name: Path<T>;
  label?: string;
  type?: 'text' | 'email' | 'password' | 'tel' | 'date' | 'number';
  placeholder?: string;
  icon?: ReactNode;
  rightIcon?: ReactNode;
  onRightIconClick?: () => void;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
  rules?: RegisterOptions<T>;
  helperText?: string;
}

export function FormField<T extends FieldValues>({
  name,
  label,
  type = 'text',
  placeholder,
  icon,
  rightIcon,
  onRightIconClick,
  className,
  inputClassName,
  disabled,
  rules,
  helperText,
}: FormFieldProps<T>) {
  const {
    register,
    formState: { errors },
  } = useFormContext<T>();

  const error = errors[name];
  const errorMessage = error?.message as string | undefined;

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <input
          id={name}
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          {...register(name, rules)}
          className={cn(
            'w-full px-4 py-2.5 border rounded-lg transition-colors',
            'focus:ring-2 focus:ring-orange-500 focus:border-orange-500',
            'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
            icon && 'pl-10',
            rightIcon && 'pr-12',
            error
              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-200',
            inputClassName
          )}
        />
        {rightIcon && (
          <button
            type="button"
            onClick={onRightIconClick}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {rightIcon}
          </button>
        )}
      </div>
      {errorMessage && (
        <p className="text-sm text-red-500">{errorMessage}</p>
      )}
      {helperText && !errorMessage && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
}

interface FormSelectProps<T extends FieldValues> {
  name: Path<T>;
  label?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  rules?: RegisterOptions<T>;
}

export function FormSelect<T extends FieldValues>({
  name,
  label,
  options,
  placeholder,
  className,
  disabled,
  rules,
}: FormSelectProps<T>) {
  const {
    register,
    formState: { errors },
  } = useFormContext<T>();

  const error = errors[name];
  const errorMessage = error?.message as string | undefined;

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}
      <select
        id={name}
        disabled={disabled}
        {...register(name, rules)}
        className={cn(
          'w-full px-4 py-2.5 border rounded-lg transition-colors',
          'focus:ring-2 focus:ring-orange-500 focus:border-orange-500',
          'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
          error
            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-200'
        )}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {errorMessage && (
        <p className="text-sm text-red-500">{errorMessage}</p>
      )}
    </div>
  );
}

interface FormCheckboxProps<T extends FieldValues> {
  name: Path<T>;
  label: ReactNode;
  className?: string;
  disabled?: boolean;
  rules?: RegisterOptions<T>;
}

export function FormCheckbox<T extends FieldValues>({
  name,
  label,
  className,
  disabled,
  rules,
}: FormCheckboxProps<T>) {
  const {
    register,
    formState: { errors },
  } = useFormContext<T>();

  const error = errors[name];
  const errorMessage = error?.message as string | undefined;

  return (
    <div className={cn('space-y-1', className)}>
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          disabled={disabled}
          {...register(name, rules)}
          className={cn(
            'w-4 h-4 mt-0.5 rounded border-gray-300',
            'text-orange-600 focus:ring-orange-500',
            'disabled:cursor-not-allowed'
          )}
        />
        <span className="text-sm text-gray-600">{label}</span>
      </label>
      {errorMessage && (
        <p className="text-sm text-red-500 ml-7">{errorMessage}</p>
      )}
    </div>
  );
}

interface FormTextareaProps<T extends FieldValues> {
  name: Path<T>;
  label?: string;
  placeholder?: string;
  rows?: number;
  className?: string;
  disabled?: boolean;
  rules?: RegisterOptions<T>;
}

export function FormTextarea<T extends FieldValues>({
  name,
  label,
  placeholder,
  rows = 4,
  className,
  disabled,
  rules,
}: FormTextareaProps<T>) {
  const {
    register,
    formState: { errors },
  } = useFormContext<T>();

  const error = errors[name];
  const errorMessage = error?.message as string | undefined;

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}
      <textarea
        id={name}
        rows={rows}
        placeholder={placeholder}
        disabled={disabled}
        {...register(name, rules)}
        className={cn(
          'w-full px-4 py-2.5 border rounded-lg transition-colors resize-none',
          'focus:ring-2 focus:ring-orange-500 focus:border-orange-500',
          'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
          error
            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-200'
        )}
      />
      {errorMessage && (
        <p className="text-sm text-red-500">{errorMessage}</p>
      )}
    </div>
  );
}
