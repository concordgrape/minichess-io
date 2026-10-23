import FreestarHead from "../components/ads/FreestarHead";
import LeaderboardAd from "../components/ads/LeaderboardAd";

export default function AdsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <FreestarHead />
      <LeaderboardAd />
      {children}
    </>
  );
}
