'use client';

import { ExternalLinkIcon, PlusIcon, Trash2Icon } from 'lucide-react';

import { PuterAccount } from '@/app/(library)/studio/components/PuterAccount';
import { useImageSettingsDialog } from '@/app/(library)/studio/components/useImageSettingsDialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { needsKey, presetFor, SERVICE_PRESETS } from '@/lib/studio/servicePresets';
import type { ServicePresetId, StudioSettings } from '@/lib/studio/types';

interface ImageSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: StudioSettings;
  onSave: (settings: StudioSettings) => void;
  onClear: () => void;
}

export function ImageSettingsDialog({ open, onOpenChange, settings, onSave, onClear }: ImageSettingsDialogProps) {
  const { draft, add, remove, update, choosePreset, toggle, finished } = useImageSettingsDialog(open, settings);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90dvh] flex-col sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Image settings</DialogTitle>
          <DialogDescription>
            Add one or more image services. Ticked services are all used, so each pose is generated once per service. Keys stay in this browser and are only sent with a generate request. Puter needs no key: you sign in with your own Puter
            account instead.
          </DialogDescription>
        </DialogHeader>
        <div className="-mx-1 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-1">
          {draft.services.map(service => {
            const preset = presetFor(service.preset);
            const keyed = needsKey(service.preset);

            return (
              <div key={service.id} className="grid gap-2.5 rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <Checkbox checked={draft.selected.includes(service.id)} onCheckedChange={() => toggle(service.id)} aria-label={`Use ${preset.label}`} />
                  <Select value={service.preset} onValueChange={value => choosePreset(service.id, value as ServicePresetId)}>
                    <SelectTrigger size="sm" className="min-w-0 flex-1">
                      <SelectValue>{preset.label}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICE_PRESETS.map(option => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon-sm" aria-label={`Remove ${preset.label}`} onClick={() => remove(service.id)}>
                    <Trash2Icon />
                  </Button>
                </div>
                {keyed ? (
                  <div className="grid gap-1">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`${service.id}-key`}>API key</Label>
                      {preset.keyPage ? (
                        <a href={preset.keyPage} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                          Get a key
                          <ExternalLinkIcon className="size-3" />
                        </a>
                      ) : null}
                    </div>
                    <Input id={`${service.id}-key`} type="password" autoComplete="off" value={service.apiKey} onChange={event => update(service.id, { apiKey: event.target.value })} />
                  </div>
                ) : (
                  <PuterAccount />
                )}
                <div className={keyed ? 'grid gap-2 sm:grid-cols-2' : 'grid gap-2'}>
                  <div className="grid gap-1">
                    <Label htmlFor={`${service.id}-model`}>Model</Label>
                    <Input id={`${service.id}-model`} value={service.model} onChange={event => update(service.id, { model: event.target.value })} placeholder="model name" />
                  </div>
                  {keyed ? (
                    <div className="grid gap-1">
                      <Label htmlFor={`${service.id}-url`}>Base URL</Label>
                      <Input id={`${service.id}-url`} value={service.baseURL} onChange={event => update(service.id, { baseURL: event.target.value })} placeholder="https://…/v1" />
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" className="self-start" />}>
              <PlusIcon />
              Add a service
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64">
              {SERVICE_PRESETS.map(option => (
                <DropdownMenuItem key={option.id} onClick={() => add(option.id)}>
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => {
              onClear();
              onOpenChange(false);
            }}
          >
            Remove all services
          </Button>
          <Button
            onClick={() => {
              onSave(finished());
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
