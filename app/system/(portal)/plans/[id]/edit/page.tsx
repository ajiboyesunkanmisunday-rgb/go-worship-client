import { PlanForm } from '@/components/system/plan-form';

export default async function SystemEditPlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PlanForm mode="edit" id={id} />;
}
