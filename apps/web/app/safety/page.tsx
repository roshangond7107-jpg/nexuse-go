import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Safety tips' };
export default function Safety() {
  return (
    <>
      <h1>Safety tips</h1>
      <ul>
        <li>Meet in a busy public place such as a campus gate, library or café, preferably in daylight.</li>
        <li>Bring a friend, and tell someone where you are going.</li>
        <li>Inspect the item before paying. Check pages, serial numbers and that electronics work.</li>
        <li>Do not share OTPs, UPI PINs or card details with anyone. NEXUSE GO will never ask for them.</li>
        <li>Be wary of prices that seem too good to be true, requests to move to another app, or advance payments.</li>
        <li>Under-18 users should involve a parent or guardian in every sale or meeting.</li>
      </ul>
    </>
  );
}
