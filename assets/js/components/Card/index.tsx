import React from 'react';

export default function Card({children}) {
  return (
    <div className="py-2 px-4 bg-white rounded shadow-sm hover:shadow hover:cursor-pointer">
      {children}
    </div>
  );
}
