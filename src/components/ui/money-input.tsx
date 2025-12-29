import * as React from "react"
import { cn } from "@/lib/utils"

interface MoneyInputProps extends Omit<React.ComponentProps<"input">, 'type'> {
  // Remove type from props as we always use number
}

const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ className, onWheel, ...props }, ref) => {
    const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
      // Prevent scroll wheel from changing the value
      e.currentTarget.blur();
      // Prevent the scroll event from being blocked
      e.stopPropagation();
    };

    return (
      <input
        type="number"
        step="any"
        className={cn(
          "money-input flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        onWheel={handleWheel}
        {...props}
      />
    )
  }
)
MoneyInput.displayName = "MoneyInput"

export { MoneyInput }
