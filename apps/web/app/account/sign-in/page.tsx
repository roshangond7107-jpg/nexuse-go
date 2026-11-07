import type { Metadata } from 'next';
import Link from 'next/link';
export const metadata: Metadata = { title: 'Sign in' };
export default function SignIn() {
  return (
    <>
      <h1>Sign in</h1>
      <div className="state" role="status">
        <div className="em" aria-hidden="true">🔐</div>
        <h2>Not available yet</h2>
        <p>Sign-in will use your Indian mobile number with a one-time code sent by SMS, protected by a CAPTCHA. That service is not connected, so we do not show a sign-in form that would only pretend to work.</p>
        <Link className="btn" href="/">Back to home</Link>
      </div>
    </>
  );
}
