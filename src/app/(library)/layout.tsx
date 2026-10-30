import { LibraryProvider } from '@/components/library/LibraryProvider';
import { LibraryShell } from '@/components/library/LibraryShell';
import { readCatalogue } from '@/lib/catalogue/readCatalogue';

export default async function LibraryLayout({ children }: LayoutProps<'/'>) {
  const catalogue = await readCatalogue();

  return (
    <LibraryProvider catalogue={catalogue}>
      <LibraryShell>{children}</LibraryShell>
    </LibraryProvider>
  );
}
