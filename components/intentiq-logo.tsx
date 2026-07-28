import Image from "next/image";
import vesperwiseLogo from "@/public/vesperwise-logo.png";

interface IntentIQLogoProps {
  className?: string;
  size?: number;
  variant?: "mark" | "wordmark";
}

export default function IntentIQLogo({ className, size = 24 }: IntentIQLogoProps) {
  return (
    <Image
      src={vesperwiseLogo}
      width={Math.round(size * 2.14)}
      height={size}
      className={className}
      alt=""
      aria-hidden
      unoptimized
      style={{
        display: "block",
        flexShrink: 0,
        height: size,
        width: "auto",
      }}
    />
  );
}
