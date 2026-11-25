import * as React from "react"

import { cn } from "@/lib/utils"

type TableProps = React.HTMLAttributes<HTMLTableElement> & {
  /** En teléfonos convierte filas en fichas; "scroll" mantiene la tabla horizontal. */
  mobileView?: "cards" | "scroll"
  scrollLabel?: string
}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, mobileView = "cards", scrollLabel = "Tabla de registros", children, ...props }, ref) => {
    const tableRef = React.useRef<HTMLTableElement | null>(null)

    const assignRef = React.useCallback((node: HTMLTableElement | null) => {
      tableRef.current = node
      if (typeof ref === "function") ref(node)
      else if (ref) (ref as React.MutableRefObject<HTMLTableElement | null>).current = node
    }, [ref])

    React.useEffect(() => {
      if (mobileView !== "cards") return
      const root = tableRef.current
      if (!root) return
      let scheduled = false
      const syncLabels = () => {
        if (!root) return
        const headings = Array.from(root.querySelectorAll<HTMLTableCellElement>("thead tr:last-child th"))
          .map((cell) => cell.textContent?.trim() || "Detalle")
        root.querySelectorAll<HTMLTableRowElement>("tbody tr").forEach(row => {
          let index = 0
          row.querySelectorAll<HTMLTableCellElement>(":scope > td").forEach(cell => {
            const span = cell.colSpan || 1
            if (span > 1) {
              cell.removeAttribute("data-mobile-label")
              cell.setAttribute("data-mobile-full", "true")
            } else {
              cell.removeAttribute("data-mobile-full")
              cell.setAttribute("data-mobile-label", headings[index] || "Detalle")
            }
            index += span
          })
        })
      }
      syncLabels()
      const observer = new MutationObserver(() => {
        if (scheduled) return
        scheduled = true
        queueMicrotask(() => { scheduled = false; syncLabels() })
      })
      observer.observe(root, { childList: true, subtree: true, characterData: true })
      return () => observer.disconnect()
    }, [mobileView, children])

    return (
      <div
        role="region"
        tabIndex={0}
        aria-label={scrollLabel}
        className="dmre-table-viewport relative w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      >
        <table
          ref={assignRef}
          data-mobile-view={mobileView}
          className={cn("dmre-data-table w-full caption-bottom text-sm", className)}
          {...props}
        >
          {children}
        </table>
      </div>
    )
  }
)
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("p-4 align-middle break-words whitespace-normal max-w-[200px] sm:max-w-[300px] md:max-w-[400px] lg:max-w-[500px] [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
