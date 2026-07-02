interface IntentIQLogoProps {
  className?: string;
  size?: number;
}

export default function IntentIQLogo({ className, size = 24 }: IntentIQLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      aria-hidden
    >
      <rect width="64" height="64" rx="12" fill="#DFFF00" />
      <path
        d="M13.5 19H24l7.9 25.4L39.9 19h10.6L37.2 48H26.8L13.5 19Z"
        fill="#000000"
      />
    </svg>
  );
}
