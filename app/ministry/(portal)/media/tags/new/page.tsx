import { TagForm } from '@/components/sermon-admin/tag-form';

/** Church Admin reuses the Add new tag modal (Figma 426:30566). */
export default function MinistryAddTagPage() {
  return <TagForm mode="add" backTo="/ministry/media" />;
}
