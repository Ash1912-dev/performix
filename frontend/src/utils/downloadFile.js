/**
 * Triggers a file download from a Blob response.
 * Creates a temporary object URL, clicks a hidden anchor, then revokes.
 */
export const downloadFile = (blob, filename) => {
  const url = window.URL.createObjectURL(new Blob([blob]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
