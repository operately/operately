import * as React from "react";

import { type ProductRelease } from "@/api";
import { useMe } from "@/contexts/CurrentCompanyContext";
import { useDismissProductRelease } from "@/models/productReleases/productReleaseLifecycle";
import { ProductReleaseAnnouncement } from "turboui";

export function ProductReleaseAnnouncementBanner({ productRelease }: { productRelease: ProductRelease | null }) {
  const me = useMe();
  const [hidden, setHidden] = React.useState(false);
  const dismissProductRelease = useDismissProductRelease();

  if (hidden || !productRelease?.id) {
    return null;
  }

  if (productRelease.id === me?.dismissedProductReleaseId) {
    return null;
  }

  const releaseId = productRelease.id;

  const onDismiss = async () => {
    await dismissProductRelease.mutateAsync({ id: releaseId });
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
