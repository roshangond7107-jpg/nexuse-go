import { useMemo, useState } from 'react';
import { Image, Pressable, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { CATEGORIES, CONDITION_LABELS, type Condition } from '@nexuse/catalog';
import { listingFormSchema, validateImageMeta } from '@nexuse/validation';
import { scanListingText } from '@nexuse/domain';
import Screen from '@/components/Screen';
import { Body, Button, Heading, Notice } from '@/components/ui';
import { useTheme, radii } from '@/lib/theme';

const MAX_PHOTOS = 8;
type Photo = { uri: string; name: string };

export default function Sell() {
  const t = useTheme();
  const [v, setV] = useState({ title: '', description: '', categorySlug: '', condition: 'good' as Condition, price: '', originalPrice: '', city: '', state: '', pinCode: '' });
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photoErr, setPhotoErr] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const set = (k: keyof typeof v) => (x: string) => setV((s) => ({ ...s, [k]: x }));

  const parsed = useMemo(() => listingFormSchema.safeParse({
    ...v, price: v.price.trim() === '' ? undefined : Number(v.price),
    originalPrice: v.originalPrice.trim() === '' ? null : Number(v.originalPrice), pinCode: v.pinCode.trim() === '' ? undefined : v.pinCode, quantity: 1,
  }), [v]);
  const errors: Record<string, string> = {};
  if (!parsed.success) for (const i of parsed.error.issues) { const k = String(i.path[0] ?? ''); if (k && !errors[k]) errors[k] = i.message; }
  const flagged = scanListingText(v.title, v.description);

  async function pick() {
    setPhotoErr(null);
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: MAX_PHOTOS - photos.length, quality: 0.8 });
    if (r.canceled) return;
    const next: Photo[] = [];
    for (const a of r.assets) {
      if (photos.length + next.length >= MAX_PHOTOS) { setPhotoErr(`You can add up to ${MAX_PHOTOS} photos.`); break; }
      const m = validateImageMeta(a.mimeType ?? 'image/jpeg', a.fileSize ?? 1);
      if (!m.ok) { setPhotoErr(`${a.fileName ?? 'Photo'}: ${m.error}`); continue; }
      next.push({ uri: a.uri, name: a.fileName ?? 'photo' });
    }
    setPhotos((p) => [...p, ...next]);
  }

  const Err = ({ k }: { k: string }) => (checked && errors[k] ? <Text accessibilityRole="alert" style={{ color: t.danger, fontSize: 13 }}>{errors[k]}</Text> : null);
  const input = (label: string, k: keyof typeof v, extra: object = {}) => (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ color: t.text, fontWeight: '600', marginBottom: 4 }}>{label}</Text>
      <TextInput accessibilityLabel={label} value={v[k]} onChangeText={set(k)} placeholderTextColor={t.textMuted}
        style={{ minHeight: 48, borderWidth: 1, borderColor: t.border, borderRadius: radii.md, paddingHorizontal: 12, color: t.text, backgroundColor: t.surface, fontSize: 16 }} {...extra} />
      <Err k={k} />
    </View>
  );
  const chips = <T extends string>(items: { key: T; label: string }[], value: string, onPick: (k: T) => void) => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
      {items.map((i) => <Pressable key={i.key} accessibilityRole="button" accessibilityState={{ selected: value === i.key }} accessibilityLabel={i.label} onPress={() => onPick(i.key)}
        style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 14, borderRadius: radii.pill, backgroundColor: value === i.key ? t.primary : t.surfaceMuted }}>
        <Text style={{ color: value === i.key ? t.onPrimary : t.text, fontWeight: '600' }}>{i.label}</Text></Pressable>)}
    </View>
  );

  return (
    <Screen>
      <Heading>Sell a study item</Heading>
      <Notice><Text style={{ fontWeight: '800' }}>Publishing isn’t available yet.</Text> You can prepare a listing here and check it, but nothing is saved or sent anywhere. Selling opens once sign-in and listing storage are live.</Notice>
      {input('Title', 'title', { maxLength: 120 })}
      <Text style={{ color: t.text, fontWeight: '600', marginBottom: 4 }}>Category</Text>
      {chips(CATEGORIES.map((c) => ({ key: c.slug, label: c.name })), v.categorySlug, set('categorySlug'))}<Err k="categorySlug" />
      <Text style={{ color: t.text, fontWeight: '600', marginBottom: 4 }}>Condition</Text>
      {chips((Object.keys(CONDITION_LABELS) as Condition[]).map((k) => ({ key: k, label: CONDITION_LABELS[k] })), v.condition, (k) => setV((s) => ({ ...s, condition: k })))}
      {input('Description', 'description', { multiline: true, maxLength: 4000, style: { minHeight: 120, textAlignVertical: 'top', borderWidth: 1, borderColor: t.border, borderRadius: radii.md, padding: 12, color: t.text, backgroundColor: t.surface, fontSize: 16 } })}
      {flagged.flagged && <Notice tone="warn">This text may need extra review before it can be published ({flagged.categories.join(', ').replaceAll('_', ' ')}). This is an automatic hint, not a decision.</Notice>}
      {input('Price (₹)', 'price', { keyboardType: 'number-pad' })}
      {input('Original price (₹, optional)', 'originalPrice', { keyboardType: 'number-pad' })}
      {input('City', 'city')}{input('State', 'state')}
      {input('PIN code (optional)', 'pinCode', { keyboardType: 'number-pad', maxLength: 6 })}
      <Body muted>Photos (JPEG, PNG or WebP, up to 5 MB each)</Body>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 8 }}>
        {photos.map((p, i) => (
          <Pressable key={p.uri} accessibilityRole="button" accessibilityLabel={`Remove photo ${i + 1}`} onPress={() => setPhotos((x) => x.filter((_, j) => j !== i))}>
            <Image source={{ uri: p.uri }} style={{ width: 72, height: 72, borderRadius: 8 }} accessibilityIgnoresInvertColors /></Pressable>))}
      </View>
      {photoErr && <Text accessibilityRole="alert" style={{ color: t.danger }}>{photoErr}</Text>}
      {checked && photos.length === 0 && <Text accessibilityRole="alert" style={{ color: t.danger }}>Add at least one photo</Text>}
      <Button label="Add photos" variant="outline" onPress={pick} disabled={photos.length >= MAX_PHOTOS} />
      <View style={{ height: 12 }} />
      <Button label="Check my listing" onPress={() => setChecked(true)} />
      <View style={{ height: 8 }} />
      <Button label="Publish (not available yet)" disabled accessibilityHint="Publishing is not available yet" />
      {checked && <Text accessibilityLiveRegion="polite" style={{ color: t.textMuted, marginTop: 8 }}>{parsed.success && photos.length > 0 ? 'Looks good. Publishing will be enabled once the service is live.' : 'Please fix the highlighted fields.'}</Text>}
    </Screen>
  );
}
