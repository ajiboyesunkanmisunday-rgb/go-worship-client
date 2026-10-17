import { MemberOverview } from '@/components/ministry/member-overview';

export default async function MinistryViewMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MemberOverview id={id} />;
}
