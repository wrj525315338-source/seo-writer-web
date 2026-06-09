export function encodeProjectId(projectId: string): string {
  return encodeURIComponent(projectId);
}

export function decodeProjectId(projectId: string): string {
  try {
    return decodeURIComponent(projectId);
  } catch {
    return projectId;
  }
}
