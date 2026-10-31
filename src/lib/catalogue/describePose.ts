import { angleName } from '@/lib/catalogue/angles';
import type { Pose } from '@/lib/catalogue/types';

export type Keypoint = [number, number] | null;

const CAMERA: Record<string, string> = {
    Front: 'seen from the front at chest height',
    Above: 'seen from a high angle, the camera looking down',
    Below: 'seen from a low angle, the camera looking up',
    Side: 'seen in strict side profile',
    Diagonal: 'seen in three-quarter view'
};

const DUO_ARRANGEMENT: Record<string, string> = {
    立位: 'Both stand. The man is close beside or behind the woman, holding or supporting her.',
    立位密着: 'Both stand pressed close together in an embrace, the man’s arms around the woman.',
    顔寄せ系: 'Their heads are close together; one lies, kneels or leans down near the other’s face.',
    正常位: 'The woman lies on her back; the man kneels or leans over her, facing her.',
    後背位: 'The woman faces away from the man, bent forward or on all fours; the man is close behind her.',
    騎乗位: 'The man lies or sits back beneath her; the woman sits astride his hips.',
    座位: 'Both sit on the floor facing each other, legs close or entwined.',
    背面座位: 'The man sits; the woman sits on his lap facing away from him, her back toward his chest.',
    対面座位: 'The man sits; the woman sits on his lap facing him.',
    座位密着: 'Both sit pressed close together in an embrace.',
    側位: 'Both lie on their sides close together, the man behind or beside the woman.',
    寝そべり: 'Both lie down close together.',
    密着: 'Their bodies are pressed close together.'
};

const NOSE = 0;
const SHOULDER = { L: 11, R: 12 };
const ELBOW = { L: 13, R: 14 };
const WRIST = { L: 15, R: 16 };
const HIP = { L: 23, R: 24 };
const KNEE = { L: 25, R: 26 };
const ANKLE = { L: 27, R: 28 };

type Point = [number, number];
type Side = 'L' | 'R';

const sub = (a: Point, b: Point): Point => [a[0] - b[0], a[1] - b[1]];
const dot = (a: Point, b: Point) => a[0] * b[0] + a[1] * b[1];
const length = (a: Point) => Math.hypot(a[0], a[1]);
const mid = (a: Point, b: Point): Point => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
const jointAngle = (a: Point, joint: Point, b: Point) => {
    const first = sub(a, joint);
    const second = sub(b, joint);

    return (Math.acos(Math.max(-1, Math.min(1, dot(first, second) / (length(first) * length(second) || 1)))) * 180) / Math.PI;
};

interface BodyFrame {
    origin: Point;
    up: Point;
    across: Point;
    torso: number;
    fullBody: boolean;
}

function handPlace(height: number): string {
    if (height > 1.75) return 'stretched up past her head';
    if (height > 1.2) return 'up by her head';
    if (height > 0.85) return 'at shoulder height';
    if (height > 0.5) return 'at chest height';
    if (height > 0.15) return 'at her waist';
    if (height > -0.15) return 'at her hip';

    return 'down by her thigh';
}

function armNote(side: Side, at: (index: number) => Point | null, frame: BodyFrame): string | null {
    const shoulder = at(SHOULDER[side]);
    const elbow = at(ELBOW[side]);
    const wrist = at(WRIST[side]);

    if (!shoulder || !wrist) return null;

    const relative = sub(wrist, frame.origin);
    const height = dot(relative, frame.up) / frame.torso ** 2;
    const sideways = (dot(relative, frame.across) / frame.torso ** 2) * (side === 'L' ? 1 : -1);
    const nose = at(NOSE);
    const hip = frame.fullBody ? at(HIP[side]) : null;
    const atHead = !!nose && height > 0.85 && height < 1.6 && length(sub(wrist, nose)) < 0.45 * frame.torso;
    const onHip = !atHead && !!hip && Math.abs(height) < 0.5 && length(sub(wrist, hip)) < 0.4 * frame.torso;
    const details = [atHead ? 'up at her head or face' : onHip ? 'resting on her hip' : handPlace(height)];

    if (sideways < -0.15) details.push('reaching across her body');
    else if (sideways > 0.9) details.push('held out to the side');
    if (elbow) {
        const angle = jointAngle(shoulder, elbow, wrist);

        if (angle > 160) details.push('arm straight');
        else if (angle < 95) details.push('elbow bent');
    }

    return `Her ${side === 'L' ? 'left' : 'right'} hand is ${details.join(', ')}.`;
}

