"use client";

import Image from "next/image";
import { type ChangeEventHandler, useRef } from "react";

import { CloseIcon } from "@/components/close-icon";

type SearchInputProps = {
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  onClear: () => void;
};

export function SearchInput({ value, onChange, onClear }: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const clearInput = () => {
    onClear();
    inputRef.current?.focus();
  };

  return (
    <label className="relative block">
      <span className="sr-only">작품 검색</span>
      <Image
        src="/search-icon.svg"
        alt=""
        width={24}
        height={24}
        data-testid="search-input-icon"
        className="pointer-events-none absolute top-1/2 left-0.5 -translate-y-1/2"
      />
      <input
        ref={inputRef}
        type="search"
        name="query"
        value={value}
        onChange={onChange}
        placeholder="원하는 작품을 검색해주세요 ..."
        autoComplete="off"
        enterKeyHint="search"
        aria-controls={value.trim() ? "search-results" : undefined}
        className="h-[52px] w-full appearance-none border-0 border-b border-[#AEAEAE] bg-transparent pr-11 pl-11 text-base font-normal text-white caret-white outline-none placeholder:text-[#AEAEAE] focus:border-white [&::-webkit-search-cancel-button]:appearance-none"
      />
      {value ? (
        <button
          type="button"
          aria-label="검색어 지우기"
          className="absolute top-1/2 right-0 flex size-11 -translate-y-1/2 items-center justify-end focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-white"
          onClick={clearInput}
        >
          <CloseIcon testId="search-clear-icon" />
        </button>
      ) : null}
    </label>
  );
}
