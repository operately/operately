import React from 'react';

export default function PageTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h1 className="text-2xl font-bold">{title}</h1>
    </div>
  );
}
