export async function copyText(text: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text);

        return true;
    } catch {
        const field = document.createElement('textarea');

        field.value = text;
        field.setAttribute('readonly', '');
        field.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
        document.body.append(field);
        field.select();

        const copied = document.execCommand('copy');

        field.remove();

        return copied;
    }
}
