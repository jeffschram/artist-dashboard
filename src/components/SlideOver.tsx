import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";

interface SlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function SlideOver({ isOpen, onClose, children }: SlideOverProps) {
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="p-0 w-[min(560px,90vw)] sm:max-w-[560px] overflow-hidden">
        <VisuallyHidden.Root>
          <SheetTitle>Panel</SheetTitle>
        </VisuallyHidden.Root>
        {children}
      </SheetContent>
    </Sheet>
  );
}
