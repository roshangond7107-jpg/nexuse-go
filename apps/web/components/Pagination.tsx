import Link from 'next/link';
export default function Pagination({ page, pages, hrefFor }: { page: number; pages: number; hrefFor: (n: number) => string }) {
  if (pages <= 1) return null;
  return (
    <nav className="pager" aria-label="Pagination">
      {page > 1 ? <Link className="btn alt" href={hrefFor(page - 1)} rel="prev">Previous</Link> : <span className="btn alt" aria-disabled="true">Previous</span>}
      <span aria-current="page">Page {page} of {pages}</span>
      {page < pages ? <Link className="btn alt" href={hrefFor(page + 1)} rel="next">Next</Link> : <span className="btn alt" aria-disabled="true">Next</span>}
    </nav>
  );
}
