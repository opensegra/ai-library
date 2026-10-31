'use client';

import { useBrowserQuery } from '@/hooks/client/useBrowserQuery';
import { useLibrary } from '@/hooks/client/useLibrary';
import { ANGLES } from '@/lib/catalogue/angles';
import { isPose, type LibraryItem, type Pose } from '@/lib/catalogue/types';
import type { PoseFit } from '@/lib/fitting/autofit';
import type { FigurePlacement } from '@/lib/library/libraryState';
import { type MyPose, myPosesSnapshot, nextMyPoseCode, saveMyPose } from '@/lib/library/myPoses';
import type { RigView } from '@/lib/rig/viewer';
import { sendPoseRender } from '@/lib/studio/studioStore';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';

async function fetchFit(code: string): Promise<PoseFit> {
    const response = await fetch(`/api/fits/${encodeURIComponent(code)}`);

    if (!response.ok) throw new Error(`fit request failed with ${response.status}`);

    return (await response.json()) as PoseFit;
}

async function createPose(
    basedOn: MyPose['basedOn'],
    framing: MyPose['framing'],
    name: string,
    views: RigView[],
    figures: FigurePlacement[]
): Promise<MyPose> {
    const code = nextMyPoseCode(basedOn.code, myPosesSnapshot());
    const created: MyPose = {
        id: crypto.randomUUID(),
        code,
        name,
        createdAt: new Date().toISOString(),
        framing,
        basedOn,
        figures: structuredClone(figures),
        views
    };

    await saveMyPose(created);

    return created;
}

export function useRigViewer(list: LibraryItem[]) {
    const { state, update, touchRecent } = useLibrary();
    const { write } = useBrowserQuery();
    const router = useRouter();
    const reopen = useRef<(pose: Pose, angleJp: string) => Promise<void>>(async () => {});

    const announceCreated = useCallback(
        (saving: Promise<MyPose>) =>
            saving
                .then((created) =>
                    toast.success(`Saved as ${created.code} in My poses.`, {
                        action: {
                            label: 'Open My poses',
                            onClick: () => {
                                void import('@/lib/rig/viewer').then((viewer) => viewer.RigViewer.close());
                                router.push(`/my-poses?item=${created.id}`);
                            }
                        }
                    })
                )
                .catch((error: Error) => toast.error(`The pose could not be saved: ${error.message}`)),
        [router]
    );

    const openSaved = useCallback(
        async (saved: MyPose, angleJp: string): Promise<void> => {
            const { RigViewer } = await import('@/lib/rig/viewer');
            const images = saved.views.map((view) => ({
                label: view.label,
                jp: view.jp,
                url: view.full,
                yaw: view.yaw,
                pitch: view.pitch
            }));

            await RigViewer.open({
                code: saved.code,
                title: saved.name,
                figures: structuredClone(saved.figures),
                source: 'edited',
                images,
                imageIndex: Math.max(
                    0,
                    images.findIndex((image) => image.jp === angleJp)
                ),
                position: '',
                framing: saved.framing,
                proportions: null,
                onStep: null,
                onCreate: (views, figures) => void announceCreated(createPose(saved.basedOn, saved.framing, saved.name, views, figures)),
                onStudio: (image, depth) => {
                    sendPoseRender(`m:${saved.id}`, angleJp, image, depth);
                    toast.success(`${saved.code} sent to the studio as a 3D render with its depth map.`, {
                        action: {
                            label: 'Open studio',
                            onClick: () => {
                                RigViewer.close();
                                router.push('/studio');
                            }
                        }
                    });
                }
            });
        },
        [announceCreated, router]
    );

    const openRig = useCallback(
        async (pose: Pose, angleJp: string): Promise<void> => {
            const poses = list.filter(isPose);
            const at = poses.findIndex((entry) => entry.uid === pose.uid);
            let viewer: typeof import('@/lib/rig/viewer');
            let fit: PoseFit;

            try {
                [viewer, fit] = await Promise.all([import('@/lib/rig/viewer'), fetchFit(pose.code)]);
            } catch (error) {
                toast.error(`The 3D viewer could not load: ${(error as Error).message}`);

                return;
            }

            const { RigViewer } = viewer;

            const saved = state.rigs[pose.uid];
            const images = ANGLES.filter((angle) => pose.images[angle.jp]).map((angle) => ({
                label: angle.en,
                jp: angle.jp,
                url: pose.images[angle.jp].full,
                yaw: fit.cams[angle.jp]?.yaw ?? angle.yaw,
                pitch: fit.cams[angle.jp]?.pitch ?? angle.pitch
            }));

            await RigViewer.open({
                code: pose.code,
                title: pose.name,
                figures: structuredClone(saved?.figures ?? fit.figures),
                source: saved ? 'edited' : fit.source === 'auto' && fit.approx ? 'approx' : fit.source,
                images,
                imageIndex: Math.max(
                    0,
                    images.findIndex((image) => image.jp === angleJp)
                ),
                position: at >= 0 ? `${at + 1} of ${poses.length}` : '',
                framing: pose.line === '上半身1人' ? 'upper' : 'full',
                proportions: fit.props,
                onStep:
                    at < 0 || poses.length < 2
                        ? null
                        : (direction, imageJp) => {
                              const next = poses[(at + direction + poses.length) % poses.length];

                              write({ item: next.uid });
                              touchRecent(next.uid);
                              void reopen.current(next, imageJp);
                          },
                onSave: (figures) => {
                    update((current) => ({
                        ...current,
                        rigs: {
                            ...current.rigs,
                            [pose.uid]: {
                                figures: structuredClone(figures),
                                savedAt: new Date().toISOString()
                            }
                        }
                    }));
                    toast.success(`${pose.code} rig saved.`);
                },
                onRefit: () => structuredClone(fit.figures),
                onCreate: (views, figures) =>
                    void announceCreated(
                        createPose(
                            {
                                uid: pose.uid,
                                code: pose.code,
                                name: pose.name,
                                line: pose.line,
                                cls: pose.cls
                            },
                            pose.line === '上半身1人' ? 'upper' : 'full',
                            pose.name,
                            views,
                            figures
                        )
                    ),
                onStudio: (image, depth) => {
                    sendPoseRender(pose.uid, angleJp, image, depth);
                    toast.success(`${pose.code} sent to the studio as a 3D render with its depth map.`, {
                        action: {
                            label: 'Open studio',
                            onClick: () => {
                                RigViewer.close();
                                router.push('/studio');
                            }
                        }
                    });
                }
            });
        },
        [list, state.rigs, update, write, touchRecent, router, announceCreated]
    );

    useEffect(() => {
        reopen.current = openRig;
    }, [openRig]);

    return { openRig, openSaved };
}
