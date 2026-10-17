import { EditTenantForm } from '@/components/system/edit-tenant-form';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function SystemEditTenantPage({ params }: Props) {
  const { id } = await params;
  return <EditTenantForm id={id} />;
}
