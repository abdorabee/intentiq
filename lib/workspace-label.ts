export function getWorkspaceLabel(opts: {
  fullName?: string | null;
  email?: string | null;
}): string {
  const fullName = opts.fullName?.trim();
  if (fullName) return fullName;

  const localPart = opts.email?.split("@")[0]?.trim();
  if (localPart) return localPart;

  return "Workspace";
}
