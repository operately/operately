export const PRODUCT_RELEASES_PAGE_URL = "https://operately.com/releases/";

export interface ProductRelease {
  id: string;
  title: string;
  publishedAt: string;
  teaser?: string;
}
