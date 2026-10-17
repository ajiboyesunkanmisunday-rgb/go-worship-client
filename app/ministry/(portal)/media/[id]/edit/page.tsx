import { SermonForm } from '@/components/sermon-admin/sermon-form';

/** Church Admin reuses the Edit Sermon modal (Figma 494:20286). */
export default async function MinistryEditSermonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SermonForm mode="edit" backTo="/ministry/media" id={id} />;
}
