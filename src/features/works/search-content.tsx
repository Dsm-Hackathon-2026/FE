"use client";

import { useState } from "react";

import { RecentSearches } from "@/components/recent-searches";
import { SearchInput } from "@/components/search-input";
import { SearchResults } from "@/features/works/search-results";

export function SearchContent() {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim();

  return (
    <div className="mt-11">
      <SearchInput
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onClear={() => setQuery("")}
      />
      <div className="mt-9">
        {normalizedQuery ? <SearchResults query={normalizedQuery} /> : <RecentSearches />}
      </div>
    </div>
  );
}
