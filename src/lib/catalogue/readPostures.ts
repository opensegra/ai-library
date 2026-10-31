import { hasLegs, isDuo, type Keypoint, postureNotes } from '@/lib/catalogue/describePose';
import type { Pose } from '@/lib/catalogue/types';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const FIT_FILES = path.join(process.cwd(), 'data', 'fits');
const FRONT = '正面';

interface DetectedFigure {
    image: number[][];
    world: number[][];
}

interface DetectedPerson {
    conf: number;
    kp: number[][];
}

type Detections = Record<string, Record<string, { score?: number; figures?: DetectedFigure[]; people?: DetectedPerson[] }>>;

function point(source: number[] | undefined, floor: number, confidence: (entry: number[]) => number): Keypoint {
    return source && confidence(source) >= floor ? [source[0], source[1]] : null;
}

function torsoOf(points: Keypoint[]): {
    shoulders: [number, number];
    hips: [number, number];
    torso: number;
} | null {
    const [shoulderL, shoulderR, hipL, hipR] = [points[11], points[12], points[23], points[24]];

    if (!shoulderL || !shoulderR || !hipL || !hipR) return null;

    const shoulders: [number, number] = [(shoulderL[0] + shoulderR[0]) / 2, ((shoulderL[1] + shoulderR[1]) / 2) * 1.333];
    const hips: [number, number] = [(hipL[0] + hipR[0]) / 2, ((hipL[1] + hipR[1]) / 2) * 1.333];

    return {
        shoulders,
        hips,
        torso: Math.hypot(shoulders[0] - hips[0], shoulders[1] - hips[1])
    };
}

const apart = (a: Keypoint, b: Keypoint) => (a && b ? Math.hypot(a[0] - b[0], (a[1] - b[1]) * 1.333) : Infinity);

function frontKeypoints(code: string, landmarks: Detections, keypoints: Detections): Keypoint[] | null {
    const detected = landmarks[code]?.[FRONT];
    const figure = detected?.figures?.length === 1 ? detected.figures[0] : null;
    const people = keypoints[code]?.[FRONT]?.people;
    const person = people?.length === 1 && people[0].conf >= 0.5 ? people[0] : null;
    const fromLandmarks = figure
        ? Array.from({ length: 33 }, (_, index) => ((figure.world[index]?.[3] ?? 0) >= 0.5 ? point(figure.image[index], 0, () => 1) : null))
        : null;
    const fromKeypoints = person ? Array.from({ length: 33 }, (_, index) => point(person.kp[index], 0.15, (entry) => entry[2] ?? 0)) : null;

    if (!fromKeypoints) return fromLandmarks && (detected?.score ?? 0) >= 0.7 ? fromLandmarks : null;

    const anchor = torsoOf(fromKeypoints);
    const other = fromLandmarks ? torsoOf(fromLandmarks) : null;
    const agree =
        !!anchor &&
        !!other &&
        Math.hypot(anchor.shoulders[0] - other.shoulders[0], anchor.shoulders[1] - other.shoulders[1]) < 0.25 * anchor.torso &&
        Math.hypot(anchor.hips[0] - other.hips[0], anchor.hips[1] - other.hips[1]) < 0.25 * anchor.torso;

    if (!agree || !anchor || !fromLandmarks) return fromKeypoints;

    return fromKeypoints.map((keypoint, index) => {
        const landmark = fromLandmarks[index];
        const confident = (person?.kp[index]?.[2] ?? 0) >= 0.3;

        if (landmark && (!keypoint || !confident || apart(landmark, keypoint) < 0.5 * anchor.torso)) return landmark;

        return keypoint;
    });
}

export async function readPostures(poses: Pose[]): Promise<Map<string, string[]>> {
    const [landmarks, keypoints] = await Promise.all(
        ['autofit.json', 'dwfit.json'].map(async (file) => JSON.parse(await readFile(path.join(FIT_FILES, file), 'utf8')) as Detections)
    );
    const postures = new Map<string, string[]>();

    for (const pose of poses) {
        if (isDuo(pose) || !hasLegs(pose)) continue;

        const points = frontKeypoints(pose.code, landmarks, keypoints);
        const notes = points ? postureNotes(points, true) : [];

        if (notes.length) postures.set(pose.code, notes);
    }

    return postures;
}
