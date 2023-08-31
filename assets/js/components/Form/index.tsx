import React from "react";

export type Ref = HTMLFormElement;

import Button from "@/components/Button";

export * from "./radio";

interface Props {
  children?: React.ReactNode;
  loading?: boolean;
  onCancel?: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isValid: boolean;
  submitButtonContent?: React.ReactNode;
}

interface FormContextDescriptor {
  loading?: boolean;
  isValid?: boolean;
  onCancel?: () => void;
}

const Context = React.createContext<FormContextDescriptor>({});

export const Form = React.forwardRef<Ref, Props>((props, ref) => {
  const { children } = props;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    props.onSubmit(e);
  };

  return (
    <Context.Provider value={{ loading: props.loading, isValid: props.isValid, onCancel: props.onCancel }}>
      <form className="flex flex-col gap-6" ref={ref} onSubmit={handleSubmit}>
        {children}
      </form>
    </Context.Provider>
  );
});

export function SubmitArea({ children }) {
  return <div className="flex gap-2 mt-4">{children}</div>;
}

export function SubmitButton({ children, ...props }) {
  const { loading, isValid } = React.useContext(Context);

  return (
    <Button submit variant="success" loading={loading} disabled={!isValid} {...props}>
      {children}
    </Button>
  );
}

export function CancelButton({ children }) {
  const { onCancel } = React.useContext(Context);

  return (
    <Button variant="secondary" onClick={onCancel}>
      {children}
    </Button>
  );
}

export function TextInput({ label, value, onChange, placeholder = "", ...props }) {
  const id = React.useMemo(() => Math.random().toString(36), []);

  return (
    <div>
      <label htmlFor={id} className="font-bold mb-1 block">
        {label}
      </label>

      <div className="flex-1">
        <input
          id={id}
          className="w-full bg-shade-3 text-white-1 placeholder-white-2 border-none rounded-lg px-3"
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          {...props}
        />
      </div>
    </div>
  );
}

export function Switch({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between">
      <label className="font-medium">{label}</label>

      <div
        style={{ width: "2.6rem" }}
        className={classname("h-6 bg-dark-5 rounded-full relative outline-none cursor-pointer", {
          "bg-green-400": value,
        })}
        onClick={() => onChange(!value)}
      >
        <div
          className={classname(
            "block w-5 h-5 bg-dark-3 rounded-full transition-transform duration-100 translate-x-0.5 absolute top-0.5",
            { "translate-x-5": value },
          )}
        ></div>
      </div>
    </div>
  );
}

export function Textarea({ value, onChange, ...props }) {
  const textAreaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (textAreaRef.current) {
      // We need to reset the height momentarily to get the correct scrollHeight for the textarea
      textAreaRef.current.style.height = "0px";
      const scrollHeight = textAreaRef.current.scrollHeight;

      // We then set the height directly, outside of the render loop
      // Trying to set this with state or a ref will product an incorrect value.
      textAreaRef.current.style.height = scrollHeight + "px";
    }
  }, [textAreaRef, value]);

  return <textarea id="review-text" ref={textAreaRef} value={value} onChange={onChange} {...props} />;
}
