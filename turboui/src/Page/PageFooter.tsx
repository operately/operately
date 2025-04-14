import classNames from "../utils/classnames";

export function PageFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const cn = classNames(
    "bg-surface-dimmed border-t border-surface-outline sm:rounded-b-lg",
    className
  );

  return <div className={cn}>{children}</div>;
}
