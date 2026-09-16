import { ReactNode } from "react";

export function Card({
  label,
  big,
  bigClass = "",
  desc,
  children,
}: {
  label?: string;
  big?: ReactNode;
  bigClass?: string;
  desc?: string;
  children?: ReactNode;
}) {
  return (
    <div className="card">
      {label && <div className="label">{label}</div>}
      {big !== undefined && <div className={"big " + bigClass}>{big}</div>}
      {desc && <div className="desc">{desc}</div>}
      {children}
    </div>
  );
}
