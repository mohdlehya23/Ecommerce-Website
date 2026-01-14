import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = "", id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={inputId} className="label">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <input
          ref={ref}
          id={inputId}
          className={`input ${
            error
              ? "border-red-500 focus:ring-red-500"
              : "border-border focus:ring-accent"
          } ${className}`}
          {...props}
        />

        {error && <p className="text-sm text-red-500">{error}</p>}

        {hint && !error && <p className="text-sm text-muted">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
