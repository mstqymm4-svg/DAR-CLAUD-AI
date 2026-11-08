import { cn } from "@/lib/utils";

/**
 * SettingRow — unified, RTL-safe layout for a single setting.
 *
 * Layout (in RTL):  [ icon ]  title                  [ control ]
 *                            description
 *
 * - icon:      optional leading icon (sits at inline-start = right in RTL)
 * - title:     row title (bold)
 * - description: optional helper text under the title
 * - control:   the interactive element (Switch, Select, button, etc.)
 * - trailing:  optional extra node rendered between content and control
 *
 * Uses Flexbox with justify-between + logical gap so the control never
 * overflows the card and stays in the same row at every breakpoint.
 */
export default function SettingRow({
  icon,
  title,
  description,
  control,
  trailing,
  className,
  contentClassName,
  controlClassName,
}) {
  return (
    <div
      className={cn(
        "flex flex-row items-center justify-between gap-4 w-full",
        className
      )}
    >
      <div className={cn("flex items-center gap-3 min-w-0 flex-1", contentClassName)}>
        {icon && <span className="shrink-0 text-muted-foreground">{icon}</span>}
        <div className="min-w-0">
          {title && (
            <p className="text-sm font-medium text-foreground truncate text-start">{title}</p>
          )}
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate text-start">{description}</p>
          )}
        </div>
        {trailing}
      </div>
      {control && <div className={cn("shrink-0", controlClassName)}>{control}</div>}
    </div>
  );
}