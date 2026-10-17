import { SermonOverview } from '@/components/sermon-admin/sermon-overview';

/** Church Admin reuses the Sermon Overview modal (Figma 494:21304). */
export default function MinistryViewSermonPage() {
  return <SermonOverview backTo="/ministry/media" />;
}
