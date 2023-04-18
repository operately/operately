import React from 'react';

export default function SectionHeader({children}: {children: any}) : JSX.Element {
  return <div className="text-xs text-dark-2 uppercase mb-3 mt-10">{children}</div>;
};
