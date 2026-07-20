defmodule OperatelyWeb.Api.Billing.CreatePaymentMethodSessionTest do
  use OperatelyWeb.TurboCase
  import Mock

  alias Operately.Billing

  describe "security" do
    setup :enable_instance_billing

    test "it requires authentication", ctx do
      assert {401, "Unauthorized"} = mutation(ctx.conn, [:billing, :create_payment_method_session], %{})
    end

    test "it allows a company admin", ctx do
      ctx =
        ctx
        |> Factory.setup()
        |> Factory.add_company_admin(:admin)
        |> Factory.log_in_person(:admin)

      {:ok, _product} = create_product("prod_pro_monthly_admin", "team", "monthly")

      with_mock Operately.Billing.Polar.Client, [:passthrough],
        get_customer_state_by_external_id: fn _company_id ->
          {:ok, active_subscription_payload("prod_pro_monthly_admin")}
        end,
        create_customer_session: fn _external_customer_id, return_url ->
          {:ok,
           %{
             "customer_portal_url" => "https://polar.sh/example/portal/payment-method-admin",
             "return_url" => return_url,
             "expires_at" => "2026-06-30T00:00:00Z"
           }}
        end do
        assert {200, res} = mutation(ctx.conn, [:billing, :create_payment_method_session], %{})
        assert res.session.url == "https://polar.sh/example/portal/payment-method-admin"
      end
    end

    test "it rejects regular members", ctx do
      ctx =
        ctx
        |> Factory.setup()
        |> Factory.add_company_member(:member)
        |> Factory.log_in_person(:member)

      assert {403, _} = mutation(ctx.conn, [:billing, :create_payment_method_session], %{})
    end

    test "it returns not found when billing is globally disabled", ctx do
      Application.put_env(:operately, :billing_enabled, false)

      ctx =
        ctx
        |> Factory.setup()
        |> Factory.log_in_person(:creator)

      assert {404, _} = mutation(ctx.conn, [:billing, :create_payment_method_session], %{})
    end
  end

  describe "functionality" do
    setup :setup_owner_ctx

    test "it returns a hosted payment-method session", ctx do
      {:ok, _product} = create_product("prod_pro_monthly", "team", "monthly")

      with_mock Operately.Billing.Polar.Client, [:passthrough],
        get_customer_state_by_external_id: fn _company_id ->
          {:ok, active_subscription_payload("prod_pro_monthly")}
        end,
        create_customer_session: fn _external_customer_id, return_url ->
          {:ok,
           %{
             "customer_portal_url" => "https://polar.sh/example/portal/payment-method",
             "return_url" => return_url,
             "expires_at" => "2026-06-30T00:00:00Z"
           }}
        end do
        assert {200, res} = mutation(ctx.conn, [:billing, :create_payment_method_session], %{})

        assert res.session.provider == "polar"
        assert res.session.url == "https://polar.sh/example/portal/payment-method"
        assert String.ends_with?(res.session.return_url, "/#{Paths.company_id(ctx.company)}/admin")
        assert res.session.expires_at == "2026-06-30T00:00:00Z"
      end
    end

    test "it rejects invalid return paths", ctx do
      assert {400, _} = mutation(ctx.conn, [:billing, :create_payment_method_session], %{return_to: "https://example.com"})
      assert {400, _} = mutation(ctx.conn, [:billing, :create_payment_method_session], %{return_to: "//example.com"})
      assert {400, _} = mutation(ctx.conn, [:billing, :create_payment_method_session], %{return_to: "admin"})
    end

    test "it rejects companies without a paid Polar customer", ctx do
      with_mock Operately.Billing.Polar.Client, [:passthrough],
        get_customer_state_by_external_id: fn _company_id -> {:error, :not_found} end,
        create_customer_session: fn _external_customer_id, _return_url -> flunk("unexpected customer session call") end do
        assert {404, _} = mutation(ctx.conn, [:billing, :create_payment_method_session], %{})
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

  defp create_product(polar_product_id, plan_family, billing_interval) do
    Billing.create_product(%{
      provider: "polar",
      plan_family: plan_family,
      billing_interval: billing_interval,
      polar_product_id: polar_product_id
    })
  end

  defp active_subscription_payload(product_id, overrides \\ %{}) do
    subscription =
      %{
        "status" => "active",
        "product_id" => product_id,
        "current_period_end" => "2026-06-30T00:00:00Z",
        "cancel_at_period_end" => false
      }
      |> Map.merge(overrides)

    %{"subscriptions" => [subscription]}
  end
end
