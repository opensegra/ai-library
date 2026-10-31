'use client';

import { useCostumeFacets } from '@/app/(library)/costumes/components/useCostumeFacets';
import { Button } from '@/components/ui/button';

interface CostumeFacetsProps {
    counts: Record<string, number>;
    active: string[];
    onToggle: (word: string) => void;
}

export function CostumeFacets({ counts, active, onToggle }: CostumeFacetsProps) {
    const { groups, group, setGroup, words } = useCostumeFacets(counts, active);

    return (
        <div className="flex flex-col gap-2 border-b px-4 py-2">
            <div className="flex flex-wrap gap-1">
                {groups.map((name) => (
                    <Button key={name} variant={name === group ? 'secondary' : 'ghost'} size="xs" onClick={() => setGroup(name)}>
                        {name}
                    </Button>
                ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
                {active.map((word) => (
                    <button
                        key={word}
                        type="button"
                        onClick={() => onToggle(word)}
                        className="rounded-full border border-primary bg-primary px-2.5 py-0.5 text-xs text-primary-foreground"
                    >
                        {word} ×
                    </button>
                ))}
                {words.map((word) => (
                    <button
                        key={word}
                        type="button"
                        onClick={() => onToggle(word)}
                        className="rounded-full border px-2.5 py-0.5 text-xs hover:bg-accent"
                    >
                        {word} <span className="text-muted-foreground">{counts[word]}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
