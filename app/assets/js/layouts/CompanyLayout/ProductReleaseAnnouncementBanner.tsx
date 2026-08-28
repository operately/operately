import * as React from "react";

import Api from "@/api";
import { useMe } from "@/contexts/CurrentCompanyContext";
import { useCompanyLoaderData } from "@/routes/useCompanyLoaderData";
import { ProductReleaseAnnouncement } from "turboui";

export async function persistDismissedProductRelease(id: string) {
  await Api.product_releases.dismiss({ id });
}

export function ProductReleaseAnnouncementBanner() {
  const { productRelease } = useCompanyLoaderData();
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
