'use client';

import { ChatList } from '@/app/(library)/studio/components/ChatList';
import { ChatTurn } from '@/app/(library)/studio/components/ChatTurn';
import { Composer } from '@/app/(library)/studio/components/Composer';
import { DriveAskDialog } from '@/app/(library)/studio/components/DriveAskDialog';
import { GalleryPanel } from '@/app/(library)/studio/components/GalleryPanel';
import { ImageSettingsDialog } from '@/app/(library)/studio/components/ImageSettingsDialog';
import { ImageViewer } from '@/app/(library)/studio/components/ImageViewer';
import { ModelPanel } from '@/app/(library)/studio/components/ModelPanel';
import { NegativePromptDialog } from '@/app/(library)/studio/components/NegativePromptDialog';
import { PickerDialog } from '@/app/(library)/studio/components/PickerDialog';
import { useChatThread } from '@/app/(library)/studio/components/useChatThread';
import { useModelPanel } from '@/app/(library)/studio/components/useModelPanel';
import { useScenePhoto } from '@/app/(library)/studio/components/useScenePhoto';
import { useStudioScreen } from '@/app/(library)/studio/components/useStudioScreen';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ANGLES } from '@/lib/catalogue/angles';
import { serviceName } from '@/lib/studio/servicePresets';
import {
    ImagePlusIcon,
    ImagesIcon,
    MessagesSquareIcon,
    MountainIcon,
    PersonStandingIcon,
    SettingsIcon,
    ShirtIcon,
    SquarePenIcon
} from 'lucide-react';

