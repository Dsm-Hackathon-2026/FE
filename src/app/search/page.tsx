import { SearchHeader } from "@/components/searchHeader";
import { SearchContent } from "@/features/detail/searchContent";

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
