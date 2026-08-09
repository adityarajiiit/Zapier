import { cn } from "@/lib/utils";

interface ErrorAlertProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  message?: string;
}

export function ErrorAlert({ 
  title = "Failed to load data", 
  message = "Please try again later",
  className,
  ...props 
}: ErrorAlertProps) {
  return (
    <div className={cn("flex min-h-[400px] w-full items-center justify-center p-4", className)} {...props}>
      <div role="alert" className="alert alert-error max-w-md shadow-lg">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <h3 className="font-bold">{title}</h3>
          <div className="text-xs">{message}</div>
        </div>
      </div>
    </div>
  );
}
