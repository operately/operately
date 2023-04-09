import React from 'react';

const FormTextInput = React.forwardRef<HTMLInputElement>(({id, label, ...rest} : any, ref) => {
  return <>
    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor={id}>{label}</label>
    <input {...rest} id={id} ref={ref} type="text" className="border border-gray-200 rounded w-full p-2" />
  </>;
});

export default FormTextInput;
