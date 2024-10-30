import React from "react";

interface Props {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function Header({ title, subtitle, actions }: Props) {
  return (
    <div className="mb-8 flex items-center justify-between">
      <div>
        <Title title={title} />
        {subtitle && <Subtitle message={subtitle} />}
      </div>

      <div>{actions}</div>
    </div>
  );
}

function Title({ title }) {
  return <div className="text-content-accent text-3xl font-extrabold">{title}</div>;
}

function Subtitle({ message }) {
  return <div className="mt-2">{message}</div>;
}
