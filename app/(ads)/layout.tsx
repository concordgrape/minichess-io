import FreestarHead from "../components/ads/FreestarHead";

export default function AdsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <FreestarHead />
      {children}
    </>
  );
}
