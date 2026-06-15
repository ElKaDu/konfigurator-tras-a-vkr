import { useState } from "react";
import { PlainToken } from "@/components/common/PlainToken";
import { cn } from "@/lib/utils";

type Mode = "same_repeats" | "specific";

export function TrackingAggregateEditor() {
  const [mode, setMode] = useState<Mode>("same_repeats");

  return (
    <div className="flex flex-col gap-3">
      {/* Segmented control */}
      <div className="inline-flex rounded-full border border-border p-0.5">
        <button
          type="button"
          onClick={() => setMode("same_repeats")}
          className={cn(
            "rounded-full px-3 py-1 text-xs transition-colors",
            mode === "same_repeats"
              ? "bg-primary text-primary-foreground font-medium"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          stejná hodnota se opakuje
        </button>
        <button
          type="button"
          onClick={() => setMode("specific")}
          className={cn(
            "rounded-full px-3 py-1 text-xs transition-colors",
            mode === "specific"
              ? "bg-primary text-primary-foreground font-medium"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          konkrétní = …
        </button>
      </div>

      {/* Plain-language sentence */}
      <p className="text-base leading-[2.2] text-foreground">
        Když se stejná hodnota pole{" "}
        <PlainToken chevron>Město záznamu</PlainToken>
        {mode === "specific" && (
          <>
            {" "}={" "}
            <PlainToken chevron>hodnota</PlainToken>
          </>
        )}{" "}
        objeví na více než <PlainToken>3</PlainToken>{" "}
        <PlainToken chevron>po sobě jdoucích</PlainToken> záznamech.
      </p>
    </div>
  );
}
