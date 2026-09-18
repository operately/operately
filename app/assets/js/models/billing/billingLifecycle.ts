import Api, * as api from "@/api";
import { hashKey, useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import type { CompanyBillingPage as CompanyBillingPageTypes } from "turboui/CompanyBillingPage";

type BillingTarget = CompanyBillingPageTypes.BillingTarget;

type BillingSnapshotContext = {
  billingKey: ReturnType<typeof Api.billing.getQueryKey>;
  accessKey: ReturnType<typeof Api.billing.getAccessStateQueryKey>;
};

type BeginCheckoutResult =
  | { outcome: "missing_target" }
  | { outcome: "target_unavailable" }
  | { outcome: "session_created"; session: api.BillingCheckoutSession }
  | { outcome: "provider_error"; billing?: api.BillingOverview };

type ChangePlanResult =
  | { outcome: "missing_target" }
  | { outcome: "target_unavailable" }
  | { outcome: "billing_updated"; billing: api.BillingOverview }
  | { outcome: "provider_error"; billing?: api.BillingOverview };

type BillingMutationResult =
  | { outcome: "billing_updated"; billing: api.BillingOverview }
  | { outcome: "provider_error"; billing?: api.BillingOverview };

type BeginHostedSessionResult =
  | { outcome: "session_created"; session: api.BillingHostedSession }
  | { outcome: "provider_error"; billing?: api.BillingOverview };

export function useBillingActions() {
  const client = useQueryClient();
  const snapshotOptions = {
    onMutate: () => ({
      billingKey: Api.billing.getQueryKey({}),
      accessKey: Api.billing.getAccessStateQueryKey({}),
    }),
    onSuccess: (result: api.BillingGetResult, _input: unknown, context: BillingSnapshotContext | undefined) =>
      applyBillingSnapshot(client, result, context),
  };
  const { mutateAsync: refresh } = useMutation({ ...Api.billing.refreshMutationOptions(), ...snapshotOptions });
  const { mutateAsync: updatePlan } = useMutation({ ...Api.billing.changePlanMutationOptions(), ...snapshotOptions });
  const { mutateAsync: cancel } = useMutation({ ...Api.billing.cancelMutationOptions(), ...snapshotOptions });
  const { mutateAsync: reactivate } = useMutation({ ...Api.billing.reactivateMutationOptions(), ...snapshotOptions });
  const { mutateAsync: checkout } = useMutation<
    api.BillingCreateCheckoutSessionResult,
    Error,
    api.BillingCreateCheckoutSessionInput,
    ReturnType<typeof Api.billing.getQueryKey>
  >({
    ...Api.billing.createCheckoutSessionMutationOptions(),
    onMutate: () => Api.billing.getQueryKey({}),
    onSuccess: (_result, _input, key) => client.invalidateQueries({ queryKey: key, exact: true, refetchType: "none" }),
  });
  const { mutateAsync: paymentMethod } = useMutation(Api.billing.createPaymentMethodSessionMutationOptions());
  const { mutateAsync: portal } = useMutation(Api.billing.createCustomerPortalSessionMutationOptions());

  return useMemo(() => {
    async function refreshBilling(input: api.BillingRefreshInput = {}): Promise<api.BillingOverview> {
      return refresh(input).then((data) => data.billing);
    }

    async function beginCheckout(target: BillingTarget | null): Promise<BeginCheckoutResult> {
      if (!target) {
        return { outcome: "missing_target" };
      }

      if (!target.product) {
        return { outcome: "target_unavailable" };
      }

      return withBillingRefreshFallback(async () => {
        const session = await createCheckoutSession({
          plan: target.plan,
          billingInterval: target.billingInterval,
        });

        return { outcome: "session_created", session };
      });
    }

    async function changePlan(target: BillingTarget | null): Promise<ChangePlanResult> {
      if (!target) {
        return { outcome: "missing_target" };
      }

      if (!target.product) {
        return { outcome: "target_unavailable" };
      }

      return withBillingRefreshFallback(async () => {
        const result = await updatePlan({
          plan: target.plan,
          billingInterval: target.billingInterval,
        });

        return { outcome: "billing_updated", billing: result.billing };
      });
    }

    async function cancelSubscription(): Promise<BillingMutationResult> {
      return withBillingRefreshFallback(async () => {
        const result = await cancel({});
        return { outcome: "billing_updated", billing: result.billing };
      });
    }

    async function reactivateSubscription(): Promise<BillingMutationResult> {
      return withBillingRefreshFallback(async () => {
        const result = await reactivate({});
        return { outcome: "billing_updated", billing: result.billing };
      });
    }

    async function beginPaymentMethodSession(returnTo: string): Promise<BeginHostedSessionResult> {
      return withBillingRefreshFallback(async () => {
        const session = await createPaymentMethodSession({ returnTo });
        return { outcome: "session_created", session };
      });
    }

    async function beginCustomerPortalSession(returnTo: string): Promise<BeginHostedSessionResult> {
      return withBillingRefreshFallback(async () => {
        const session = await createCustomerPortalSession({ returnTo });
        return { outcome: "session_created", session };
      });
    }

    async function createCheckoutSession(
      input: api.BillingCreateCheckoutSessionInput,
    ): Promise<api.BillingCheckoutSession> {
      return checkout(input).then((data) => data.session);
    }

    async function createPaymentMethodSession(
      input: api.BillingCreatePaymentMethodSessionInput,
    ): Promise<api.BillingHostedSession> {
      return paymentMethod(input).then((data) => data.session);
    }

    async function createCustomerPortalSession(
      input: api.BillingCreateCustomerPortalSessionInput,
    ): Promise<api.BillingHostedSession> {
      return portal(input).then((data) => data.session);
    }

    async function withBillingRefreshFallback<T extends { outcome: string }>(
      operation: () => Promise<T>,
    ): Promise<T | { outcome: "provider_error"; billing?: api.BillingOverview }> {
      const key = Api.billing.getQueryKey({});
      try {
        return await operation();
      } catch {
        if (hashKey(key) !== hashKey(Api.billing.getQueryKey({}))) return { outcome: "provider_error" };
        try {
          const billing = await refreshBilling({});
          return { outcome: "provider_error", billing };
        } catch {
          return { outcome: "provider_error" };
        }
      }
    }

    return {
      refreshBilling,
      beginCheckout,
      changePlan,
      cancelSubscription,
      reactivateSubscription,
      beginPaymentMethodSession,
      beginCustomerPortalSession,
    };
  }, [refresh, updatePlan, cancel, reactivate, checkout, paymentMethod, portal]);
}

async function applyBillingSnapshot(
  client: QueryClient,
  result: api.BillingGetResult,
  context: BillingSnapshotContext | undefined,
) {
  if (!context) return;
  const { billingKey, accessKey } = context;

  // A read started before the mutation must not overwrite its confirmed result.
  await client.cancelQueries({ queryKey: billingKey, exact: true });

  client.setQueryData(billingKey, result);

  await client.invalidateQueries({
    queryKey: accessKey,
    exact: true,
    refetchType: hashKey(accessKey) === hashKey(Api.billing.getAccessStateQueryKey({})) ? "active" : "none",
  });
}
