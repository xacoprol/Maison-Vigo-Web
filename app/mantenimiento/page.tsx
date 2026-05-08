import { Suspense } from "react";
import { MaintenanceClient } from "./MaintenanceClient";

function MaintenanceFallback() {
  return (
    <main className="maintenance-page">
      <div className="maintenance-overlay" />
      <section className="maintenance-card">
        <p className="maintenance-copy">Web en mantenimiento</p>
      </section>
    </main>
  );
}

export default function MaintenancePage() {
  return (
    <Suspense fallback={<MaintenanceFallback />}>
      <MaintenanceClient />
    </Suspense>
  );
}
