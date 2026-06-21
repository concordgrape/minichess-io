import SurvivalGame from "./SurvivalGame";

export const metadata = { title: "DailyCheckmate — Survival" };

export default function SurvivalPage() {
  return (
    <div>
      <h1 className="h4 mb-1">Survival</h1>
      <p className="text-muted mb-4">Capture pawns with your knight for as long as you can.</p>
      <SurvivalGame />
    </div>
  );
}
