defmodule OperatelyWeb.Api.Billing.CreateCheckoutSessionTest do
  use OperatelyWeb.TurboCase
  import Mock

  alias Operately.Billing

  describe "security" do
    setup :enable_instance_billing

    test "it requires authentication", ctx do
      assert {401, "Unauthorized"} = mutation(ctx.conn, [:billing, :create_checkout_session], %{plan: "team", billing_interval: "monthly"})
    end

    test "it allows a company admin", ctx do
      ctx =
        ctx
        |> Factory.setup()
        |> Factory.enable_feature("billing")
        |> Factory.add_company_admin(:admin)
        |> Factory.log_in_person(:admin)

      {:ok, _product} = create_active_product("prod_pro_monthly_admin", "team", "monthly")

      with_mock Operately.Billing.Polar.Client, [:passthrough],
        get_customer_state_by_external_id: fn _company_id -> {:error, :not_found} end,
        create_checkout_session: fn attrs ->
          {:ok,
           %{
             "id" => "chk_admin",
             "url" => "https://polar.sh/example/checkout/admin",
             "return_url" => attrs[:return_url],
             "success_url" => attrs[:success_url],
             "expires_at" => "2026-08-31T00:00:00Z"
           }}
        end do
        assert {200, res} = mutation(ctx.conn, [:billing, :create_checkout_session], %{plan: "team", billing_interval: "monthly"})
        assert res.session.id == "chk_admin"
      end
    end

    test "it rejects regular members", ctx do
      ctx =
        ctx
        |> Factory.setup()
        |> Factory.enable_feature("billing")
        |> Factory.add_company_member(:member)
        |> Factory.log_in_person(:member)

      assert {403, _} = mutation(ctx.conn, [:billing, :create_checkout_session], %{plan: "team", billing_interval: "monthly"})
    end

    test "it returns not found when billing is disabled for the company", ctx do
      ctx =
        ctx
        |> Factory.setup()
        |> Factory.log_in_person(:creator)

      assert {404, _} = mutation(ctx.conn, [:billing, :create_checkout_session], %{plan: "team", billing_interval: "monthly"})
    end
  end

  describe "functionality" do
    setup :setup_owner_ctx

    test "it returns a checkout session and records pending checkout state", ctx do
      {:ok, _product} = create_active_product("prod_pro_monthly", "team", "monthly")

      with_mock Operately.Billing.Polar.Client, [:passthrough],
        get_customer_state_by_external_id: fn _company_id -> {:error, :not_found} end,
        create_checkout_session: fn attrs ->
          assert attrs[:products] == ["prod_pro_monthly"]
          assert attrs[:external_customer_id] == ctx.company.id

          {:ok,
           %{
             "id" => "chk_123",
             "url" => "https://polar.sh/example/checkout/123",
             "return_url" => attrs[:return_url],
             "success_url" => attrs[:success_url],
             "expires_at" => "2026-08-31T00:00:00Z"
           }}
        end do
        assert {200, res} = mutation(ctx.conn, [:billing, :create_checkout_session], %{plan: "team", billing_interval: "monthly"})

        assert res.session.provider == "polar"
        assert res.session.id == "chk_123"
        assert res.session.url == "https://polar.sh/example/checkout/123"
        assert String.ends_with?(res.session.return_url, "/#{Paths.company_id(ctx.company)}/admin/billing")
        assert String.ends_with?(res.session.success_url, "/#{Paths.company_id(ctx.company)}/admin/billing?checkout_id={CHECKOUT_ID}")
        assert res.session.expires_at == "2026-08-31T00:00:00Z"

        account = Billing.get_billing_account_by_company(ctx.company)
        assert account.pending_plan_key == "team"
        assert account.pending_billing_interval == :monthly
        assert account.pending_checkout_started_at != nil
      end
    end

    test "it rejects invalid inputs", ctx do
      assert {400, _} = mutation(ctx.conn, [:billing, :create_checkout_session], %{plan: "free", billing_interval: "monthly"})
      assert {400, _} = mutation(ctx.conn, [:billing, :create_checkout_session], %{plan: "team", billing_interval: "weekly"})
    end

    test "it returns not found when the requested target is not sellable", ctx do
      assert {404, _} = mutation(ctx.conn, [:billing, :create_checkout_session], %{plan: "team", billing_interval: "monthly"})
    end

    test "it rejects active paid companies", ctx do
      {:ok, _current_product} = create_active_product("prod_current_pro_monthly", "team", "monthly")
      {:ok, _target_product} = create_active_product("prod_business_yearly", "business", "yearly")

      with_mock Operately.Billing.Polar.Client, [:passthrough],
        get_customer_state_by_external_id: fn _company_id ->
          {:ok,
           %{
             "subscriptions" => [
               %{
                 "status" => "active",
                 "product_id" => "prod_current_pro_monthly",
                 "current_period_end" => "2026-06-30T00:00:00Z",
                 "cancel_at_period_end" => false
               }
             ]
           }}
        end,
        create_checkout_session: fn _attrs -> flunk("unexpected checkout session call") end do
        assert {400, _} = mutation(ctx.conn, [:billing, :create_checkout_session], %{plan: "business", billing_interval: "yearly"})
      end
    end

    test "it returns provider failures from Polar", ctx do
      {:ok, _product} = create_active_product("prod_pro_monthly", "team", "monthly")

      with_mock Operately.Billing.Polar.Client, [:passthrough],
        get_customer_state_by_external_id: fn _company_id -> {:error, :not_found} end,
        create_checkout_session: fn _attrs -> {:error, :internal_server_error} end do
        assert {500, _} = mutation(ctx.conn, [:billing, :create_checkout_session], %{plan: "team", billing_interval: "monthly"})
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
      |> Factory.enable_feature("billing")
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
end
