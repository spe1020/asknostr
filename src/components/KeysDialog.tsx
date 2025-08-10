import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { KeysDisplay } from "./KeysDisplay";

interface KeysDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeysDialog({ isOpen, onClose }: KeysDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Your Nostr Keys</DialogTitle>
        </DialogHeader>
        <KeysDisplay />
      </DialogContent>
    </Dialog>
  );
}
