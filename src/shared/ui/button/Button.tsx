import { cn } from "@/views";
import { ButtonHTMLAttributes, PropsWithChildren } from "react";

interface IProps extends PropsWithChildren {
  type?: ButtonHTMLAttributes<HTMLButtonElement>["type"]
  onClick?: () => void
  className?: string
}

export const Button = ({children, className, onClick, type}: IProps) => {
  return (
    <button 
      type={type}
      onClick={onClick}
      className={cn(
        "will-change-transform active:scale-95 select-none transition-all", 
        className
      )}
    >
      {children}
    </button>
  );
};