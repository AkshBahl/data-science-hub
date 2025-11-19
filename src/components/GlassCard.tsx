import { cn } from "@/lib/utils";
import { ReactNode, HTMLAttributes } from "react";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

const GlassCard = ({ children, className, hover = true, ...props }: GlassCardProps) => {
  return (
    <div
      className={cn(
        "bg-card/50 backdrop-blur-xl border border-border/50 rounded-lg p-6",
        "shadow-glass",
        hover && "hover:border-primary/50 hover:shadow-glow-primary transition-all duration-300",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default GlassCard;