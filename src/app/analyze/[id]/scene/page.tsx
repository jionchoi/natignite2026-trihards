import { ParticleBackground } from "@frontend/components/particle-background";
import { PageContainer } from "@/components/layout/PageContainer";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SceneView } from "./SceneView";

export default function AnalyzeScenePage() {
  return (
    <main className="relative min-h-dvh overflow-hidden">
      <ParticleBackground />
      <div className="relative z-10">
        <SiteHeader />
        <PageContainer size="lg" className="py-8">
          <SceneView />
        </PageContainer>
      </div>
    </main>
  );
}
