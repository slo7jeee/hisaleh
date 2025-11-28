export const getProfileUrl = (username: string): string => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/user/${username}`;
};

export const copyProfileUrl = (username: string): Promise<void> => {
  const url = getProfileUrl(username);
  return navigator.clipboard.writeText(url);
};

export const getProjectUrl = (projectId: string): string => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/project/${projectId}`;
};

export const copyProjectUrl = (projectId: string): Promise<void> => {
  const url = getProjectUrl(projectId);
  return navigator.clipboard.writeText(url);
};
