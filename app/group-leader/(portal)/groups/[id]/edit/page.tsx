import { CreateGroupForm } from '@/components/group-leader/create-group-form';

export default async function GroupLeaderEditGroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CreateGroupForm basePath="/group-leader/groups" mode="edit" id={id} />;
}
