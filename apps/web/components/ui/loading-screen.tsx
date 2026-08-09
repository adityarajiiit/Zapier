import { cn } from "@/lib/utils";
import { OrbitRing } from "./orbit-ring";

interface LoadingScreenProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string;
}

export function LoadingScreen({ 
  message = "Loading data...",
  className,
  ...props 
}: LoadingScreenProps) {
  return (
    <div className={cn("flex min-h-[400px] flex-col items-center justify-center gap-6", className)} {...props}>
      <OrbitRing className="size-16 text-primary" />
      <p className="text-sm font-medium tracking-wide text-base-content/50">
        {message}
      </p>
    </div>
  );
}
