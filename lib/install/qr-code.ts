import QRCode from "qrcode";

export async function createInstallGuideQrDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    width: 280,
    margin: 2,
    color: { dark: "#2b6cb0", light: "#ffffff" },
    errorCorrectionLevel: "M",
  });
}
