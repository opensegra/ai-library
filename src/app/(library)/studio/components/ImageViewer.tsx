'use client';

import type { GalleryImage } from '@/app/(library)/studio/components/useStudioScreen';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CloudCheckIcon, CloudUploadIcon, CopyIcon, DownloadIcon, Trash2Icon } from 'lucide-react';

interface ImageViewerProps {
    image: GalleryImage | null;
    onOpenChange: (open: boolean) => void;
    onCopy: (prompt: string) => void;
    onDelete: (resultId: string) => void;
    driveAvailable: boolean;
    onSaveToDrive: (image: GalleryImage) => void;
}

export function ImageViewer({ image, onOpenChange, onCopy, onDelete, driveAvailable, onSaveToDrive }: ImageViewerProps) {
    return (
        <Dialog open={!!image} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[96dvh] flex-col gap-3 sm:max-w-4xl">
                {image ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>{image.result.label}</DialogTitle>
                            <DialogDescription>
                                {new Date(image.turn.createdAt).toLocaleString()}
                                {image.turn.message ? ` · ${image.turn.message}` : ''}
                                {image.result.driveError && !image.result.driveFileId ? ` · ${image.result.driveError}` : ''}
                            </DialogDescription>
                        </DialogHeader>
                        <img
                            src={image.result.image?.dataUrl}
                            alt={image.result.label}
                            className="min-h-0 w-full flex-1 rounded-lg bg-muted object-contain"
                        />
                        <div className="flex flex-wrap gap-2">
                            <Button
                                size="sm"
                                nativeButton={false}
                                render={<a href={image.result.image?.dataUrl} download={`${image.result.label}.png`} />}
                            >
                                <DownloadIcon />
                                Download
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => onCopy(image.result.prompt)}>
                                <CopyIcon />
                                Copy prompt
                            </Button>
                            {driveAvailable ? (
                                image.result.driveFileId ? (
                                    <span className="flex items-center gap-1 px-2 text-sm text-muted-foreground">
                                        <CloudCheckIcon className="size-4" />
                                        Saved to Drive
                                    </span>
                                ) : (
                                    <Button variant="outline" size="sm" onClick={() => onSaveToDrive(image)}>
                                        <CloudUploadIcon />
                                        Save to Drive
                                    </Button>
                                )
                            ) : null}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="ml-auto text-destructive"
                                onClick={() => {
                                    onDelete(image.result.id);
                                    onOpenChange(false);
                                }}
                            >
                                <Trash2Icon />
                                Delete
                            </Button>
                        </div>
                    </>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}
