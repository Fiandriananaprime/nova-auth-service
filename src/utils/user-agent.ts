import {UAParser} from "ua-parser-js";

export function parseUserAgent(userAgent: string) {
  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  const device =
    result.device.model ||
    result.device.type ||
    "Desktop";

  const browser =
    result.browser.name
      ? `${result.browser.name}${result.browser.version ? ` ${result.browser.version}` : ""}`
      : "Browser";

  const operatingSystem =
    result.os.name
      ? `${result.os.name}${result.os.version ? ` ${result.os.version}` : ""}`
      : "Operating System";

  return {
    device,
    browser,
    operatingSystem,
  };
}