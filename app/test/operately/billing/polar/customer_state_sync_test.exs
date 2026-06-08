defmodule Operately.Billing.Polar.Operations.CustomerStateSyncTest.StubClient do
  def get_customer_state_by_external_id(company_id) do
    send(self(), {:stub_client_called, company_id})

    case Process.get({__MODULE__, :handler}) do
      nil -> raise "StubClient handler not configured"
      handler -> handler.(company_id)
    end
  end
end

defmodule Operately.Billing.Polar.Operations.CustomerStateSyncTest do
  use Operately.DataCase, async: true

  import ExUnit.CaptureLog

  alias Operately.Billing
  alias Operately.Billing.Polar.Operations.CustomerStateSync
  alias __MODULE__.StubClient

  setup do
    {:ok, Factory.setup(%{})}
  end

  describe "run/2" do
    test "normalizes a missing Polar customer to the free state", ctx do
      company_id = ctx.company.id

      put_client_response(fn company_id ->
        assert company_id == ctx.company.id
        {:error, :not_found}
      end)

      assert {:ok, account} = CustomerStateSync.run(ctx.company, client: StubClient)
      assert_received {:stub_client_called, ^company_id}

      assert account.provider == "polar"
      assert account.status == :free
      assert account.plan_key == nil
      assert account.billing_interval == nil
      assert account.cancel_at_period_end == false
      assert account.current_period_end == nil
      assert %DateTime{} = account.last_synced_at

      persisted = Billing.get_billing_account_by_company(ctx.company)
      assert persisted.id == account.id
    end

    test "prefers the active subscription payload and maps archived local products", ctx do
      {:ok, _product} =
        Billing.create_product(%{
          provider: "polar",
          plan_family: "team",
          billing_interval: "monthly",
          polar_product_id: "prod_pro_monthly",
          archived_at: ~U[2026-01-01 00:00:00Z]
        })

      {:ok, _other_product} =
        Billing.create_product(%{
          provider: "polar",
          plan_family: "business",
          billing_interval: "yearly",
          polar_product_id: "prod_business_yearly"
        })

      put_client_response(fn _company_id ->
        {:ok,
         %{
           "active_subscription" => %{
             "status" => "trialing",
             "product_id" => "prod_pro_monthly",
             "current_period_end" => "2026-06-30T00:00:00Z",
             "cancel_at_period_end" => false
           },
           "subscriptions" => [
             %{
               "status" => "canceled",
               "product_id" => "prod_business_yearly",
               "current_period_end" => "2026-12-31T00:00:00Z",
               "cancel_at_period_end" => true
             }
           ]
         }}
      end)

      assert {:ok, account} = CustomerStateSync.run(ctx.company, client: StubClient)

      assert account.status == :active
      assert account.plan_key == "team"
      assert account.billing_interval == :monthly
      assert account.current_period_end == ~U[2026-06-30 00:00:00Z]
      assert account.cancel_at_period_end == false
    end

    test "falls back to canceled paid subscriptions when no active subscription exists", ctx do
      {:ok, _product} =
        Billing.create_product(%{
          provider: "polar",
          plan_family: "business",
          billing_interval: "yearly",
          polar_product_id: "prod_business_yearly"
        })

      put_client_response(fn _company_id ->
        {:ok,
         %{
           "subscriptions" => [
             %{
               "status" => "canceled",
               "product_id" => "prod_business_yearly",
               "currentPeriodEnd" => "2026-12-31T00:00:00Z",
               "cancelAtPeriodEnd" => true
             }
           ]
         }}
      end)

      assert {:ok, account} = CustomerStateSync.run(ctx.company, client: StubClient)

      assert account.status == :canceled
      assert account.plan_key == "business"
      assert account.billing_interval == :yearly
      assert account.cancel_at_period_end == true
      assert account.current_period_end == ~U[2026-12-31 00:00:00Z]
    end

    test "keeps paid state and logs when the provider product is unknown locally", ctx do
      put_client_response(fn _company_id ->
        {:ok,
         %{
           "subscriptions" => [
             %{
               "status" => "active",
               "product_id" => "prod_unknown",
               "current_period_end" => "2026-06-30T00:00:00Z",
               "cancel_at_period_end" => false
             }
           ]
         }}
      end)

      log =
        capture_log(fn ->
          assert {:ok, account} = CustomerStateSync.run(ctx.company, client: StubClient)

          assert account.status == :active
          assert account.plan_key == nil
          assert account.billing_interval == nil
          assert account.current_period_end == ~U[2026-06-30 00:00:00Z]
        end)

      assert log =~ "Polar subscription product is missing from local billing catalog"
      assert log =~ ctx.company.id
      assert log =~ "prod_unknown"
    end

    test "maps provider pending updates into scheduled local billing fields", ctx do
      {:ok, _current_product} =
        Billing.create_product(%{
          provider: "polar",
          plan_family: "business",
          billing_interval: "yearly",
          polar_product_id: "prod_business_yearly"
        })

      {:ok, _scheduled_product} =
        Billing.create_product(%{
          provider: "polar",
          plan_family: "team",
          billing_interval: "yearly",
          polar_product_id: "prod_pro_yearly"
        })

      put_client_response(fn _company_id ->
        {:ok,
         %{
           "subscriptions" => [
             %{
               "id" => "sub_scheduled",
               "status" => "active",
               "product_id" => "prod_business_yearly",
               "current_period_end" => "2026-12-31T00:00:00Z",
               "cancel_at_period_end" => false,
               "pending_update" => %{"product_id" => "prod_pro_yearly"}
             }
           ]
         }}
      end)

      assert {:ok, account} = CustomerStateSync.run(ctx.company, client: StubClient)

      assert account.plan_key == "business"
      assert account.billing_interval == :yearly
      assert account.scheduled_plan_key == "team"
      assert account.scheduled_billing_interval == :yearly
      assert account.scheduled_change_effective_at == ~U[2026-12-31 00:00:00Z]
    end

    test "clears scheduled local fields when no provider pending update exists", ctx do
      {:ok, _current_product} =
        Billing.create_product(%{
          provider: "polar",
          plan_family: "team",
          billing_interval: "monthly",
          polar_product_id: "prod_pro_monthly"
        })

      {:ok, _account} =
        Billing.sync_billing_account(ctx.company, %{
          provider: "polar",
          plan_key: :team,
          billing_interval: :monthly,
          status: :active,
          scheduled_plan_key: :business,
          scheduled_billing_interval: :yearly,
          scheduled_change_effective_at: ~U[2026-12-31 00:00:00Z]
        })

      put_client_response(fn _company_id ->
        {:ok,
         %{
           "subscriptions" => [
             %{
               "id" => "sub_current",
               "status" => "active",
               "product_id" => "prod_pro_monthly",
               "current_period_end" => "2026-06-30T00:00:00Z",
               "cancel_at_period_end" => false
             }
           ]
         }}
      end)

      assert {:ok, account} = CustomerStateSync.run(ctx.company, client: StubClient)
      assert account.scheduled_plan_key == nil
      assert account.scheduled_billing_interval == nil
      assert account.scheduled_change_effective_at == nil
    end

    test "leaves scheduled fields nil and logs when the pending update product is unknown locally", ctx do
      {:ok, _current_product} =
        Billing.create_product(%{
          provider: "polar",
          plan_family: "team",
          billing_interval: "monthly",
          polar_product_id: "prod_pro_monthly"
        })

      put_client_response(fn _company_id ->
        {:ok,
         %{
           "subscriptions" => [
             %{
               "id" => "sub_unknown_pending",
               "status" => "active",
               "product_id" => "prod_pro_monthly",
               "current_period_end" => "2026-06-30T00:00:00Z",
               "cancel_at_period_end" => false,
               "pending_update" => %{"product_id" => "prod_business_yearly"}
             }
           ]
         }}
      end)

      log =
        capture_log(fn ->
          assert {:ok, account} = CustomerStateSync.run(ctx.company, client: StubClient)
          assert account.scheduled_plan_key == nil
          assert account.scheduled_billing_interval == nil
          assert account.scheduled_change_effective_at == nil
        end)

      assert log =~ "Polar pending subscription update product is missing from local billing catalog"
      assert log =~ ctx.company.id
      assert log =~ "prod_business_yearly"
    end

    test "returns provider errors without persisting local state", ctx do
      company_id = ctx.company.id

      put_client_response(fn _company_id ->
        {:error, :internal_server_error}
      end)

      assert {:error, :internal_server_error} = CustomerStateSync.run(ctx.company, client: StubClient)
      assert_received {:stub_client_called, ^company_id}
      assert Billing.get_billing_account_by_company(ctx.company) == nil
    end
  end

  defp put_client_response(handler) do
    Process.put({StubClient, :handler}, handler)
  end
end
