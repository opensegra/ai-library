import { LegalLayout, LegalSection } from '@/components/site/MarketingFrame';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Privacy',
    description: 'How AI Library handles browser-saved work, uploaded references, image providers and Google Drive.'
};

export default function PrivacyPage() {
    return (
        <LegalLayout
            title="Privacy"
            intro="AI Library is designed to keep your library and studio work in your browser. Some features send selected material to third-party services when you ask them to do something."
        >
            <LegalSection title="What stays in your browser">
                <p>
                    Favourites, boards, recently viewed items, saved rig edits, studio settings and API keys are stored in your browser.
                    Saved poses and studio conversations, including attached photos and generated images, are kept in browser storage on
                    your device.
                </p>
                <p>
                    Pose from your image analyzes the selected image in your browser. That feature does not upload the image to AI Library’s
                    server.
                </p>
            </LegalSection>
            <LegalSection title="When you use image generation">
                <p>
                    When you submit a studio request, the prompt and the selected model photos, environment photo, pose references and
                    costume references are sent to the image service you chose. Puter requests are made from your browser. Other configured
                    services are called through the app’s generation endpoint. If you use your own key, it is sent with that request and
                    forwarded to the selected provider to make the image.
                </p>
                <p>
                    The selected provider may process or retain the information under its own privacy policy and terms. Review those
                    policies before sending personal or sensitive material. Do not include information you do not want that provider to
                    receive.
                </p>
            </LegalSection>
            <LegalSection title="API keys and settings">
                <p>
                    Service settings and keys you enter are saved in browser storage so the studio can use them again. A key is sent only
                    when you submit a request for that service. You can remove saved keys in Image settings or clear this site’s browser
                    storage.
                </p>
            </LegalSection>
            <LegalSection title="Google Drive">
                <p>
                    If Drive saving is enabled and you connect your Google account, the app uses Google’s{' '}
                    <code className="rounded bg-[#eae4db] px-1.5 py-0.5 text-sm">drive.file</code> permission to create and manage files it
                    creates for AI Library. Images are uploaded to your Drive only when you choose to save them or enable automatic saving.
                    Google handles account access and uploaded files under its own privacy terms.
                </p>
            </LegalSection>
            <LegalSection title="Storage and deletion">
                <p>
                    Browser-saved information remains on your device until you remove it in the app or clear the site’s data in your
                    browser. Clearing site data also removes local preferences and saved work. Files already saved to Google Drive must be
                    removed from Drive.
                </p>
            </LegalSection>
            <LegalSection title="Hosting and external services">
                <p>
                    The app’s hosting provider may process ordinary technical request information to deliver and protect the site. The app
                    also loads external services when you choose related features, including image providers, Google sign-in and Drive, and
                    Puter. Their handling of information is governed by their own policies.
                </p>
            </LegalSection>
            <LegalSection title="Contact">
                <p>
                    Questions or privacy requests can be raised in the{' '}
                    <a className="underline underline-offset-4" href="https://github.com/opensegra/ai-library/issues">
                        AI Library project issue tracker
                    </a>
                    . Avoid posting private or sensitive information in a public issue.
                </p>
            </LegalSection>
        </LegalLayout>
    );
}
