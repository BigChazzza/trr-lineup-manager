/**
 * Helper function to display user's server nickname, falling back to username
 * @param user - User object with server_nickname and username
 * @returns Display name
 */
export function getDisplayName(user: { server_nickname?: string | null; username: string } | null | undefined): string {
  if (!user) return 'Unknown User'
  return user.server_nickname || user.username
}
