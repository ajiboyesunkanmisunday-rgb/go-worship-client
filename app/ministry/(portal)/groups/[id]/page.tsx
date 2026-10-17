import { GroupOverview } from '@/components/ministry/group-overview';

export default async function MinistryViewGroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <GroupOverview id={id} />;
}
