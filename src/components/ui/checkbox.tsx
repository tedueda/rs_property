import * as React from "react"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface CheckboxProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked?: boolean; onCheckedChange?: (c: boolean) => void
}
const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ className, checked = false, onCheckedChange, ...props }, ref) => (
    <button type="button" role="checkbox" aria-checked={checked} ref={ref}
      className={cn("peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background", checked && "bg-primary text-primary-foreground", className)}
      onClick={() => onCheckedChange?.(!checked)} {...props}>
      {checked && <Check className="h-3 w-3 mx-auto" />}
    </button>
  )
)
Checkbox.displayName = "Checkbox"
export { Checkbox }
