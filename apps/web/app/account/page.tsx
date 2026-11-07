import type { Metadata } from 'next';
import Link from 'next/link';
import { FEATURES } from '@nexuse/catalog';
export const metadata: Metadata = { title: 'Account' };

const ITEMS = [
  { t: 'Profile', d: 'Name, city and institution' },
  { t: 'My listings', d: 'Items you are selling' },
  { t: 'Messages', d: 'Chats with buyers and sellers' },
  { t: 'Orders', d: 'Purchases and sales' },
];
export default function Account() {
  return (
    <>
      <h1>Your account</h1>
      {!FEATURES.accountSignIn && <p className="notice" role="status"><b>Sign-in isn’t available yet.</b> We’ll add phone-number sign-in with SMS verification once the verification service is connected and tested. Until then there is no account to create.</p>}
      <ul className="list" aria-label="Account sections">
        {ITEMS.map((i) => <li key={i.t} aria-disabled="true" style={{ opacity: .6 }}><span><b>{i.t}</b><br /><span className="meta">{i.d}</span></span><span className="badge">Coming soon</span></li>)}
        <li><span><b>Wishlist</b><br /><span className="meta">Saved on this device</span></span><Link href="/wishlist">Open</Link></li>
        <li><span><b>Safety tips</b><br /><span className="meta">Meeting and paying safely</span></span><Link href="/safety">Read</Link></li>
      </ul>
      <p style={{ marginTop: 16 }}><Link className="btn" href="/account/sign-in">Sign in options</Link></p>
    </>
  );
}
