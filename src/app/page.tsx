import { MarketingFrame } from '@/components/site/MarketingFrame';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: { absolute: 'AI Library — Visual references for creative work' },
    description: 'Explore 288 pose references, 1,407 costume references, a rigged 3D mannequin, and an image-making studio.'
};

const demos = [
    {
        id: 'photo-pose',
        title: 'Turn a photo into a pose',
        description: 'Read a pose from a photo in your browser, then orbit and export the fitted mannequin.',
        src: '/demos/pose-from-image.mp4',
        captions: '/demos/pose-from-image.vtt',
        poster: '/demos/posters/rig-viewer.jpg'
    },
    {
        id: 'mannequin',
        title: 'Explore the mannequin views',
        description: 'Compare the source image with a drawing, clay model, depth map and rig controls.',
        src: '/demos/pose-from-image-mannequin.mp4',
        captions: '/demos/pose-from-image-mannequin.vtt',
        poster: '/demos/posters/rig-viewer.jpg'
    },
    {
        id: 'studio',
        title: 'Build an image in the studio',
        description: 'Bring together a model, a pose, a costume and a scene to guide image generation.',
        src: '/demos/studio.mp4',
        captions: '/demos/studio.vtt',
        poster: '/demos/posters/studio.jpg'
    }
];

export default function HomePage() {
    return (
        <MarketingFrame>
            <main>
                <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
                    <div>
                        <p className="mb-5 text-sm font-semibold tracking-[0.16em] text-[#a45b42] uppercase">A visual reference studio</p>
                        <h1 className="max-w-3xl text-5xl leading-[1.02] font-semibold tracking-[-0.055em] sm:text-7xl">
                            Find the pose.<br />Build the look.
                        </h1>
                        <p className="mt-6 max-w-xl text-lg leading-8 text-[#625d56]">
                            A practical library of poses and costumes, paired with a rigged 3D mannequin and a studio for shaping new images.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-3">
                            <Link href="/poses" className="rounded-full bg-[#171717] px-6 py-3 text-sm font-semibold text-white hover:bg-[#35312e]">
                                Browse 288 poses
                            </Link>
                            <Link href="/costumes" className="rounded-full border border-[#cfc6bb] px-6 py-3 text-sm font-semibold hover:bg-white/70">
                                Explore 1,407 costumes
                            </Link>
                        </div>
                        <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-[#625d56]">
                            <span><strong className="text-[#171717]">5 angles</strong> for every pose</span>
                            <span><strong className="text-[#171717]">17 bones</strong> in the exportable rig</span>
                            <span><strong className="text-[#171717]">In-browser</strong> pose reading</span>
                        </div>
                    </div>
                    <div className="relative rounded-[2rem] bg-[#211f1d] p-3 shadow-[0_28px_80px_rgba(42,35,27,0.16)] sm:p-4">
                        <video
                            className="aspect-[1.52] w-full rounded-[1.5rem] bg-black object-cover"
                            autoPlay
                            controls
                            loop
                            muted
                            playsInline
                            preload="none"
                            poster="/demos/posters/studio.jpg"
                            aria-label="AI Library studio preview"
                        >
                            <source src="/demos/studio.mp4" type="video/mp4" />
                            <track kind="captions" src="/demos/studio.vtt" srcLang="en" label="English" default />
                        </video>
                        <p className="px-3 pt-3 pb-1 text-sm text-[#d3cdc5]">From references to a new image, with each ingredient in view.</p>
                    </div>
                </section>

                <section className="border-y border-[#e1dbd2] bg-[#efebe4]">
                    <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:grid-cols-3 sm:px-8">
                        <article>
                            <p className="text-3xl font-semibold tracking-tight">288</p>
                            <h2 className="mt-1 font-medium">Pose references</h2>
                            <p className="mt-2 text-sm leading-6 text-[#625d56]">Five drawn angles, a written description and an adjustable 3D rig.</p>
                        </article>
                        <article>
                            <p className="text-3xl font-semibold tracking-tight">1,407</p>
                            <h2 className="mt-1 font-medium">Costume references</h2>
                            <p className="mt-2 text-sm leading-6 text-[#625d56]">Search by category, colour, garment, fabric and accessory.</p>
                        </article>
                        <article>
                            <p className="text-3xl font-semibold tracking-tight">One studio</p>
                            <h2 className="mt-1 font-medium">References into images</h2>
                            <p className="mt-2 text-sm leading-6 text-[#625d56]">Combine model photos, poses, outfits and a scene with your chosen image service.</p>
                        </article>
                    </div>
                </section>

                <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
                    <div className="mb-9 flex flex-wrap items-end justify-between gap-5">
                        <div>
                            <p className="text-sm font-semibold tracking-[0.16em] text-[#a45b42] uppercase">See how it works</p>
                            <h2 id="demos" className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Three ways to get started</h2>
                        </div>
                        <Link href="/studio" className="text-sm font-semibold underline decoration-[#c5a391] underline-offset-4 hover:text-[#a45b42]">
                            Open the studio →
                        </Link>
                    </div>
                    <div className="grid gap-6 lg:grid-cols-3">
                        {demos.map((demo) => (
                            <article key={demo.id} className="overflow-hidden rounded-2xl border border-[#e1dbd2] bg-white/65">
                                <video
                                    className="aspect-video w-full bg-[#191817] object-cover"
                                    autoPlay
                                    controls
                                    loop
                                    muted
                                    playsInline
                                    preload="none"
                                    poster={demo.poster}
                                    aria-label={demo.title}
                                >
                                    <source src={demo.src} type="video/mp4" />
                                    <track
                                        kind="captions"
                                        src={demo.captions}
                                        srcLang="en"
                                        label="English"
                                        default
                                    />
                                </video>
                                <div className="p-5">
                                    <h3 className="font-semibold">{demo.title}</h3>
                                    <p className="mt-2 text-sm leading-6 text-[#625d56]">{demo.description}</p>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="bg-[#252320] text-[#f7f4ee]">
                    <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-5 py-14 sm:px-8 md:flex-row md:items-center">
                        <div>
                            <p className="text-sm font-semibold tracking-[0.16em] text-[#f2a17f] uppercase">Start with a reference</p>
                            <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">A pose, an outfit, and room to make it yours.</h2>
                        </div>
                        <Link href="/poses" className="shrink-0 rounded-full bg-[#f28a62] px-6 py-3 text-sm font-semibold text-[#171717] hover:bg-[#ffa07a]">
                            Explore the library
                        </Link>
                    </div>
                </section>
            </main>
        </MarketingFrame>
    );
}
