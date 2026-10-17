import { TenantDetail } from '@/components/system/tenant-detail';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function SystemTenantDetailPage({ params }: Props) {
  const { id } = await params;
  return <TenantDetail id={id} />;
}
