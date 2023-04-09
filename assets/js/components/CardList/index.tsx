import React from 'react';

export default function CardList({children}) {
  return <div className="flex flex-col gap-2">{
    children.map((child: JSX.Element) => child)
  }</div>;
}
