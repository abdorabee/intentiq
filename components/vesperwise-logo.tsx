import Image from "next/image";

import vesperwiseLogo from "@/public/vesperwise-logo.png";

interface VesperWiseLogoProps {
  className?: string;
  size?: number;
  variant?: "mark" | "wordmark";
}

export default function VesperWiseLogo({
  className,
  size = 24,
}: VesperWiseLogoProps) {
  const width = Math.round(size * 2.14);

  return (
    <Image
      src={vesperwiseLogo}
      width={width}
      height={size}
      className={className}
      alt="VesperWise"
      style={{
        display: "block",
        flexShrink: 0,
        width,
        height: "auto",
      }}
      priority
    />
  );
}
