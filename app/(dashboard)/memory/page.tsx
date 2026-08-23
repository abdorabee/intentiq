import { permanentRedirect } from "next/navigation";

export default function LegacyProfileRoute() {
  permanentRedirect("/settings/business-profile");
}
