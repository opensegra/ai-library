'use client';

import { CUSTOM_MODEL, useModelField } from '@/app/(library)/studio/components/useModelField';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ModelFieldProps {
  id: string;
  models: string[];
  value: string;
  onChange: (model: string) => void;
}

export function ModelField({ id, models, value, onChange }: ModelFieldProps) {
  const { custom, choose } = useModelField(models, value, onChange);

  return (
    <div className="grid gap-1">
      <Label htmlFor={custom ? `${id}-custom` : id}>Model</Label>
      {models.length ? (
        <Select value={custom ? CUSTOM_MODEL : value} onValueChange={choose}>
          <SelectTrigger id={id} size="sm" className="w-full min-w-0">
            <SelectValue>{custom ? 'Custom model…' : value}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {models.map(model => (
              <SelectItem key={model} value={model}>
                {model}
              </SelectItem>
            ))}
            <SelectItem value={CUSTOM_MODEL}>Custom model…</SelectItem>
          </SelectContent>
        </Select>
      ) : null}
      {custom ? <Input id={`${id}-custom`} value={value} onChange={event => onChange(event.target.value)} placeholder="model ID, exactly as the service writes it" autoComplete="off" /> : null}
    </div>
  );
}
