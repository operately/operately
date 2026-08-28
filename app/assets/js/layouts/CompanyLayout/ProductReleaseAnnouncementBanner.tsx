import * as React from "react";

import Api, { type ProductRelease } from "@/api";
import { useMe } from "@/contexts/CurrentCompanyContext";
import { ProductReleaseAnnouncement } from "turboui";

export async function persistDismissedProductRelease(id: string) {
  await Api.product_releases.dismiss({ id });
}

export function ProductReleaseAnnouncementBanner({ productRelease }: { productRelease: ProductRelease | null }) {
  const me = useMe();
  const [hidden, setHidden] = React.useState(false);

  if (hidden || !productRelease?.id) {
    return null;
  }

  if (productRelease.id === me?.dismissedProductReleaseId) {
    return null;
  }

  const releaseId = productRelease.id;

  const onDismiss = async () => {
    await persistDismissedProductRelease(releaseId);
    setHidden(true);
  };

  return (
    <ProductReleaseAnnouncement
      release={{
        id: productRelease.id,
        title: productRelease.title,
        publishedAt: productRelease.publishedAt,
        teaser: productRelease.teaser ?? undefined,
      }}
      onDismiss={onDismiss}
    />
  );
}