export function StudioScreen() {
    const studio = useStudioScreen();
    const end = useChatThread(studio.turns.length);
    const { selection, turns } = studio;

    const { input, addPhotos } = useModelPanel(selection.modelPhotos, (modelPhotos) => studio.patch({ modelPhotos }));
    const { input: sceneInput, choose: chooseScene } = useScenePhoto((scenePhoto) => studio.patch({ scenePhoto }));

    const serviceLabel =
        studio.services.length === 1
            ? serviceName(studio.services[0])
            : studio.services.length
              ? `${studio.services.length} services`
              : 'Choose a service';

    const footnote = studio.services.length
        ? `${studio.imageCount} ${studio.imageCount === 1 ? 'image' : 'images'} per send with ${studio.services.map((service) => (service.preset === 'custom' ? serviceName(service) : `${serviceName(service)} (${service.model})`)).join(', ')}.`
        : 'No image service set up in this browser. Sending uses the server key if one is set; Copy prompt works with any image tool.';

    const starters = [
        { kind: 'photos', label: 'Add model photos', detail: 'Up to three of the person to draw', icon: ImagePlusIcon },
        { kind: 'scene', label: 'Add an environment', detail: 'A photo for the place, light and camera', icon: MountainIcon },
        { kind: 'poses', label: 'Choose poses', detail: 'Up to six, each from five angles', icon: PersonStandingIcon },
        { kind: 'costumes', label: 'Pick a costume', detail: 'Optional; otherwise their own clothes', icon: ShirtIcon }
    ] as const;

    const start = (kind: (typeof starters)[number]['kind']) =>
        kind === 'photos' ? input.current?.click() : kind === 'scene' ? sceneInput.current?.click() : studio.setPicker(kind);

    const composer = (
        <Composer
            selection={selection}
            poses={studio.poses}
            costume={studio.costume}
            serviceLabel={serviceLabel}
            imageCount={studio.imageCount}
            running={studio.running}
            onChange={studio.patch}
            onAddPhotos={() => start('photos')}
            onAddScene={() => start('scene')}
            onOpenModel={() => studio.setModelOpen(true)}
            onPickPoses={() => studio.setPicker('poses')}
            onPickCostume={() => studio.setPicker('costumes')}
            onRemovePose={studio.removePose}
            onPoseAngle={studio.setPoseAngle}
            onRemoveCostume={() => studio.setCostume(null)}
            onOpenSettings={() => studio.setSettingsOpen(true)}
            onEditNegative={() => studio.setNegativeOpen(true)}
            onCopyPrompt={studio.copyDraft}
            onSend={() => void studio.send()}
            onStop={studio.stop}
        />
    );

    const chatList = (
        <ChatList
            chats={studio.chats}
            currentId={studio.chatId}
            onOpen={studio.openChat}
            onNew={studio.newChat}
            onDelete={studio.removeChat}
        />
    );
    const currentChat = studio.chats.find((chat) => chat.id === studio.chatId);

    return (
        <div className="flex min-h-0 flex-1">
            <aside className="hidden w-64 shrink-0 flex-col gap-2 border-r p-3 xl:flex">
                <h2 className="px-1 text-xs font-medium text-muted-foreground">Chats</h2>
                {chatList}
            </aside>
            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                <div className="flex items-center gap-2 px-4 py-3">
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        className="xl:hidden"
                        aria-label="Chats"
                        onClick={() => studio.setChatsOpen(true)}
                    >
                        <MessagesSquareIcon />
                    </Button>
                    <h1 className="text-base font-semibold">Studio</h1>
                    {currentChat ? (
                        <span className="hidden min-w-0 truncate text-sm text-muted-foreground sm:inline">{currentChat.title}</span>
                    ) : null}
                    <div className="ml-auto flex shrink-0 gap-1">
                        <Button variant="ghost" size="sm" onClick={() => studio.setGalleryOpen(true)}>
                            <ImagesIcon />
                            <span className="hidden sm:inline">Images</span>
                            {studio.gallery.length ? <span className="text-muted-foreground">{studio.gallery.length}</span> : null}
                        </Button>
                        {turns.length ? (
                            <Button variant="ghost" size="sm" onClick={studio.newChat}>
                                <SquarePenIcon />
                                New chat
                            </Button>
                        ) : null}
                        <Button variant="ghost" size="icon-sm" aria-label="Image settings" onClick={() => studio.setSettingsOpen(true)}>
                            <SettingsIcon />
                        </Button>
                    </div>
                </div>
                {turns.length ? (
                    <>
                        <div className="min-h-0 flex-1 overflow-y-auto">
                            <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-4 pt-4 pb-8">
                                {turns.map((turn) => (
                                    <ChatTurn
                                        key={turn.id}
                                        turn={turn}
                                        onCopy={(prompt) => void studio.copyPrompt(prompt)}
                                        onRetry={studio.retry}
                                        onOpen={studio.openResult}
                                        canRetry={studio.canRetry}
                                    />
                                ))}
                                <div ref={end} />
                            </div>
                        </div>
                        <div className="mx-auto flex w-full max-w-3xl flex-col gap-1.5 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                            {composer}
                            <p className="line-clamp-1 text-center text-[11px] text-muted-foreground">{footnote}</p>
                        </div>
                    </>
                ) : (
                    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                        <div className="mx-auto my-auto flex w-full max-w-3xl flex-col gap-6 py-8">
                            <div className="flex flex-col gap-1 text-center">
                                <h2 className="text-2xl font-semibold tracking-tight">Who are we drawing today?</h2>
                                <p className="text-sm text-muted-foreground">
                                    Put your model into any pose and costume with an image model.
                                </p>
                            </div>
                            {composer}
                            <div className="grid gap-2 sm:grid-cols-2">
                                {starters.map((starter) => (
                                    <button
                                        key={starter.label}
                                        type="button"
                                        onClick={() => start(starter.kind)}
                                        className="flex items-start gap-3 rounded-2xl border p-3 text-left hover:bg-accent"
                                    >
                                        <starter.icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                                        <span className="flex flex-col">
                                            <span className="text-sm font-medium">{starter.label}</span>
                                            <span className="text-xs text-muted-foreground">{starter.detail}</span>
                                        </span>
                                    </button>
                                ))}
                            </div>
                            <p className="text-center text-[11px] text-muted-foreground">{footnote}</p>
                        </div>
                    </div>
                )}
                <input
                    ref={input}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    multiple
                    hidden
                    onChange={(event) => void addPhotos(event.target.files)}
                />
                <input
                    ref={sceneInput}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    hidden
                    onChange={(event) => void chooseScene(event.target.files)}
                />
                <PickerDialog
                    kind={studio.picker}
                    onOpenChange={(open) => !open && studio.setPicker(null)}
                    selectedPoses={studio.poses.map((entry) => entry.pose.uid)}
                    selectedCostume={studio.costume?.uid ?? null}
                    onPickPose={(uid) => {
                        studio.addPose(uid, ANGLES[0].jp);
                        studio.setPicker(null);
                    }}
                    onPickCostume={(uid) => {
                        studio.setCostume(uid);
                        studio.setPicker(null);
                    }}
                />
                <Dialog open={studio.modelOpen} onOpenChange={studio.setModelOpen}>
                    <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Model</DialogTitle>
                        </DialogHeader>
                        <div className="[&>section]:border-0 [&>section]:p-0 [&>section>h2]:hidden">
                            <ModelPanel
                                photos={selection.modelPhotos}
                                description={selection.description}
                                onPhotos={(modelPhotos) => studio.patch({ modelPhotos })}
                                onDescription={(description) => studio.patch({ description })}
                            />
                        </div>
                    </DialogContent>
                </Dialog>
                <GalleryPanel
                    open={studio.galleryOpen}
                    onOpenChange={studio.setGalleryOpen}
                    images={studio.gallery}
                    onOpen={studio.setViewing}
                    onDelete={studio.removeImage}
                    onDeleteAll={studio.removeAllImages}
                    driveAvailable={studio.drive.available}
                    onSaveAllToDrive={studio.saveAllToDrive}
                />
                <ImageViewer
                    image={studio.viewing}
                    onOpenChange={(open) => !open && studio.setViewing(null)}
                    onCopy={(prompt) => void studio.copyPrompt(prompt)}
                    onDelete={studio.removeImage}
                    driveAvailable={studio.drive.available}
                    onSaveToDrive={(image) => studio.saveToDrive([image.result])}
                />
                <DriveAskDialog
                    open={studio.askDrive}
                    onAccept={() => void studio.acceptDrive()}
                    onLater={() => studio.setAskDrive(false)}
                    onNever={() => {
                        studio.setAskDrive(false);
                        studio.drive.setPreference('off');
                    }}
                />
                <NegativePromptDialog
                    open={studio.negativeOpen}
                    onOpenChange={studio.setNegativeOpen}
                    value={selection.negativePrompt}
                    onSave={(negativePrompt) => studio.patch({ negativePrompt })}
                />
                <ImageSettingsDialog
                    open={studio.settingsOpen}
                    onOpenChange={studio.setSettingsOpen}
                    settings={studio.settings}
                    onSave={studio.saveSettings}
                    onClear={studio.clearSettings}
                />
                <Sheet open={studio.chatsOpen} onOpenChange={studio.setChatsOpen}>
                    <SheetContent side="left" className="w-72 gap-2 p-3">
                        <SheetHeader className="p-1">
                            <SheetTitle>Chats</SheetTitle>
                        </SheetHeader>
                        {chatList}
                    </SheetContent>
                </Sheet>
            </div>
        </div>
    );
}
