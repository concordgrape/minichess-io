import type { Metadata } from "next";
import Breadcrumbs from "@/app/components/Breadcrumbs";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Chess Puzzles (dailycheckmate.com) collects, uses, and safeguards user information.",
  alternates: { canonical: "/privacy-policy" },
  robots: { index: true, follow: true },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h2 className="h5 fw-semibold mb-2">{title}</h2>
      <div className="text-muted" style={{ lineHeight: 1.7 }}>{children}</div>
    </div>
  );
}

function StorageTable({ rows, headers }: { rows: [string, string, string?][]; headers: string[] }) {
  return (
    <table className="table table-sm table-bordered small mb-3">
      <thead>
        <tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map(([key, purpose, expires]) => (
          <tr key={key}>
            <td className="font-monospace" style={{ fontSize: 12 }}>{key}</td>
            <td>{purpose}</td>
            {expires !== undefined && <td>{expires}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function PrivacyPolicy() {
  return (
    <div style={{ maxWidth: 720 }}>
      <Breadcrumbs items={[
        { name: "Home", url: "https://dailycheckmate.com" },
        { name: "Privacy Policy", url: "https://dailycheckmate.com/privacy-policy" },
      ]} />
      <h1 className="fw-bold mb-1">Privacy Policy</h1>
      <p className="text-muted small mb-4">Last updated: 07/14/2026</p>

      <p className="text-muted mb-4" style={{ lineHeight: 1.7 }}>
        This Privacy Policy details how Chess Puzzles, operating the website
        dailycheckmate.com, collects, uses, and safeguards user information.
      </p>

      <Section title="Information Collection">
        Chess Puzzles can be used without an account — puzzle progress is saved
        locally in your browser. You may optionally create an account, either
        with an email and password or by using <strong>Sign in with
        Google</strong>, to appear on leaderboards. If you sign in with Google,
        we receive only your basic profile information (email address) from
        Google; we never see your Google password. We may also collect
        anonymous usage data to improve the platform.
      </Section>

      <Section title="What We Store in Firebase">
        <p className="mb-3">
          Account and gameplay data is stored with Google Firebase (Firestore).
          We only store the data needed to run the game and its leaderboards:
        </p>
        <ul className="ps-3" style={{ lineHeight: 1.8 }}>
          <li>Your email address and an auto-generated username</li>
          <li>Your completed games and best score for each puzzle</li>
          <li>Your overall score used for global rankings</li>
          <li>Leaderboard entries (username and score) visible to other players</li>
        </ul>
        <p className="mb-0">
          We do not store payment information, precise location, or any other
          sensitive personal data. <strong>We never sell user information.</strong>
        </p>
      </Section>

      <Section title="Use of Information">
        Any data collected is used solely to improve user experience, maintain
        game functionality, operate leaderboards, and run dailycheckmate.com.
        We do not collect personally identifiable information beyond what is
        needed for your account, unless you contact us directly.
      </Section>

      <Section title="Protection of Information">
        We are committed to ensuring the security and confidentiality of any
        collected information. Account data is stored with Google Firebase and
        protected by industry-standard security measures. We employ appropriate
        measures to protect this information from unauthorized access or
        disclosure.
      </Section>

      <Section title="Account Deletion">
        To delete your account and all associated data (email, username, and
        scores), or to request deletion of any other data we may hold, please
        contact us at{" "}
        <a href="mailto:hi@skyroth.com">hi@skyroth.com</a>.
      </Section>

      <Section title="Third-Party Disclosure">
        We do not sell user data to third parties without explicit consent,
        except where required by law. Limited technical data is processed by
        our hosting and analytics providers as described below.
      </Section>

      <Section title="Cookies and Tracking">
        <p className="mb-3">
          Chess Puzzles uses cookies and browser storage technologies to save
          your game progress and preferences. No personally identifiable
          information is stored in any of these mechanisms.
        </p>

        <h3 className="h6 fw-semibold">Cookies we set</h3>
        <StorageTable
          headers={["Cookie", "Purpose", "Expires"]}
          rows={[
            ["locale", "Stores your selected display language (en, es, de, zh)", "1 year"],
          ]}
        />

        <h3 className="h6 fw-semibold">Third-party cookies</h3>
        <StorageTable
          headers={["Cookie", "Purpose", "Expires"]}
          rows={[
            ["_ga", "Google Analytics — distinguishes users", "2 years"],
            ["_ga_*", "Google Analytics — maintains session state", "2 years"],
          ]}
        />

        <h3 className="h6 fw-semibold">Local storage (browser only)</h3>
        <p className="small mb-2">
          The following data is stored locally in your browser and is never
          transmitted to our servers.
        </p>
        <StorageTable
          headers={["Key", "Purpose"]}
          rows={[
            ["theme", "Stores your light/dark mode preference"],
            ["minichess_scores", "Saves points earned from completed puzzles"],
            ["progress_{game}", "Tracks which puzzles you have started or completed per game"],
            ["check-v1-{puzzleId}", "Saves in-progress Check puzzle state"],
            ["smothered-v1-{puzzleId}", "Saves in-progress Smothered Mate puzzle state"],
            ["solitaire-v1-{puzzleId}", "Saves in-progress Chain Capture puzzle state"],
            ["minichess-v1-{positionId}", "Saves in-progress Mini Chess game state"],
            ["sol_completed", "Tracks completed Chess Solitaire puzzles"],
            ["survival_best", "Stores your best Survival mode score"],
          ]}
        />
        <p className="small mb-3">
          If you sign in, Firebase Authentication also stores your session in
          your browser (IndexedDB) so you stay signed in between visits.
        </p>

        <h3 className="h6 fw-semibold">Session storage (browser only)</h3>
        <p className="small mb-2">
          Session storage is cleared automatically when you close your browser tab.
        </p>
        <StorageTable
          headers={["Key", "Purpose"]}
          rows={[
            ["rp_{game}", "Remembers the random puzzle selected for you this session"],
          ]}
        />

        <p>
          You can manage or clear cookies and site data at any time through
          your browser settings.
        </p>
      </Section>

      <Section title="Analytics & Hosting">
        <p className="mb-3">
          Chess Puzzles is hosted on <strong>Vercel</strong>. As part of serving
          the application, Vercel may collect limited technical data such as IP
          addresses and request logs for performance monitoring and abuse
          prevention. This data is handled according to Vercel&apos;s privacy
          policy at{" "}
          <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">
            vercel.com/legal/privacy-policy
          </a>.
        </p>
        <p className="mb-3">
          We use <strong>Vercel Analytics</strong> to measure Core Web Vitals
          and page performance. This data is anonymized and does not include
          personal identifiers.
        </p>
        <p className="mb-3">
          We use <strong>Simple Analytics</strong>, a privacy-first analytics
          tool that collects no personal data, sets no cookies, and does not
          track users across sites. It counts only page views and referrers in
          aggregate. You can review their policy at{" "}
          <a href="https://simpleanalytics.com/privacy" target="_blank" rel="noopener noreferrer">
            simpleanalytics.com/privacy
          </a>.
        </p>
        <p>
          We also use <strong>Google Analytics 4</strong> to understand how the
          site is used. Google Analytics sets cookies (listed above) and may
          collect data such as your device type, pages visited, and approximate
          location. This data is governed by Google&apos;s Privacy Policy at{" "}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
            policies.google.com/privacy
          </a>. You can opt out via the{" "}
          <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">
            Google Analytics opt-out browser add-on
          </a>.
        </p>
      </Section>

      <Section title="Updates to Privacy Policy">
        This Privacy Policy may be periodically updated. Continued use of
        dailycheckmate.com following any changes constitutes acceptance of the
        revised policy.
      </Section>

      <Section title="Contact Information">
        For any inquiries or concerns regarding this Privacy Policy or the use
        of dailycheckmate.com, please contact us at{" "}
        <a href="mailto:hi@skyroth.com">hi@skyroth.com</a>.
      </Section>

      <p className="border-top pt-3 mt-4 small text-muted">
        By using dailycheckmate.com, you agree to adhere to the terms outlined
        in this Privacy Policy.
      </p>
    </div>
  );
}
