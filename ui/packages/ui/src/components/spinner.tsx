import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../lib/utils";

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

function Spinner({ size = "md", className, ...props }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn("animate-spin", className)}
      {...props}
    >
      <Loader2 className={cn(sizeClasses[size], "text-current")} />
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export { Spinner };
