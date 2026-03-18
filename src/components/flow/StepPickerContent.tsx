import { SmartStepSearch } from "./SmartStepSearch";

export interface StepPickerContentProps {
  onSelectTemplate: (templateId: string) => void;
  onSelectCondition: (question: string) => void;
  onSelectParallel: () => void;
}

/** Shared content for step picker -- used inside both Popover and floating overlay. */
export function StepPickerContent({
  onSelectTemplate,
  onSelectCondition,
  onSelectParallel,
}: StepPickerContentProps) {
  return (
    <SmartStepSearch
      onSelectTemplate={onSelectTemplate}
      onSelectCondition={onSelectCondition}
      onSelectParallel={onSelectParallel}
    />
  );
}
