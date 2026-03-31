import * as React from "react"
import { cn } from "@/lib/utils"

interface SwitchProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked?: boolean; onCheckedChange?: (c: boolean) => void
}
const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className, checked = false, onCheckedChange, ...props }, ref) => (
    <button type="button" role="switch" aria-checked={checked} ref={ref}
      className={cn("peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors", checked ? "bg-primary" : "bg-input", className)}
      onClick={() => onCheckedChange?.(!checked)} {...props}>
      <span className={cn("pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg transition-transform", checked ? "translate-x-5" : "translate-x-0")} />
    </button>
  )
)
Switch.displayName = "Switch"
export { Switch }
