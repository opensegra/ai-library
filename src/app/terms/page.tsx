import { LegalLayout, LegalSection } from '@/components/site/MarketingFrame';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Terms of Use',
    description: 'Terms for using AI Library, its visual references, pose tools and image studio.'
};

export default function TermsPage() {
    return (
        <LegalLayout
            title="Terms of use"
            intro="These terms describe the ground rules for using AI Library. By using the app, you agree to follow them."
        >
            <LegalSection title="What AI Library provides">
                <p>
                    AI Library is a creative reference app for browsing pose and costume examples, fitting and editing a 3D mannequin, and
                    preparing image-generation requests. It is provided as an open-source project.
                </p>
                <p>
                    The reference material and generated results are for creative use. They may be incomplete or inaccurate, and are not
                    professional, medical, legal or commercial advice.
                </p>
            </LegalSection>
            <LegalSection title="Your uploads and content">
                <p>
                    You are responsible for the photos, prompts and other material you use. Only upload content you have the rights and
                    permission to use. Do not use the app to create or share illegal content, sexual content involving minors,
                    non-consensual intimate imagery, or content that infringes another person’s rights.
                </p>
                <p>
                    You keep your rights to material you provide. Your image-generation provider may apply its own terms to your prompts,
                    references and results. Check that provider’s terms before using its service.
                </p>
            </LegalSection>
            <LegalSection title="Image services and costs">
                <p>
                    Image generation is handled by the provider you select, such as Puter, Google, OpenAI, Cloudflare or another configured
                    service. Each provider controls its own availability, output, billing and terms. Any charges from a provider are between
                    you and that provider.
                </p>
                <p>
                    AI Library does not promise that a particular image can be generated, that outputs will be accurate or unique, or that a
                    provider will remain available.
                </p>
            </LegalSection>
            <LegalSection title="Respect the rights attached to the material">
                <p>
                    The application source code is provided under the MIT License. The base mannequin body has its own CC0 notice. Those
                    licenses do not automatically grant rights to every pose drawing, costume image, name or other third-party material in
                    the library, check the relevant attribution and license information before reuse.
                </p>
            </LegalSection>
            <LegalSection title="Availability and changes">
                <p>
                    The app is provided as available. Features may change, be interrupted or be removed. You are responsible for keeping
                    copies of anything you need, locally saved work can be lost if browser data is cleared or a device is replaced.
                </p>
                <p>We may update these terms as the app changes. The date at the end of this page shows when they were last revised.</p>
            </LegalSection>
            <LegalSection title="Contact">
                <p>
                    Questions about these terms can be raised in the{' '}
                    <a className="underline underline-offset-4" href="https://github.com/opensegra/ai-library/issues">
                        AI Library project issue tracker
                    </a>
                    .
                </p>
            </LegalSection>
        </LegalLayout>
    );
}
