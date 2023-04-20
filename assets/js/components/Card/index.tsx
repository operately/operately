import React from 'react';

export default function Card({children}) {
  return (
    <div className="py-4 px-4 bg-white rounded-lg card-shadow hover:card-shadow-blue hover:cursor-pointer">
      {children}
    </div>
  );
}
