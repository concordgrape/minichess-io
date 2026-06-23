export interface HowToPlayStep {
  heading: string;
  body: string;
}

export default function HowToPlay({ title, steps }: { title: string; steps: HowToPlayStep[] }) {
  return (
    <section className="mt-5 pt-4 border-top">
      <h2 className="h5 fw-bold mb-4">{title}</h2>
      <div className="row g-3">
        {steps.map((step, i) => (
          <div key={i} className="col-12 col-md-6">
            <div className="d-flex gap-3">
              <div
                className="fw-bold text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: 32, height: 32, fontSize: "0.85rem", background: "#2563eb" }}
              >
                {i + 1}
              </div>
              <div>
                <p className="fw-semibold mb-1">{step.heading}</p>
                <p className="text-muted small mb-0">{step.body}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
