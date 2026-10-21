'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { SheetPage } from '@/components/ui/sheet-page';
import { ArrowLeft, Music, Pencil, UploadCloud, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FormEvent, useState, useEffect } from 'react';
import { api } from '@/lib/api/client';
import { USE_LIVE_API } from '@/lib/api/config';

function Field({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-medium text-[#333]">{label}</label>
      {children}
    </div>
  );
}

/** Input with the small pencil affordance shown in the design. */
function PencilInput(props: React.ComponentProps<typeof Input>) {
  return (
    <div className="relative">
      <Input {...props} className="h-[48px] pr-9" />
      <Pencil className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-brand-gray-400" />
    </div>
  );
}

function DropZone({ hint }: { hint: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-1 rounded-[8px] border border-dashed border-[#cdcdcd] px-3 py-6 text-center">
      <UploadCloud className="size-5 text-brand-gray-500" />
      <p className="text-[10px] leading-tight text-brand-gray-500">{hint}</p>
    </div>
  );
}

function AudioChip({ name, onRemove }: { name: string; onRemove(): void }) {
  return (
    <div className="relative flex w-[128px] flex-col items-center justify-center gap-2 rounded-[8px] bg-[#ece9ff] px-3 py-5">
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove audio"
        className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-[#eb0000] text-white"
      >
        <X className="size-2.5" />
      </button>
      <Music className="size-7 text-[#3f44c0]" />
      <p className="text-[10px] font-medium text-[#333]">{name}</p>
    </div>
  );
}

function CoverChip({ onRemove }: { onRemove(): void }) {
  return (
    <div className="relative w-[128px] overflow-hidden rounded-[8px] bg-[#dbe7f5]">
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove cover image"
        className="absolute right-1.5 top-1.5 z-10 flex size-4 items-center justify-center rounded-full bg-[#eb0000] text-white"
      >
        <X className="size-2.5" />
      </button>
      <div className="flex h-[74px] flex-col justify-center px-2">
        <p className="text-[9px] font-bold leading-tight text-[#123a6b]">
          EFFECTIVE STEWARDSHIP:
        </p>
        <p className="text-[6px] leading-tight text-[#123a6b]">
          MAXIMIZING RESPONSIBILITY AND INFLUENCE
        </p>
      </div>
    </div>
  );
}

const SERMON = {
  title: 'Walk by Faith and Love',
  speaker: 'Pastor Christain John',
  date: '2025-11-20',
  description:
    'We walk by faith and not by sight, according to The scriptures that says, we are blessed when we walk by faith Heb 11:1 - end',
  link: 'https://www.youtube.com/watch?v=1hkEg5ugqD0',
};

const COPY = {
  add: { title: 'Add New Sermon', submit: 'Publish Sermon' },
  edit: { title: 'Edit Sermon', submit: 'Publish Sermon' },
  upload: { title: 'Upload Sermon', submit: 'Upload Media' },
} as const;

/**
 * Sermon slide-over — Add (133:9664), Edit (134:9931) and
 * Upload Sermon / media (154:14638).
 */
export function SermonForm({
  mode,
  backTo,
  id,
}: {
  mode: 'add' | 'edit' | 'upload';
  backTo?: string;
  id?: string;
}) {
  const router = useRouter();
  const isEdit = mode === 'edit';
  const copy = COPY[mode];
  const back = backTo ?? '/sermon-admin/sermons';
  const [hasAudio, setHasAudio] = useState(isEdit);
  const [hasCover, setHasCover] = useState(isEdit);
  const [sermon, setSermon] = useState(USE_LIVE_API && !isEdit ? { title: '', speaker: '', date: '', description: '', link: '' } : SERMON);
  const [formKey, setFormKey] = useState(0);
  const [seriesOpts, setSeriesOpts] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    if (!USE_LIVE_API) return;

    (api.get<unknown>('/tenant/admin/content/series') as Promise<unknown>)
      .then((data) => {
        type R = Record<string, unknown>;
        const arr: R[] = Array.isArray(data)
          ? (data as R[])
          : Array.isArray((data as R)?.['content'])
            ? ((data as R)['content'] as R[])
            : Array.isArray((data as R)?.['data'])
              ? ((data as R)['data'] as R[])
              : [];
        const opts = arr
          .map((s) => ({
            value: String(s['id'] ?? s['seriesId'] ?? ''),
            label: String(s['name'] ?? s['title'] ?? s['seriesName'] ?? ''),
          }))
          .filter((o) => o.label);
        if (opts.length > 0) setSeriesOpts(opts);
      })
      .catch(() => {});

    if (isEdit && id) {
      (api.get<unknown>(`/tenant/admin/content/sermons/${id}`) as Promise<unknown>)
        .then((data) => {
          type R = Record<string, unknown>;
          const d = data as R;
          const rawDate = String(d['sermonDate'] ?? d['date'] ?? d['createdAt'] ?? '');
          const date = rawDate ? rawDate.split('T')[0] : SERMON.date;
          setSermon({
            title: String(d['title'] ?? d['sermonTitle'] ?? SERMON.title),
            speaker: String(d['speaker'] ?? d['speakerName'] ?? SERMON.speaker),
            date,
            description: String(d['description'] ?? d['summary'] ?? SERMON.description),
            link: String(d['videoUrl'] ?? d['youtubeUrl'] ?? d['link'] ?? SERMON.link),
          });
          setFormKey((k) => k + 1);
        })
        .catch(() => {});
    }
  }, [isEdit, id]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (USE_LIVE_API) {
      const fd = new FormData(e.currentTarget);
      const payload = {
        title: fd.get('title') as string,
        speaker: fd.get('speaker') as string,
        sermonDate: fd.get('date') as string,
        description: fd.get('description') as string,
        seriesId: fd.get('series') as string || undefined,
        videoUrl: fd.get('link') as string || undefined,
      };
      try {
        if (isEdit && id) {
          await (api.put(`/tenant/admin/content/sermons/${id}`, payload) as Promise<unknown>)
            .catch(() => api.patch(`/tenant/admin/content/sermons/${id}`, payload) as Promise<unknown>);
        } else {
          await (api.post('/tenant/admin/content/sermons', payload) as Promise<unknown>);
        }
      } catch {
        // fall through to navigate regardless
      }
    }
    router.push(back);
  };

  return (
    <SheetPage
      className="w-full max-w-[665px]!"
      backLink={back}
      title={copy.title}
    >
      <div className="flex h-full w-full flex-col gap-6 overflow-y-auto px-6 pt-[64px] pb-10 md:px-[60px]">
        <button
          type="button"
          onClick={() => router.push(back)}
          aria-label="Go back"
          className="text-black transition-opacity hover:opacity-70"
        >
          <ArrowLeft className="size-6" />
        </button>

        <div className="text-center">
          <h1 className="text-[24px] font-bold">{copy.title}</h1>
          {mode !== 'upload' && (
            <p className="mt-1 text-[13px] text-brand-gray-500">
              Create and update sermon content.
            </p>
          )}
        </div>

        <form key={formKey} className="flex flex-col gap-5" onSubmit={onSubmit}>
          <Field label={<>Sermon Title&#42;</>}>
            <PencilInput
              name="title"
              placeholder="Enter title"
              defaultValue={isEdit ? sermon.title : undefined}
            />
          </Field>

          <Field label={<>Speaker name&#42;</>}>
            <PencilInput
              name="speaker"
              placeholder="Enter speaker name"
              defaultValue={isEdit ? sermon.speaker : undefined}
            />
          </Field>

          <Field label="Sermon Date">
            <Input
              name="date"
              type="date"
              className="h-[48px]"
              defaultValue={isEdit ? sermon.date : undefined}
            />
          </Field>

          <Field label="Description / Summary">
            <div className="relative">
              <Textarea
                name="description"
                className="min-h-[110px] pr-9"
                placeholder="Enter brief description"
                defaultValue={isEdit ? sermon.description : undefined}
              />
              <Pencil className="pointer-events-none absolute right-3 bottom-3 size-3.5 text-brand-gray-400" />
            </div>
          </Field>

          <Field label="Assign Series">
            <NativeSelect name="series" className="h-[48px]" defaultValue="">
              {seriesOpts.length > 0
                ? seriesOpts.map((o) => (
                    <NativeSelectOption key={o.value} value={o.value}>
                      {o.label}
                    </NativeSelectOption>
                  ))
                : (
                  <>
                    <NativeSelectOption value="">Faith at work</NativeSelectOption>
                    <NativeSelectOption value="reform">Frequently reform</NativeSelectOption>
                    <NativeSelectOption value="christ">Sermons in Christ</NativeSelectOption>
                    <NativeSelectOption value="power">Power to break yeal</NativeSelectOption>
                  </>
                )}
            </NativeSelect>
          </Field>

          <Field label="Upload Audio">
            <div className="flex items-stretch gap-3">
              {hasAudio && (
                <AudioChip name="Walk by Faith. MP3" onRemove={() => setHasAudio(false)} />
              )}
              <DropZone hint="Drag or drop Audio Recommended size: 50mb" />
            </div>
          </Field>

          <Field label="Upload cover image">
            <div className="flex items-stretch gap-3">
              {hasCover && <CoverChip onRemove={() => setHasCover(false)} />}
              <DropZone hint="Drag or drop image commended size: 20mb" />
            </div>
            <p className="mt-1 text-right text-[10px] text-[#22a45d]">
              ⊙ Recommended size: 20mb
            </p>
          </Field>

          <Field label="Attach YouTube/Vimeo link">
            <PencilInput
              name="link"
              placeholder="Enter Sermon Youtube link"
              defaultValue={isEdit ? sermon.link : undefined}
            />
          </Field>

          <label className="flex items-center gap-2 text-[13px]">
            <input type="radio" className="size-3.5 accent-brand-blue" />
            Schedule Publish Date
          </label>

          <Button size="lg" type="submit" className="mt-1 h-[52px] w-full">
            {copy.submit}
          </Button>
          <Button asChild size="lg" variant="outline" className="h-[52px] w-full">
            <button type="button" onClick={() => router.push(back)}>
              Save as Draft
            </button>
          </Button>
        </form>
      </div>
    </SheetPage>
  );
}
