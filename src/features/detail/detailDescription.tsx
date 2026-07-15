"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { useI18n } from "@/i18n/provider";

type WorkDescriptionProps = {
  description: string;
};

export function WorkDescription({ description }: WorkDescriptionProps) {
  const { t } = useI18n();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const descriptionRef = useRef<HTMLParagraphElement>(null);

  useLayoutEffect(() => {
    if (isExpanded) {
      return;
    }

    const descriptionElement = descriptionRef.current;

    if (!descriptionElement) {
      return;
    }

    const updateOverflow = () => {
      setIsOverflowing(
        descriptionElement.scrollHeight > descriptionElement.clientHeight + 1,
      );
    };

    updateOverflow();

    const resizeObserver = new ResizeObserver(updateOverflow);
    resizeObserver.observe(descriptionElement);

    return () => resizeObserver.disconnect();
  }, [description, isExpanded]);

  return (
    <div className="mt-7 w-full">
      <p
        ref={descriptionRef}
        id="work-description"
        data-testid="work-description"
        className={`text-[15px] leading-[1.55] font-normal tracking-[-0.015em] text-[#9b9b9b] ${
          isExpanded ? "" : "line-clamp-3"
        }`}
      >
        {description}
      </p>
      {isOverflowing ? (
        <button
          type="button"
          aria-controls="work-description"
          aria-expanded={isExpanded}
          onClick={() => setIsExpanded((currentValue) => !currentValue)}
          className="mt-2 flex min-h-11 items-center text-[15px] leading-6 text-[#e5e5e5] underline decoration-[#e5e5e5] underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          {isExpanded ? t("detail.less") : t("detail.more")}
        </button>
      ) : null}
    </div>
  );
}
