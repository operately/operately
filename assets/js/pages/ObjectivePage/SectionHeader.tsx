import React from 'react';

export default function SectionHeader({children}: {children: any}) : JSX.Element {
  return <div className="text-dark-1 uppercase mb-3 mt-10">{children}</div>;
};
