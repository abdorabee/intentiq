import { permanentRedirect } from "next/navigation";

export default function ApiKeysPage() {
  permanentRedirect("/settings/developer");
}
