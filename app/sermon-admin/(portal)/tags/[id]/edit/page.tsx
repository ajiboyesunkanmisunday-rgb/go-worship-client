import { TagForm } from '@/components/sermon-admin/tag-form';

export default async function SermonAdminEditTagPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TagForm mode="edit" id={id} />;
}
