'use client';

import { useNegativePromptDialog } from '@/app/(library)/studio/components/useNegativePromptDialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { DEFAULT_NEGATIVE_PROMPT } from '@/lib/catalogue/negativePrompt';

interface NegativePromptDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    value: string;
    onSave: (value: string) => void;
}

export function NegativePromptDialog({ open, onOpenChange, value, onSave }: NegativePromptDialogProps) {
    const { draft, setDraft } = useNegativePromptDialog(open, value);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Negative prompt</DialogTitle>
                    <DialogDescription>
                        What every image should avoid. Services that take a separate negative prompt get it as one; the others read it as an
                        Avoid line at the end of the prompt.
                    </DialogDescription>
                </DialogHeader>
                <Textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    rows={8}
                    aria-label="Negative prompt"
                    className="max-h-[50dvh] text-xs"
                />
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setDraft(DEFAULT_NEGATIVE_PROMPT)}>
                        Reset to default
                    </Button>
                    <Button
                        onClick={() => {
                            onSave(draft);
                            onOpenChange(false);
                        }}
                    >
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
