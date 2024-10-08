import React from "react";

interface Props {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function Section({ title, subtitle, children }: Props) {
  return (
    <div className="mb-10">
      <SectionTitle title={title} subtitle={subtitle} />

      {children}
    </div>
  );
}

interface SectionTitleProps {
  title: string;
  subtitle?: string;
}

function SectionTitle({ title, subtitle }: SectionTitleProps) {
  return (
    <div className="mb-2">
      <h2 className="font-bold text-lg">{title}</h2>
      {subtitle && <p className="text-sm">{subtitle}</p>}
    </div>
  );
}
