import fs from "node:fs";
import path from "node:path";

import Image from "next/image";

type ScreenshotFrameProps = {
  filename: string;
  alt: string;
  aspectClassName?: string;
  priority?: boolean;
};

// Renders a real Atlas screenshot (from public/marketing/<filename>) inside
// a minimal browser-chrome frame. Server Component — reads the filesystem
// directly to decide whether the file exists yet, so a missing screenshot
// degrades to a same-sized placeholder instead of breaking the build.
export function ScreenshotFrame({
  filename,
  alt,
  aspectClassName = "aspect-[16/10]",
  priority = false,
}: ScreenshotFrameProps) {
  const filePath = path.join(process.cwd(), "public", "marketing", filename);
  const exists = fs.existsSync(filePath);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl shadow-gray-900/5 dark:border-[#30363d] dark:bg-[#161b22]">
      <div className="flex items-center gap-1.5 border-b border-gray-100 bg-gray-50 px-3 py-2 dark:border-[#30363d] dark:bg-[#0d1117]">
        <div className="h-2 w-2 rounded-full bg-gray-300 dark:bg-[#3d444e]" />
        <div className="h-2 w-2 rounded-full bg-gray-300 dark:bg-[#3d444e]" />
        <div className="h-2 w-2 rounded-full bg-gray-300 dark:bg-[#3d444e]" />
      </div>

      <div
        className={`relative ${aspectClassName} bg-gray-50 dark:bg-[#0d1117]`}
      >
        {exists ? (
          <Image
            src={`/marketing/${filename}`}
            alt={alt}
            fill
            sizes="(min-width: 1024px) 640px, 100vw"
            className="object-cover object-top"
            priority={priority}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 p-6 text-center dark:border-[#30363d]">
            <p className="text-xs font-medium text-gray-400 dark:text-[#656d76]">
              Screenshot coming soon
            </p>
            <p className="font-mono text-[11px] text-gray-300 dark:text-[#3d444e]">
              public/marketing/{filename}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
