import { FieldError } from "react-hook-form";

type InputFieldProps = {
  label: string;
  type?: string;
  register: any;
  name: string;
  defaultValue?: string;
  error?: FieldError;
  hidden?: boolean;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
};

const InputField = ({
  label,
  type = "text",
  register,
  name,
  defaultValue,
  error,
  hidden,
  inputProps,
}: InputFieldProps) => {
  return (
    <div className={hidden ? "hidden" : "flex flex-col gap-2 w-full"}>
      <label className="block text-sm font-medium text-foreground mb-1">
        {label}
      </label>
      <input
        type={type}
        {...register(name)}
        className="block w-full rounded-lg border border-input bg-background shadow-sm p-3 text-sm text-foreground
                   focus:border-primary focus:ring-2 focus:ring-primary/20 transition duration-200
                   hover:border-border"
        {...inputProps}
        defaultValue={defaultValue}
        placeholder={inputProps?.placeholder}
      />
      {error?.message && (
        <p className="mt-1 text-xs text-destructive">{error.message.toString()}</p>
      )}
    </div>
  );
};

export default InputField;