import { cn } from "@/lib/utils";
import type { Direction } from "@/lib/navigator";
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, CheckCircle2, Compass } from "lucide-react";

interface DirectionArrowProps {
  direction: Direction;
  className?: string;
}

export const DirectionArrow = ({ direction, className }: DirectionArrowProps) => {
  const getIcon = () => {
    switch (direction) {
      case "forward":
        return <ArrowUp className="w-16 h-16" />;
      case "left":
        return <ArrowLeft className="w-16 h-16" />;
      case "right":
        return <ArrowRight className="w-16 h-16" />;
      case "back":
        return <ArrowDown className="w-16 h-16" />;
      case "done":
        return <CheckCircle2 className="w-16 h-16" />;
      default:
        return <Compass className="w-16 h-16" />;
    }
  };

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-2xl p-4 transition-all duration-300",
        direction === "done"
          ? "bg-primary/20 text-primary"
          : "bg-secondary text-secondary-foreground",
        className
      )}
    >
      {getIcon()}
    </div>
  );
};
