import { ViewAccount } from '@/components/ministry/view-account';

export default async function MinistryViewAccountPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ViewAccount id={id} />;
}
