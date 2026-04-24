"use client";

import React from "react";
import { trackLinkClick } from "@/app/actions/clicks";

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

export function Linkify({ text, sourcePage }: { text: string; sourcePage?: string }) {
  const parts = text.split(URL_REGEX);

  const handleClick = (url: string) => {
    trackLinkClick({
      target_url: url,
      link_type: "external",
      source_page: sourcePage || (typeof window !== "undefined" ? window.location.pathname : undefined),
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      referrer: typeof document !== "undefined" ? document.referrer : undefined,
    }).catch(() => {});
  };

  return (
    <>
      {parts.map((part, i) =>
        URL_REGEX.test(part) ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:underline break-all"
            onClick={() => handleClick(part)}
          >
            {part}
          </a>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}
