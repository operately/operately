import React from "react";

export type Ref = HTMLFormElement;

import Button from "@/components/Button";

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
}

const Context = React.createContext<FormContextDescriptor>({});

export const Form = React.forwardRef<Ref, Props>((props, ref) => {
  const { children } = props;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    props.onSubmit(e);
  };

  return (
    <Context.Provider value={{ loading: props.loading, isValid: props.isValid }}>
      <form className="flex flex-col gap-6" ref={ref} onSubmit={handleSubmit}>
        {children}
      </form>
    </Context.Provider>
  );
});

export function SubmitArea({ children }) {
  return <div className="flex gap-2 mt-4">{children}</div>;
}

export function SubmitButton({ children }) {
  const { loading, isValid } = React.useContext(Context);

  return (
    <Button submit variant="success" loading={loading} disabled={!isValid}>
      {children}
    </Button>
  );
}

export function TextInput({ label, value, onChange }) {
  return (
    <div>
      <label className="font-bold mb-1 block">{label}</label>

      <div className="flex-1">
        <input
          className="w-full bg-shade-3 text-white-1 placeholder-white-2 border-none rounded-lg px-3"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}

export function Toggle({ label, value, onChange }) {
  return (
    <div className="flex items-center">
      <input className="mr-2" type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
      <label>{label}</label>
    </div>
  );
}
