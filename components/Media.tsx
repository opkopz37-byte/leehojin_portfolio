import type { MediaItem } from "@/lib/projects";
import { asset } from "@/lib/asset";

export function Media({ item }: { item: MediaItem }) {
  if (item.type === "video") {
    return (
      <figure className="overflow-hidden rounded-xl border border-border bg-card">
        <video
          className="block w-full h-auto"
          src={asset(item.src)}
          poster={item.poster ? asset(item.poster) : undefined}
          controls
          playsInline
          preload="metadata"
          autoPlay={item.autoplay}
          muted={item.autoplay}
          loop={item.autoplay}
        />
        {item.caption && (
          <figcaption className="px-4 py-2 text-xs text-muted font-mono border-t border-border">
            {item.caption}
          </figcaption>
        )}
      </figure>
    );
  }

  return (
    <figure className="overflow-hidden rounded-xl border border-border bg-card">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={asset(item.src)}
        alt={item.alt}
        className="block w-full h-auto"
        loading="lazy"
        decoding="async"
      />
      {item.caption && (
        <figcaption className="px-4 py-2 text-xs text-muted font-mono border-t border-border">
          {item.caption}
        </figcaption>
      )}
    </figure>
  );
}

export function MediaGallery({ items }: { items: MediaItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
        <p className="font-mono text-xs text-muted mb-2">MEDIA</p>
        <p className="text-sm text-muted">
          영상과 이미지를 <code className="font-mono">public/work/&lt;slug&gt;/</code> 에
          넣고{" "}
          <code className="font-mono">lib/projects.ts</code>의{" "}
          <code className="font-mono">media</code> 배열에 추가하세요.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {items.map((m, i) => (
        <Media key={i} item={m} />
      ))}
    </div>
  );
}
