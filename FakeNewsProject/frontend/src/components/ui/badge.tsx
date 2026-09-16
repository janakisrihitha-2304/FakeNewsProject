export function Badge({ children, live = false }: { children: React.ReactNode; live?: boolean }) {
  return <span className={"badge" + (live ? " live" : "")}>{children}</span>;
}
