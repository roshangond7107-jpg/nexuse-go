'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CATEGORIES, CONDITION_LABELS } from '@nexuse/catalog';
import { listingFormSchema, validateImageMeta, sniffImageType } from '@nexuse/validation';
import { scanListingText } from '@nexuse/domain';

type Photo = { name: string; url: string };
const MAX_PHOTOS = 8;

export default function SellForm() {
  const [v, setV] = useState({ title: '', description: '', categorySlug: '', condition: 'good', price: '', originalPrice: '', city: '', state: '', pinCode: '' });
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photoErr, setPhotoErr] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setV((s) => ({ ...s, [k]: e.target.value }));

  const photosRef = useRef<Photo[]>([]);
  photosRef.current = photos;
  useEffect(() => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.url)), []); // revoke the latest previews on unmount

  const num = (s: string) => (s.trim() === '' ? undefined : Number(s));
  const parsed = useMemo(() => listingFormSchema.safeParse({
    title: v.title, description: v.description, categorySlug: v.categorySlug, condition: v.condition,
    price: num(v.price), originalPrice: v.originalPrice.trim() === '' ? null : Number(v.originalPrice),
    city: v.city, state: v.state, pinCode: v.pinCode.trim() === '' ? undefined : v.pinCode, quantity: 1,
  }), [v]);
  const errors: Record<string, string> = {};
  if (!parsed.success) for (const i of parsed.error.issues) { const k = String(i.path[0] ?? ''); if (k && !errors[k]) errors[k] = i.message; }
  const flagged = scanListingText(v.title, v.description);

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    setPhotoErr(null);
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    const next: Photo[] = [];
    for (const f of files) {
      if (photos.length + next.length >= MAX_PHOTOS) { setPhotoErr(`You can add up to ${MAX_PHOTOS} photos.`); break; }
      const meta = validateImageMeta(f.type, f.size);
      if (!meta.ok) { setPhotoErr(`${f.name}: ${meta.error}`); continue; }
      const sniffed = sniffImageType(new Uint8Array(await f.slice(0, 12).arrayBuffer()));
      if (!sniffed) { setPhotoErr(`${f.name}: not a valid JPEG, PNG or WebP image`); continue; }
      next.push({ name: f.name, url: URL.createObjectURL(f) });
    }
    setPhotos((p) => [...p, ...next]);
  }
  const removePhoto = (i: number) => setPhotos((p) => { const g = p[i]; if (g) URL.revokeObjectURL(g.url); return p.filter((_, j) => j !== i); });

  const show = (k: string) => (touched ? errors[k] : undefined);

  return (
    <form noValidate onSubmit={(e) => { e.preventDefault(); setTouched(true); }} aria-describedby="sell-status">
      <p id="sell-status" className="notice" role="note">
        <b>Publishing isn’t available yet.</b> You can prepare a listing here and check it, but nothing is saved or sent anywhere. Selling opens once sign-in and listing storage are live.
      </p>
      <div className="layout">
        <div className="panel">
          <div className="field"><label htmlFor="s-title">Title</label><input id="s-title" value={v.title} onChange={set('title')} maxLength={120} aria-invalid={!!show('title')} aria-describedby="e-title" /><span id="e-title" className="err" role="alert">{show('title')}</span></div>
          <div className="field"><label htmlFor="s-cat">Category</label>
            <select id="s-cat" value={v.categorySlug} onChange={set('categorySlug')}><option value="">Choose…</option>{CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select><span className="err" role="alert">{show('categorySlug')}</span></div>
          <div className="field"><label htmlFor="s-cond">Condition</label>
            <select id="s-cond" value={v.condition} onChange={set('condition')}>{Object.entries(CONDITION_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
          <div className="field"><label htmlFor="s-desc">Description</label><textarea id="s-desc" value={v.description} onChange={set('description')} maxLength={4000} /><span className="hint">Mention edition, markings and any damage. Don’t include phone numbers or payment IDs.</span><span className="err" role="alert">{show('description')}</span></div>
          {flagged.flagged && <p className="notice" role="alert">This text may need extra review before it can be published ({flagged.categories.join(', ').replaceAll('_', ' ')}). This is an automatic hint, not a decision.</p>}
        </div>
        <div className="panel">
          <div className="row">
            <div className="field" style={{ flex: 1 }}><label htmlFor="s-price">Price (₹)</label><input id="s-price" inputMode="numeric" value={v.price} onChange={set('price')} /><span className="err" role="alert">{show('price')}</span></div>
            <div className="field" style={{ flex: 1 }}><label htmlFor="s-orig">Original price (₹, optional)</label><input id="s-orig" inputMode="numeric" value={v.originalPrice} onChange={set('originalPrice')} /><span className="err" role="alert">{show('originalPrice')}</span></div>
          </div>
          <div className="row">
            <div className="field" style={{ flex: 1 }}><label htmlFor="s-city">City</label><input id="s-city" value={v.city} onChange={set('city')} /><span className="err" role="alert">{show('city')}</span></div>
            <div className="field" style={{ flex: 1 }}><label htmlFor="s-state">State</label><input id="s-state" value={v.state} onChange={set('state')} /><span className="err" role="alert">{show('state')}</span></div>
          </div>
          <div className="field"><label htmlFor="s-pin">PIN code (optional)</label><input id="s-pin" inputMode="numeric" maxLength={6} value={v.pinCode} onChange={set('pinCode')} /><span className="err" role="alert">{show('pinCode')}</span></div>
          <div className="field"><label htmlFor="s-photos">Photos (JPEG, PNG or WebP, up to 5 MB each)</label><input id="s-photos" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={onFiles} />
            <span className="err" role="alert">{photoErr}</span>{touched && photos.length === 0 && <span className="err" role="alert">Add at least one photo</span>}</div>
          {photos.length > 0 && <ul className="row" style={{ listStyle: 'none', padding: 0 }}>{photos.map((p, i) => (
            <li key={p.url}><img src={p.url} alt={`Preview of ${p.name}`} width={72} height={72} style={{ objectFit: 'cover', borderRadius: 8 }} /><button type="button" className="btn alt" onClick={() => removePhoto(i)} aria-label={`Remove ${p.name}`}>Remove</button></li>))}</ul>}
          <button className="btn" type="submit">Check my listing</button>{' '}
          <button className="btn" type="button" disabled aria-disabled="true" title="Publishing isn't available yet">Publish (not available yet)</button>
          {touched && <p role="status" className="hint">{parsed.success && photos.length > 0 ? 'Looks good. Publishing will be enabled once the service is live.' : 'Please fix the highlighted fields.'}</p>}
        </div>
      </div>
    </form>
  );
}
