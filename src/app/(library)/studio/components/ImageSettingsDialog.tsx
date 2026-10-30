'use client';

import { useImageSettingsDialog } from '@/app/(library)/studio/components/useImageSettingsDialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PROVIDER_LABELS } from '@/lib/studio/providerDefaults';
import type { ImageProvider, StudioSettings } from '@/lib/studio/types';

interface ImageSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: StudioSettings;
  onSave: (settings: StudioSettings) => void;
  onClear: () => void;
}

export function ImageSettingsDialog({ open, onOpenChange, settings, onSave, onClear }: ImageSettingsDialogProps) {
  const { draft, setDraft, chooseProvider } = useImageSettingsDialog(open, settings);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Image settings</DialogTitle>
          <DialogDescription>Your key is kept in this browser only and is sent with each generate request, never stored on the server.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>Service</Label>
            <Select value={draft.provider} onValueChange={value => chooseProvider(value as ImageProvider)}>
              <SelectTrigger className="w-full">
                <SelectValue>{PROVIDER_LABELS[draft.provider]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(PROVIDER_LABELS) as ImageProvider[]).map(provider => (
                  <SelectItem key={provider} value={provider}>
                    {PROVIDER_LABELS[provider]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="api-key">API key</Label>
            <Input id="api-key" type="password" autoComplete="off" value={draft.apiKey} onChange={event => setDraft({ ...draft, apiKey: event.target.value })} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="model">Model</Label>
            <Input id="model" value={draft.model} onChange={event => setDraft({ ...draft, model: event.target.value })} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="base-url">Base URL</Label>
            <Input id="base-url" value={draft.baseURL} onChange={event => setDraft({ ...draft, baseURL: event.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => {
              onClear();
              onOpenChange(false);
            }}
          >
            Clear saved settings
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
