import { SermonForm } from '@/components/sermon-admin/sermon-form';

/** Church Admin reuses the Edit Sermon modal (Figma 494:20286). */
export default function MinistryEditSermonPage() {
  return <SermonForm mode="edit" backTo="/ministry/media" />;
}
