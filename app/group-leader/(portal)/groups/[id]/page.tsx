import { ViewGroup } from '@/components/group-leader/view-group';

export default async function GroupLeaderViewGroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ViewGroup id={id} />;
}
