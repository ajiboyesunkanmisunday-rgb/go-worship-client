'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { SheetPage } from '@/components/ui/sheet-page';
import { ArrowLeft, Pencil, UploadCloud } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FormEvent, useState, useEffect } from 'react';
import { getTenantSeries, getTenantSermonById, createTenantSermon, updateTenantSermon } from '@/lib/api/tenant';
import { toast } from 'sonner';

function Field({
  label,
  children,
  error,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-medium text-[#333]">{label}</label>
      {children}
      {error && <p className="text-[12px] text-destructive">{error}</p>}
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


const EMPTY_SERMON = { title: '', speaker: '', date: '', description: '', link: '' };

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
  const [sermon, setSermon] = useState(EMPTY_SERMON);
  const [formKey, setFormKey] = useState(0);
  const [seriesOpts, setSeriesOpts] = useState<{ value: string; label: string }[]>([]);
  const [fieldErrors, setFieldErrors] = useState<{ title?: string; speaker?: string }>({});

  useEffect(() => {
    getTenantSeries()
      .then((arr) => {
        const opts = arr
          .map((s) => ({
            value: String(s.id ?? s.seriesId ?? ''),
            label: String(s.title ?? ''),
          }))
          .filter((o) => o.label);
        setSeriesOpts(opts);
      })
      .catch(() => {});

    if (isEdit && id) {
      getTenantSermonById(id)
        .then((d) => {
          const rawDate = String(d.sermonDate ?? d.createdAt ?? '');
          const date = rawDate ? rawDate.split('T')[0] : '';
          setSermon({
            title: String(d.title ?? ''),
            speaker: String(d.speakerName ?? ''),
            date,
            description: String(d.description ?? ''),
            link: '',
          });
          setFormKey((k) => k + 1);
        })
        .catch(() => {});
    }
  }, [isEdit, id]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const errors: { title?: string; speaker?: string } = {};
    if (!fd.get('title')) errors.title = 'Sermon title is required';
    if (!fd.get('speaker')) errors.speaker = 'Speaker name is required';
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    const payload = {
      title: fd.get('title') as string,
      speakerName: fd.get('speaker') as string,
      sermonDate: fd.get('date') as string,
      description: fd.get('description') as string,
      seriesId: fd.get('series') as string || undefined,
    };
    try {
      if (isEdit && id) {
        await updateTenantSermon(id, payload);
      } else {
        await createTenantSermon(payload);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save sermon. Please try again.');
      return;
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
          <Field label={<>Sermon Title&#42;</>} error={fieldErrors.title}>
            <PencilInput
              name="title"
              placeholder="Enter title"
              defaultValue={isEdit ? sermon.title : undefined}
            />
          </Field>

          <Field label={<>Speaker name&#42;</>} error={fieldErrors.speaker}>
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
              <NativeSelectOption value="">No series</NativeSelectOption>
              {seriesOpts.map((o) => (
                <NativeSelectOption key={o.value} value={o.value}>
                  {o.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>

          <Field label="Upload Audio">
            <DropZone hint="Drag or drop Audio Recommended size: 50mb" />
          </Field>

          <Field label="Upload cover image">
            <DropZone hint="Drag or drop image Recommended size: 20mb" />
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
