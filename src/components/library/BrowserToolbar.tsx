'use client';

import { SearchIcon, SlidersHorizontalIcon } from 'lucide-react';

import { useBrowserToolbar } from '@/components/library/useBrowserToolbar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ANGLES } from '@/lib/catalogue/angles';
import type { SortOrder } from '@/lib/catalogue/filterItems';

interface BrowserToolbarProps {
  title: string;
  count: number;
  showsAngles: boolean;
  query: string;
  sort: SortOrder;
  angle: string;
  compareCount: number;
  onQuery: (value: string) => void;
  onSort: (value: SortOrder) => void;
  onAngle: (value: string) => void;
  onCompare: () => void;
}

const SORT_LABELS: Record<SortOrder, string> = { number: 'Number', name: 'Name', shuffle: 'Shuffle' };

export function BrowserToolbar({ title, count, showsAngles, query, sort, angle, compareCount, onQuery, onSort, onAngle, onCompare }: BrowserToolbarProps) {
  const { draft, setDraft, adjustments, cellSize, setCellSize, setAdjustment } = useBrowserToolbar(query, onQuery);

  return (
    <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
      <h1 className="text-base font-semibold">{title}</h1>
      <span className="text-sm text-muted-foreground tabular-nums">{count.toLocaleString()}</span>
      <div className="relative ml-auto w-full min-w-0 sm:w-64">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={draft} onChange={event => setDraft(event.target.value)} placeholder={showsAngles ? 'Search name or ID: kneeling, P-EV-015' : 'Search words or ID: lace coat, C-WI-0004'} className="pl-8" aria-label="Search" />
      </div>
      {showsAngles ? (
        <ToggleGroup value={[angle]} onValueChange={value => value[0] && onAngle(value[0])} variant="outline" size="sm" aria-label="Angle shown" className="max-w-full overflow-x-auto">
          {ANGLES.map(entry => (
            <ToggleGroupItem key={entry.jp} value={entry.jp} title={`${entry.en} (${entry.k})`}>
              {entry.en}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      ) : null}
      <Select value={sort} onValueChange={value => onSort(value as SortOrder)}>
        <SelectTrigger size="sm" aria-label="Sort" className="w-28">
          <SelectValue>{SORT_LABELS[sort]}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(SORT_LABELS) as SortOrder[]).map(order => (
            <SelectItem key={order} value={order}>
              {SORT_LABELS[order]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
          <SlidersHorizontalIcon />
          View
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64">
          <DropdownMenuLabel>Thumbnail size</DropdownMenuLabel>
          <div className="px-2 pb-2">
            <Slider value={[cellSize]} min={110} max={300} step={4} onValueChange={value => setCellSize(Array.isArray(value) ? value[0] : value)} aria-label="Thumbnail size" />
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem checked={adjustments.flip} onCheckedChange={checked => setAdjustment({ flip: checked })}>
            Mirror images
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked={adjustments.invert} onCheckedChange={checked => setAdjustment({ invert: checked })}>
            Invert
          </DropdownMenuCheckboxItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Contrast</DropdownMenuLabel>
          <div className="px-2 pb-2">
            <Slider value={[adjustments.contrast]} min={0.6} max={1.8} step={0.05} onValueChange={value => setAdjustment({ contrast: Array.isArray(value) ? value[0] : value })} aria-label="Contrast" />
          </div>
          <DropdownMenuLabel>Tint</DropdownMenuLabel>
          <div className="px-2 pb-2">
            <Slider value={[adjustments.tint]} min={0} max={360} step={5} onValueChange={value => setAdjustment({ tint: Array.isArray(value) ? value[0] : value })} aria-label="Tint" />
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button variant={compareCount ? 'default' : 'outline'} size="sm" onClick={onCompare}>
        Compare{compareCount ? ` ${compareCount}` : ''}
      </Button>
    </div>
  );
}
