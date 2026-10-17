import { CreateGroupForm } from '@/components/group-leader/create-group-form';

export default async function MinistryEditGroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CreateGroupForm basePath="/ministry/groups" mode="edit" id={id} />;
}
