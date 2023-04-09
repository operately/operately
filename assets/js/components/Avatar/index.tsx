import React from 'react';

export default function Avatar({ person_full_name } : { person_full_name : string }) : JSX.Element {
  const initials = person_full_name.split(' ').map((n) => n[0]).join('');

  return (
    <div className="flex items-center justify-center w-10 h-10 text-white bg-gray-500 rounded-full">
      {initials}
    </div>
  );
}
