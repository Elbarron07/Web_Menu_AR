export interface QRCodeOptions {
  menuItemId: string;
  tableNumber?: string;
  baseUrl?: string;
}

export const generateQRCodeUrl = (options: QRCodeOptions): string => {
  const baseUrl = options.baseUrl || window.location.origin;
  const url = new URL(`${baseUrl}/ar/${options.menuItemId}`);
  
  if (options.tableNumber) {
    url.searchParams.set('table', options.tableNumber);
  }
  
  return url.toString();
};

export const downloadQRCode = (dataUrl: string, filename: string): void => {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
