import { ParticleBackground } from "@frontend/components/particle-background";
import { PageContainer } from "@/components/layout/PageContainer";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { AnalyzeView } from "./AnalyzeView";

export default function AnalyzePage() {
  return (
    <main className="relative min-h-dvh overflow-hidden">
      <ParticleBackground />
      <div className="relative z-10">
        <SiteHeader />
        <PageContainer size="lg" className="py-8">
          <AnalyzeView />
        </PageContainer>
      </div>
    </main>
  );
}
