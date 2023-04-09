import React from 'react';

const FormTextArea = React.forwardRef<HTMLTextAreaElement>(({id, label, ...rest} : any, ref) => {
  return <>
    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor={id}>Description</label>
    <textarea {...rest} id={id} ref={ref} className="border border-gray-200 rounded w-full p-2" />
  </>;
});

export default FormTextArea;
