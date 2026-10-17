import { GivingReceipt } from '@/components/system/giving-receipt';

export default async function SystemTransactionReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <GivingReceipt failed={id === 'failed'} />;
}
