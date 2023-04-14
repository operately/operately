import React from 'react';

import TipTap from './TipTap';

export default function Editor() {
  return (
    <div className="mt-4 rounder bg-white shadow p-2">
      <div className="py-2 border-b border-stone-200 text-sm">POST AN UPDATE</div>

      <TipTap className="mt-2" />
    </div>
  );
}
