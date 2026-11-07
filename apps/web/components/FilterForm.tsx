import { CATEGORIES, CONDITION_LABELS, SORT_LABELS, type SearchParams } from '@nexuse/catalog';

/** Plain GET form: works without JavaScript and keeps filters shareable via URL. */
export default function FilterForm({ params, action, showCategory = true }: { params: SearchParams; action: string; showCategory?: boolean }) {
  return (
    <form className="panel" action={action} method="get" aria-label="Filter results">
      <h2 style={{ fontSize: '1.1rem' }}>Filters</h2>
      <div className="field"><label htmlFor="f-q">Search</label><input id="f-q" name="q" type="search" defaultValue={params.q} maxLength={100} /></div>
      {showCategory && (
        <div className="field"><label htmlFor="f-cat">Category</label>
          <select id="f-cat" name="category" defaultValue={params.category ?? ''}><option value="">All categories</option>{CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select></div>
      )}
      <div className="field"><label htmlFor="f-cond">Condition</label>
        <select id="f-cond" name="condition" defaultValue={params.condition ?? ''}><option value="">Any</option>{Object.entries(CONDITION_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
      <div className="row">
        <div className="field" style={{ flex: 1 }}><label htmlFor="f-min">Min ₹</label><input id="f-min" name="min" inputMode="numeric" pattern="[0-9]*" defaultValue={params.minPrice ?? ''} /></div>
        <div className="field" style={{ flex: 1 }}><label htmlFor="f-max">Max ₹</label><input id="f-max" name="max" inputMode="numeric" pattern="[0-9]*" defaultValue={params.maxPrice ?? ''} /></div>
      </div>
      <div className="field"><label htmlFor="f-sort">Sort by</label>
        <select id="f-sort" name="sort" defaultValue={params.sort}>{Object.entries(SORT_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
      <button className="btn" type="submit" style={{ width: '100%' }}>Apply filters</button>
    </form>
  );
}
