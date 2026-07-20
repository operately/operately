defmodule OperatelyWeb.Api.Billing.CancelTest do
  use OperatelyWeb.TurboCase
  import Mock

  alias Operately.Billing

  describe "security" do
    setup :enable_instance_billing

    test "it requires authentication", ctx do
      assert {401, "Unauthorized"} = mutation(ctx.conn, [:billing, :cancel], %{})
    end

    test "it allows a company admin", ctx do
      ctx =
        ctx
        |> Factory.setup()
        |> Factory.add_company_admin(:admin)
        |> Factory.log_in_person(:admin)

      {:ok, _current_product} = create_active_product("prod_pro_monthly_admin", "team", "monthly")

      put_sequence(:customer_state_responses, [
        {:ok, active_subscription_payload("prod_pro_monthly_admin", %{"id" => "sub_cancel_admin"})},
        {:ok, active_subscription_payload("prod_pro_monthly_admin", %{"id" => "sub_cancel_admin", "cancel_at_period_end" => true})}
      ])

      with_mock Operately.Billing.Polar.Client, [:passthrough],
        get_customer_state_by_external_id: fn _company_id -> next_sequence(:customer_state_responses) end,
        update_subscription: fn "sub_cancel_admin", %{cancel_at_period_end: true} ->
          {:ok, %{"id" => "sub_cancel_admin"}}
        end do
        assert {200, res} = mutation(ctx.conn, [:billing, :cancel], %{})
        assert res.billing.account.cancel_at_period_end == true
      end
    end

    test "it rejects regular members", ctx do
      ctx =
        ctx
        |> Factory.setup()
        |> Factory.add_company_member(:member)
        |> Factory.log_in_person(:member)

      assert {403, _} = mutation(ctx.conn, [:billing, :cancel], %{})
    end

    test "it returns not found when billing is globally disabled", ctx do
      Application.put_env(:operately, :billing_enabled, false)

      ctx =
        ctx
        |> Factory.setup()
        |> Factory.log_in_person(:creator)

      assert {404, _} = mutation(ctx.conn, [:billing, :cancel], %{})
    end
  end

  describe "functionality" do
    setup :setup_owner_ctx

    test "it returns refreshed billing overview with cancel_at_period_end=true", ctx do
      {:ok, _current_product} = create_active_product("prod_pro_monthly", "team", "monthly")

      put_sequence(:customer_state_responses, [
        {:ok, active_subscription_payload("prod_pro_monthly", %{"id" => "sub_cancel"})},
        {:ok, active_subscription_payload("prod_pro_monthly", %{"id" => "sub_cancel", "cancel_at_period_end" => true})}
      ])

      with_mock Operately.Billing.Polar.Client, [:passthrough],
        get_customer_state_by_external_id: fn _company_id -> next_sequence(:customer_state_responses) end,
        update_subscription: fn "sub_cancel", %{cancel_at_period_end: true} ->
          {:ok, %{"id" => "sub_cancel"}}
        end do
        assert {200, res} = mutation(ctx.conn, [:billing, :cancel], %{})
        assert res.billing.account.cancel_at_period_end == true
      end
    end

    test "it returns not found when there is no live subscription", ctx do
      with_mock Operately.Billing.Polar.Client, [:passthrough],
        get_customer_state_by_external_id: fn _company_id -> {:error, :not_found} end,
        update_subscription: fn _subscription_id, _attrs -> flunk("unexpected update call") end do
        assert {404, _} = mutation(ctx.conn, [:billing, :cancel], %{})
      end
    end

    test "it returns provider failures", ctx do
      {:ok, _current_product} = create_active_product("prod_pro_monthly", "team", "monthly")

      with_mock Operately.Billing.Polar.Client, [:passthrough],
        get_customer_state_by_external_id: fn _company_id ->
          {:ok, active_subscription_payload("prod_pro_monthly", %{"id" => "sub_failure"})}
        end,
        update_subscription: fn "sub_failure", %{cancel_at_period_end: true} ->
          {:error, :internal_server_error}
        end do
        assert {500, _} = mutation(ctx.conn, [:billing, :cancel], %{})
      end
    end
  end

  defp enable_instance_billing(_ctx) do
    Application.put_env(:operately, :billing_enabled, true)
    on_exit(fn -> Application.delete_env(:operately, :billing_enabled) end)
    :ok
  end

  defp setup_owner_ctx(ctx) do
    enable_instance_billing(ctx)

    ctx =
      ctx
      |> Factory.setup()
      |> Factory.add_company_member(:member)
      |> Factory.log_in_person(:creator)

    {:ok, ctx}
  end

  defp create_active_product(polar_product_id, plan_family, billing_interval) do
    with {:ok, product} <-
           Billing.create_product(%{
             provider: "polar",
             plan_family: plan_family,
             billing_interval: billing_interval,
             polar_product_id: polar_product_id
           }),
         {:ok, product} <- Billing.set_active_product(product) do
      {:ok, product}
    end
  end

  defp active_subscription_payload(product_id, overrides) do
    subscription =
      %{
        "id" => "sub_test",
        "status" => "active",
        "product_id" => product_id,
        "current_period_end" => "2026-06-30T00:00:00Z",
        "cancel_at_period_end" => false
      }
      |> Map.merge(overrides)

    %{"subscriptions" => [subscription]}
  end

  defp put_sequence(key, values) do
    Process.put(key, values)
  end

  defp next_sequence(key) do
    case Process.get(key, []) do
      [value | rest] ->
        Process.put(key, rest)
        value

      [] ->
        flunk("No queued sequence value for #{inspect(key)}")
    end
  end
end
