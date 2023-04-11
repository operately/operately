import React from 'react';

interface Props extends React.ComponentPropsWithoutRef<"textarea"> {
  id: string;
  label: string;
}

export type Ref = HTMLTextAreaElement;

const FormTextArea = React.forwardRef<Ref, Props>(({id, label, ...rest}, ref) => {
  return <div>
    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor={id}>{label}</label>
    <textarea {...rest} id={id} ref={ref} className="border border-gray-200 rounded w-full p-2 -mb-2" />
  </div>;
});

export default FormTextArea;
