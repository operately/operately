import i18n from "@/i18n";
import { encodeUrlParams } from "@/routes/paths";

export function contactUsLink(companyName: string, companyId: string) {
  const params = encodeUrlParams({
    body: i18n.t("\n\norg name: {{companyName}}\norg id: {{companyId}}\n\n", { companyName, companyId }),
  });

  return `mailto:support@operately.com${params}`;
}
