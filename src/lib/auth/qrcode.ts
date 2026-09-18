import QRCode from "qrcode";

/**
 * Generate standard, RFC/ISO compliant QR Code SVG for TOTP Authenticator URIs.
 * Fully compatible with Google Authenticator, Authy, Apple Keychain, Microsoft Authenticator & 1Password.
 */
export async function generateQrCodeSvg(text: string, size = 220): Promise<string> {
  try {
    const svgString = await QRCode.toString(text, {
      type: "svg",
      width: size,
      margin: 2,
      errorCorrectionLevel: "M",
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });
    return svgString;
  } catch (error) {
    console.error("Failed to generate QR code SVG:", error);
    throw error;
  }
}

/**
 * Generate Data URL (PNG/SVG) for fallback image rendering.
 */
export async function generateQrCodeDataUrl(text: string, size = 220): Promise<string> {
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      width: size,
      margin: 2,
      errorCorrectionLevel: "M",
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });
    return dataUrl;
  } catch (error) {
    console.error("Failed to generate QR code Data URL:", error);
    throw error;
  }
}
