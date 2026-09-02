import { redirect } from 'next/navigation';

/** Keep old bookmarks working without maintaining a second admin login screen. */
export default function LegacyAdminLoginPage() {
  redirect('/login?next=/admin');
}