function legNote(side: Side, at: (index: number) => Point | null, frame: BodyFrame): string | null {
    const hip = at(HIP[side]);
    const knee = at(KNEE[side]);
    const ankle = at(ANKLE[side]);

    if (!hip || !knee || !ankle) return null;

    const angle = jointAngle(hip, knee, ankle);
    const kneeHeight = dot(sub(knee, frame.origin), frame.up) / frame.torso ** 2;
    const shape = angle > 165 ? 'straight' : angle < 120 ? 'bent at the knee' : 'slightly bent';

    return `Her ${side === 'L' ? 'left' : 'right'} leg is ${shape}${kneeHeight > -0.35 ? ', knee raised' : ''}.`;
}

function stanceNote(at: (index: number) => Point | null, frame: BodyFrame): string | null {
    const hipL = at(HIP.L);
    const hipR = at(HIP.R);
    const ankleL = at(ANKLE.L);
    const ankleR = at(ANKLE.R);

    if (!hipL || !hipR || !ankleL || !ankleR) return null;
    if (dot(sub(ankleL, ankleR), frame.across) < -0.08 * frame.torso) return 'Her legs are crossed.';

    const spread = length(sub(ankleL, ankleR)) / (length(sub(hipL, hipR)) || frame.torso * 0.4);

    return spread > 3 ? 'Her feet are wide apart.' : spread > 1.6 ? 'Her feet are apart.' : 'Her feet are close together.';
}

export function postureNotes(points: Keypoint[], fullBody: boolean): string[] {
    const at = (index: number): Point | null => {
        const point = points[index];

        return point ? [point[0] * 900, point[1] * 1200] : null;
    };
    const shoulderL = at(SHOULDER.L);
    const shoulderR = at(SHOULDER.R);

    if (!shoulderL || !shoulderR) return [];

    const shoulders = mid(shoulderL, shoulderR);
    const hipL = fullBody ? at(HIP.L) : null;
    const hipR = fullBody ? at(HIP.R) : null;
    const width = length(sub(shoulderL, shoulderR)) || 1;
    const hips = hipL && hipR ? mid(hipL, hipR) : ([shoulders[0], shoulders[1] + width * 1.4] as Point);
    const up = sub(shoulders, hips);
    const torso = length(up) || 1;
    const across = sub(shoulderL, shoulderR).map((component) => (component / width) * torso) as Point;
    const frame = { origin: hips, up, across, torso, fullBody };
    const notes = [armNote('L', at, frame), armNote('R', at, frame)];

    if (fullBody && hipL && hipR) notes.push(legNote('L', at, frame), legNote('R', at, frame), stanceNote(at, frame));

    return notes.filter((note): note is string => !!note);
}

export function hasLegs(pose: Pose): boolean {
    return pose.line !== '上半身1人';
}

export function isDuo(pose: Pose): boolean {
    return pose.line === '2人絡み';
}

export function duoArrangement(pose: Pose): string | null {
    return isDuo(pose) ? (DUO_ARRANGEMENT[pose.jcls] ?? 'The two are posed close together.') : null;
}

export function posePrompt(pose: Pose, angle: string): string {
    const view = angleName(angle);
    const people = isDuo(pose) ? 'One adult woman and one adult man' : 'One adult woman';
    const framing = hasLegs(pose) ? 'full body' : 'upper body, from the waist up';
    const arrangement = duoArrangement(pose);
    const lines = [
        `${people}, ${framing}, ${CAMERA[view] ?? view.toLowerCase()}.`,
        `Pose: ${pose.name} (${pose.lineName.toLowerCase()} pose, ${pose.cls.toLowerCase()}).`
    ];

    if (arrangement) lines.push(`Arrangement: ${arrangement}`, 'The woman is the main subject.');
    if (pose.posture?.length) lines.push(pose.posture.join(' '), 'Left and right are her own.');

    return lines.join('\n');
}
