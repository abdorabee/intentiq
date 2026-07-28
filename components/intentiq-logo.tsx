import Image from "next/image";
import vesperwiseLogo from "@/public/vesperwise-logo.png";

interface IntentIQLogoProps {
  className?: string;
  size?: number;
  variant?: "mark" | "wordmark";
}

export default function IntentIQLogo({ className, size = 24 }: IntentIQLogoProps) {
  const width = Math.round(size * 2.14);

  return (
    <Image
      src={vesperwiseLogo}
      width={width}
      height={size}
      className={className}
      alt=""
      aria-hidden
      style={{
        display: "block",
        flexShrink: 0,
        width,
        height: "auto",
      }}
    />
  );
}
