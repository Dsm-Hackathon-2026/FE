import { Header } from "@/components/header";
import { HomeContent } from "@/features/landing/homeContent";

export default function Home() {
  return (
    <main
      data-testid="home-screen"
      className="app-screen-background min-h-dvh px-6 pt-[max(2rem,env(safe-area-inset-top))] text-white"
    >
      <Header />
      <HomeContent />
    </main>
  );
}
