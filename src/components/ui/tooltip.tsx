import * as React from "react"
import { cn } from "@/lib/utils"

function Tooltip({ children, content, side = "top" }: { children: React.ReactNode; content: string; side?: "top" | "bottom" | "left" | "right" }) {
  const [show, setShow] = React.useState(false)
  const pos = { top: "bottom-full left-1/2 -translate-x-1/2 mb-2", bottom: "top-full left-1/2 -translate-x-1/2 mt-2", left: "right-full top-1/2 -translate-y-1/2 mr-2", right: "left-full top-1/2 -translate-y-1/2 ml-2" }
  return (
    <div className="relative inline-flex" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && <div className={cn("absolute z-50 rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md whitespace-nowrap", pos[side])}>{content}</div>}
    </div>
  )
}
export { Tooltip }
