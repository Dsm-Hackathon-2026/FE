"use client";

import { useDeferredValue, useState } from "react";

import { RecentSearches } from "@/components/recentSearches";
import { SearchInput } from "@/components/searchInput";
import { SearchResults } from "@/features/detail/searchResults";

export function SearchContent() {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim();
  const deferredQuery = useDeferredValue(normalizedQuery);

  return (
    <div className="mt-11">
      <SearchInput
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onClear={() => setQuery("")}
      />
      <div className="mt-9">
        {normalizedQuery ? <SearchResults query={deferredQuery} /> : <RecentSearches />}
      </div>
    </div>
  );
}
