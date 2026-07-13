import { SearchHeader } from "@/components/search-header";
import { SearchContent } from "@/features/works/search-content";

export default function SearchPage() {
  return (
    <main
      data-testid="search-screen"
      className="app-screen-background min-h-dvh px-6 pt-[max(2rem,env(safe-area-inset-top))] text-white"
    >
      <SearchHeader />
      <SearchContent />
    </main>
  );
}
