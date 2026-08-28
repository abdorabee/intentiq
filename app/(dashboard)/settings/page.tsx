import { AccountRoleEditor } from "@/components/settings/account-role-editor";
import { ClerkUserProfile } from "@/components/settings/clerk-user-profile";

export default function SettingsAccountPage() {
  return (
    <div className="settings-sections">
      <header className="page-head">
        <div>
          <h1 className="page-title">Account</h1>
          <p className="page-sub">
            Name, email, password, and account deletion are managed by Clerk. Your workspace role lives here.
          </p>
        </div>
      </header>

      <section className="settings-section" aria-labelledby="settings-identity">
        <h2 id="settings-identity">Identity</h2>
        <p>Update the profile used to sign in. Changes apply across devices immediately.</p>
        <ClerkUserProfile />
      </section>

      <section className="settings-section" aria-labelledby="settings-role">
        <h2 id="settings-role">Role</h2>
        <p>Used to tailor scoring recommendations and assistant tone. Admin stays available only if it is already assigned.</p>
        <AccountRoleEditor />
      </section>
    </div>
  );
}
