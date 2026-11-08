import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Select component that renders as a bottom-drawer (Vaul) on mobile
 * and a standard Radix Select dropdown on desktop.
 *
 * @param {string} value - Current selected value
 * @param {function} onValueChange - Callback when selection changes
 * @param {Array<{value: string, label: string}>} options - Select options
 * @param {string} placeholder - Placeholder / drawer title
 * @param {string} triggerClassName - Additional classes for the trigger
 */
export function MobileSelect({
  value,
  onValueChange,
  options,
  placeholder,
  triggerClassName,
}) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  if (!isMobile) {
    return (
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className={triggerClassName}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  const selectedLabel =
    options.find((o) => o.value === value)?.label || placeholder;

  const handleSelect = (val) => {
    onValueChange(val);
    setOpen(false);
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring",
            triggerClassName
          )}
        >
          <span className="line-clamp-1">{selectedLabel}</span>
          <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
        </button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="pb-2">
          <DrawerTitle>{placeholder || "اختر"}</DrawerTitle>
        </DrawerHeader>
        <div className="px-2 pb-6 max-h-[50vh] overflow-y-auto">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleSelect(opt.value)}
              className={cn(
                "flex items-center justify-between w-full px-4 py-3 rounded-lg text-sm transition-colors",
                opt.value === value
                  ? "bg-primary/10 text-primary font-medium"
                  : "hover:bg-muted"
              )}
            >
              {opt.label}
              {opt.value === value && <Check className="w-4 h-4" />}
            </button>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}