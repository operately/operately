interface BillingTestHooks {
  captureExternalNavigation?: boolean;
  externalNavigations?: string[];
}

export function redirectToExternalBillingUrl(url: string) {
  const billingTestHooks = (window.__tests as { billing?: BillingTestHooks } | undefined)?.billing;

  if (billingTestHooks?.captureExternalNavigation) {
    billingTestHooks.externalNavigations = [...(billingTestHooks.externalNavigations || []), url];
    return;
  }

  window.location.assign(url);
}
