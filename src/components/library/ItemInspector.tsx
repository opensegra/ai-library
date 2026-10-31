'use client';

import { CostumeInspector } from '@/components/library/CostumeInspector';
import { PoseInspector } from '@/components/library/PoseInspector';
import { useItemInspector } from '@/components/library/useItemInspector';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { isPose, itemLabel, type LibraryItem } from '@/lib/catalogue/types';
import { XIcon } from 'lucide-react';

interface ItemInspectorProps {
    item: LibraryItem | null;
    list: LibraryItem[];
    angle: string;
    onAngle: (angle: string) => void;
    onClose: () => void;
    onZoom: () => void;
    onSelect: (item: LibraryItem) => void;
}

interface InspectorBodyProps extends ItemInspectorProps {
    item: LibraryItem;
}

function InspectorBody({ item, list, angle, onAngle, onZoom, onSelect }: InspectorBodyProps) {
    if (isPose(item)) return <PoseInspector pose={item} list={list} angle={angle} onAngle={onAngle} onZoom={onZoom} />;

    return <CostumeInspector costume={item} onZoom={onZoom} onSelect={onSelect} />;
}

export function ItemInspector(props: ItemInspectorProps) {
    const { item, onClose } = props;
    const { narrow } = useItemInspector();

    if (narrow)
        return (
            <Sheet open={!!item} onOpenChange={(open) => !open && onClose()}>
                <SheetContent side="bottom" className="max-h-[78dvh] overflow-y-auto p-4">
                    <SheetTitle className="sr-only">{item ? itemLabel(item) : 'Details'}</SheetTitle>
                    {item ? <InspectorBody {...props} item={item} /> : null}
                </SheetContent>
            </Sheet>
        );

    return (
        <aside aria-label="Details" className="hidden w-[380px] shrink-0 flex-col overflow-y-auto border-l md:flex">
            {item ? (
                <div className="relative p-4">
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        className="absolute top-3 right-3 z-10"
                        aria-label="Close details"
                        onClick={onClose}
                    >
                        <XIcon />
                    </Button>
                    <InspectorBody {...props} item={item} />
                </div>
            ) : (
                <div className="m-auto max-w-60 p-6 text-center text-sm text-muted-foreground">
                    <p className="mb-1 font-medium text-foreground">Nothing selected</p>
                    Pick a pose or costume to see it large, every angle and its 3D rig. Double-click to view it full screen.
                </div>
            )}
        </aside>
    );
}
