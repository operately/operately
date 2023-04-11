import React from 'react';

interface Props extends React.ComponentPropsWithoutRef<"select"> {
  id: string;
  label: string;
}

export type Ref = HTMLSelectElement;

const FormSelect = React.forwardRef<Ref, Props>(({id, label, children, ...rest}, ref) => {
  return (
    <div>
      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor={id}>{label}</label>
      <select {...rest} id={id} ref={ref} className="border border-gray-200 rounded w-full p-2">
        {children}
      </select>
    </div>
  );
});

export default FormSelect;
