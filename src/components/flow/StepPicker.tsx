import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { StepPickerContent } from "./StepPickerContent";

interface StepPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (templateId: string) => void;
  onSelectCondition: (question: string) => void;
  onSelectParallel: () => void;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
}

export function StepPicker({
  open,
  onOpenChange,
  onSelectTemplate,
  onSelectCondition,
  onSelectParallel,
  children,
  side = "bottom",
  align = "center",
}: StepPickerProps) {
  function closeAndSelect(callback: () => void): void {
    callback();
    onOpenChange(false);
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent
        side={side}
        align={align}
        className="w-[260px] p-0 overflow-hidden"
        sideOffset={8}
      >
        <StepPickerContent
          onSelectTemplate={(id) => closeAndSelect(() => onSelectTemplate(id))}
          onSelectCondition={(q) => closeAndSelect(() => onSelectCondition(q))}
          onSelectParallel={() => closeAndSelect(() => onSelectParallel())}
        />
      </PopoverContent>
    </Popover>
  );
}
