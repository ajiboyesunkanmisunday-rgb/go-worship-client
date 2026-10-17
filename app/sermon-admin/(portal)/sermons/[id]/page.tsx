import { SermonOverview } from '@/components/sermon-admin/sermon-overview';

export default async function SermonAdminViewSermonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SermonOverview id={id} />;
}
