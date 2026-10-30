import { readCatalogue } from '@/lib/catalogue/readCatalogue';
import { filterPoses, searchAndSort } from '@/lib/catalogue/filterItems';
import { angleName } from '@/lib/catalogue/angles';
import { posePrompt } from '@/lib/catalogue/describePose';
import { isAdultPose } from '@/lib/studio/adultContent';

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const catalogue = await readCatalogue();
  const line = catalogue.lines.find(group => group.name.toLowerCase() === params.get('group')?.toLowerCase())?.key ?? null;
  const poses = searchAndSort(filterPoses(catalogue.poses, { line, cls: null }), params.get('q') ?? '', 'number', 1).filter(pose => params.get('include_adult') === 'true' || !isAdultPose(pose));
  const limit = Math.min(100, Math.max(1, Number(params.get('limit') ?? 20)));

  return Response.json({
    total: poses.length,
    poses: poses.slice(0, limit).map(pose => ({ code: pose.code, name: pose.name, group: pose.lineName, class: pose.cls, prompt: posePrompt(pose, '正面'), posture: pose.posture ?? [], images: Object.fromEntries(Object.entries(pose.images).map(([angle, image]) => [angleName(angle).toLowerCase(), image])), rig: `/api/fits/${pose.code}` }))
  });
}
