import React from 'react';
import { Link } from 'react-router-dom';

export default function ButtonLink({ to, children }: { to: string, children: any }) : JSX.Element {
  return (
    <Link className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" to={to}>{children}</Link>
  );
}
