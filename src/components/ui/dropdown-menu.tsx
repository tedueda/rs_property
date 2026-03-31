import * as React from "react"
import { cn } from "@/lib/utils"

interface DropdownCtx { open: boolean; setOpen: (o: boolean) => void }
const Ctx = React.createContext<DropdownCtx>({ open: false, setOpen: () => {} })

function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  return <Ctx.Provider value={{ open, setOpen }}><div className="relative inline-block text-left">{children}</div></Ctx.Provider>
}

function DropdownMenuTrigger({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { setOpen, open } = React.useContext(Ctx)
  return <button className={cn("", className)} onClick={() => setOpen(!open)} {...props}>{children}</button>
}

function DropdownMenuContent({ children, className, align = "end", ...props }: React.HTMLAttributes<HTMLDivElement> & { align?: "start" | "end" }) {
  const { open, setOpen } = React.useContext(Ctx)
  const ref = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    if (open) document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [open, setOpen])
  if (!open) return null
  return <div ref={ref} className={cn("absolute z-50 mt-1 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md", align === "end" ? "right-0" : "left-0", className)} {...props}>{children}</div>
}

function DropdownMenuItem({ className, onClick, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const { setOpen } = React.useContext(Ctx)
  return <div className={cn("relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground", className)} onClick={(e) => { setOpen(false); onClick?.(e) }} {...props} />
}

function DropdownMenuSeparator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("-mx-1 my-1 h-px bg-muted", className)} {...props} />
}

function DropdownMenuLabel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-2 py-1.5 text-sm font-semibold", className)} {...props} />
}

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel }
