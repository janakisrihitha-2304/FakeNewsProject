import { ButtonHTMLAttributes } from "react";

export function Button({
  variant = "ghost",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "ghost" | "primary" }) {
  return <button className={"btn " + (variant === "primary" ? "primary " : "") + className} {...props} />;
}
