import React from "react";

interface Props extends React.ComponentPropsWithoutRef<"input"> {
  id: string;
  label: string;
}

export type Ref = HTMLInputElement;

const FormTextInput = React.forwardRef<Ref, Props>(({ id, label, ...rest }: any, ref) => {
  return (
    <div>
      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor={id}>
        {label}
      </label>
      <input {...rest} id={id} ref={ref} type="text" className="border border-gray-200 rounded w-full p-2" />
    </div>
  );
});

export default FormTextInput;
