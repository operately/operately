defmodule OperatelyWeb.Api.Analytics.SyncContextTest do
  use OperatelyWeb.TurboCase
  alias OperatelyWeb.Api.Analytics.SyncContext

  setup ctx do
    previous = Application.get_env(:operately, :conversion_analytics)
    Application.put_env(:operately, :conversion_analytics, enabled: false)
    ctx = Factory.setup(ctx)
    Application.put_env(:operately, :conversion_analytics, enabled: true, token: "test")
    on_exit(fn -> Application.put_env(:operately, :conversion_analytics, previous) end)
    token = Plug.CSRFProtection.get_csrf_token()

    conn =
      ctx.conn
      |> Plug.Test.init_test_session(%{"_csrf_token" => Plug.CSRFProtection.dump_state()})
      |> assign(:current_account, Operately.Repo.get!(Operately.People.Account, ctx.creator.account_id))
      |> put_req_header("origin", OperatelyWeb.Endpoint.url())
      |> put_req_header("x-csrf-token", token)

    {:ok, Map.put(ctx, :conn, conn)}
  end

  test "requires a same-origin browser session and valid CSRF token", %{conn: conn} do
    assert {:error, :forbidden} = SyncContext.call(delete_req_header(conn, "x-csrf-token"), %{})
    assert {:error, :forbidden} = SyncContext.call(put_req_header(conn, "origin", "https://evil.test"), %{})
    assert {:error, :forbidden} = SyncContext.call(assign(conn, :api_auth_mode, :api_token), %{})
    assert {:error, :forbidden} = SyncContext.call(assign(conn, :api_auth_mode, :mcp_oauth), %{})
  end

  test "preferences are sticky and account identity comes only from authentication", %{conn: conn} do
    assert {:ok, %{opted_out: true}} = SyncContext.call(conn, %{context: %{"preference" => "denied", "account_id" => Ecto.UUID.generate()}})
    assert {:ok, %{opted_out: true}} = SyncContext.call(conn, %{context: %{}})
    assert {:ok, %{opted_out: true}} = SyncContext.call(conn, %{context: %{"preference" => "granted"}})
  end

  test "the browser API round-trips JSON context and returns authenticated company UUID", %{conn: conn, company: company} do
    conn = log_in_account(conn, conn.assigns.current_account)
    assert {200, result} = mutation(conn, [:analytics, :sync_context], %{context: Jason.encode!(%{preference: "denied"})})
    assert result.opted_out
    assert result.company_id == company.id
    assert Jason.decode!(result.acquisition) == %{}
  end

  test "DNT overrides unsupported preference values", %{conn: conn} do
    assert {:ok, %{opted_out: true}} = SyncContext.call(put_req_header(conn, "dnt", "1"), %{context: %{"preference" => "granted"}})
  end
end
