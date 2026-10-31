'use client';

import { useBrowserQuery } from '@/hooks/client/useBrowserQuery';
import { useMyPoses } from '@/hooks/client/useMyPoses';
import { useRigViewer } from '@/hooks/client/useRigViewer';
import { useStudio } from '@/hooks/client/useStudio';
import { deleteMyPose, type MyPose } from '@/lib/library/myPoses';
import { useState } from 'react';
import { toast } from 'sonner';

export function useMyPosesScreen() {
    const { poses } = useMyPoses();
    const { read, write } = useBrowserQuery();
    const { openSaved } = useRigViewer([]);
    const { selection, addPose } = useStudio();
    const [picked, setPicked] = useState<{ id: string; jp: string } | null>(null);
    const [showDepth, setShowDepth] = useState(false);
    const [confirming, setConfirming] = useState<string | null>(null);

    const selected = poses.find((pose) => pose.id === read('item')) ?? null;
    const view = selected
        ? (selected.views.find((entry) => picked?.id === selected.id && entry.jp === picked.jp) ?? selected.views[0])
        : null;
    const inStudio = !!selected && selection.poses.some((pose) => pose.uid === `m:${selected.id}`);

    const remove = async (pose: MyPose) => {
        if (confirming !== pose.id) {
            setConfirming(pose.id);
            return;
        }

        await deleteMyPose(pose.id);

        setConfirming(null);
        write({ item: null });

        toast.success(`${pose.code} deleted.`);
    };

    const sendToStudio = (pose: MyPose) => {
        addPose(`m:${pose.id}`, view?.jp ?? pose.views[0].jp);
        toast.success(`${pose.code} added to the studio.`);
    };

    return {
        poses,
        selected,
        view,
        showDepth,
        setShowDepth,
        confirming,
        inStudio,
        select: (pose: MyPose) => {
            write({ item: pose.id });
            setConfirming(null);
        },
        close: () => write({ item: null }),
        pickAngle: (jp: string) => selected && setPicked({ id: selected.id, jp }),
        openInRig: (pose: MyPose) => void openSaved(pose, view?.jp ?? pose.views[0].jp),
        sendToStudio,
        remove: (pose: MyPose) => void remove(pose)
    };
}
