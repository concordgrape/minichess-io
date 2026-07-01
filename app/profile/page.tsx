import Account from "./Account";

export const metadata = { title: "Account | Daily Checkmate" };

export default function ProfilePage() {
  return (
    <div>
      <h1 className="h4 mb-1">Account</h1>
      <p className="text-muted mb-4">Manage your profile and account settings.</p>
      <Account />
    </div>
  );
}
