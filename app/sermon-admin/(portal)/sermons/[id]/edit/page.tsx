import { SermonForm } from '@/components/sermon-admin/sermon-form';

export default async function SermonAdminEditSermonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SermonForm mode="edit" id={id} />;
}
