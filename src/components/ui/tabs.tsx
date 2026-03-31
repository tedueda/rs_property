import * as React from "react"
import { cn } from "@/lib/utils"

interface TabsContextType { value: string; onValueChange: (v: string) => void }
const TabsContext = React.createContext<TabsContextType>({ value: "", onValueChange: () => {} })

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> { value: string; onValueChange: (v: string) => void }
function Tabs({ value, onValueChange, className, children, ...props }: TabsProps) {
  return <TabsContext.Provider value={{ value, onValueChange }}><div className={cn("", className)} {...props}>{children}</div></TabsContext.Provider>
}

function TabsList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground", className)} {...props} />
}

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { value: string }
function TabsTrigger({ className, value, ...props }: TabsTriggerProps) {
  const ctx = React.useContext(TabsContext)
  return <button className={cn("inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all", ctx.value === value && "bg-background text-foreground shadow-sm", className)} onClick={() => ctx.onValueChange(value)} {...props} />
}

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> { value: string }
function TabsContent({ className, value, ...props }: TabsContentProps) {
  const ctx = React.useContext(TabsContext)
  if (ctx.value !== value) return null
  return <div className={cn("mt-2", className)} {...props} />
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
