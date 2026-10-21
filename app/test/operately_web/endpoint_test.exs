defmodule OperatelyWeb.EndpointTest do
  use OperatelyWeb.ConnCase, async: false

  import Mock
  import ExUnit.CaptureLog
  alias Operately.Support.Factory

  setup ctx do
    ctx = Factory.setup(ctx)
    Map.put(ctx, :conn, log_in_account(ctx.conn, ctx.account, ctx.company))
  end

  for {stage, module, function, arity} <- [
        {:account, Operately.People, :get_account_by_session_token, 1},
        {:company, Operately.Companies.Company, :get, 2},
        {:billing, Operately.Billing, :attach_access_state, 1},
        {:person, Operately.People, :get_person, 2},
        {:locale, Operately.I18n.EffectiveLanguage, :resolve, 1}
      ] do
    test "returns JSON 503 when #{stage} lookup fails before dispatch", %{conn: conn} do
      failure = failure_function(unquote(arity))

      with_mock unquote(module), [:passthrough], [{unquote(function), failure}] do
        assert_json_unavailable(fn -> get(conn, "/api/v2/get_theme") end)
      end
    end
  end

  test "returns JSON 503 for external API token lookup failures" do
    conn = build_conn() |> put_req_header("authorization", "Bearer test-token")

    with_mock Operately.People, [:passthrough], authenticate_api_token: failure_function(1) do
      assert_json_unavailable(fn -> get(conn, "/api/external/v1/people/get_me") end)
    end
  end

  test "external endpoint exceptions escape dispatch", ctx do
    ctx = Factory.add_api_token(ctx, :token, :creator)
    conn = build_conn() |> put_req_header("authorization", "Bearer #{ctx.token}")

    with_mock OperatelyWeb.Api.People.GetMe, [:passthrough], call: failure_function(2) do
      assert_json_unavailable(fn -> get(conn, "/api/external/v1/people/get_me") end)
    end
  end

  test "admin authentication failures return JSON 503", %{conn: conn} do
    with_mock Operately.People, [:passthrough], get_account_by_session_token: failure_function(1) do
      assert_json_unavailable(fn -> get(conn, "/admin/api/v1/get_companies") end)
    end
  end

  test "admin endpoint exceptions escape dispatch", %{conn: conn, account: account} do
    account |> Ecto.Changeset.change(site_admin: true) |> Operately.Repo.update!()

    with_mock OperatelyEE.AdminApi.Queries.GetCompanies, [:passthrough], call: failure_function(2) do
      assert_json_unavailable(fn -> get(conn, "/admin/api/v1/get_companies") end)
    end
  end

  test "internal endpoint exceptions escape dispatch", %{conn: conn} do
    with_mock OperatelyWeb.Api.Queries.GetTheme, [:passthrough], call: failure_function(2) do
      assert_json_unavailable(fn -> get(conn, "/api/v2/get_theme") end)
    end
  end

  test "response enrichment failures return JSON 503", %{conn: conn} do
    with_mock OperatelyWeb.Api.RichContent.Preparation, [:passthrough], prepare_response: failure_function(2) do
      assert_json_unavailable(fn -> get(conn, "/api/v2/get_theme") end)
    end
  end

  test "input preparation failures return JSON 503", %{conn: conn} do
    with_mock OperatelyWeb.Api.RichContent.Preparation, [:passthrough], prepare_inputs: failure_function(2) do
      assert_json_unavailable(fn -> get(conn, "/api/v2/get_theme") end)
    end
  end

  test "preserves the resolved language in API errors", %{conn: conn} do
    with_mocks [
      {Operately.I18n.EffectiveLanguage, [:passthrough], [resolve: fn _ -> "pt-BR" end]},
      {OperatelyWeb.Api.Queries.GetTheme, [:passthrough], [call: failure_function(2)]}
    ] do
      capture_log(fn ->
        {503, _, body} = assert_error_sent(503, fn -> get(conn, "/api/v2/get_theme") end)
        assert Jason.decode!(body)["message"] == "O serviço está temporariamente indisponível. Tente novamente."
      end)
    end
  end

  test "preserves unrelated authentication failures as 500", %{conn: conn} do
    with_mock Operately.People, [:passthrough], get_account_by_session_token: fn _ -> raise RuntimeError, "unrelated" end do
      capture_log(fn -> assert_error_sent(500, fn -> get(conn, "/api/v2/get_theme") end) end)
    end
  end

  test "preserves successful requests", %{conn: conn} do
    assert get(conn, "/api/v2/get_theme").status == 200
  end

  test "browser authentication failures return HTML 503", %{conn: conn} do
    with_mock Operately.People, [:passthrough], get_account_by_session_token: failure_function(1) do
      assert_html_unavailable(fn -> get(conn, "/") end)
    end
  end

  test "database-backed page controller failures return HTML 503" do
    with_mock Operately.Setup, [:passthrough], configured?: failure_function(0) do
      assert_html_unavailable(fn -> get(build_conn(), "/") end)
    end
  end

  test "MCP authentication failures use HTTP JSON 503 before tool execution" do
    conn = build_conn() |> put_req_header("authorization", "Bearer test-token")

    with_mock Operately.Mcp, [:passthrough], authenticate_access_token: failure_function(2) do
      assert_json_unavailable(fn -> post(conn, "/mcp", %{}) end)
    end
  end

  test "retains the original exception and stack for Sentry capture", %{conn: conn} do
    test_pid = self()
    error = queue_error()

    with_mocks [
      {OperatelyWeb.Api.Queries.GetTheme, [:passthrough], [call: fn _, _ -> raise error end]},
      {Sentry, [:passthrough],
       [
         capture_exception: fn exception, opts ->
           send(test_pid, {:captured, exception, opts})
           {:ok, "event"}
         end
       ]}
    ] do
      assert_json_unavailable(fn -> get(conn, "/api/v2/get_theme") end)
      assert_received {:captured, ^error, opts}
      assert opts[:stacktrace] != []
      refute_received {:captured, _, _}
    end
  end

  test "preserves unrelated errors and authorization responses", %{conn: conn} do
    with_mock OperatelyWeb.Api.Queries.GetTheme, [:passthrough], call: fn _, _ -> raise RuntimeError, "unrelated" end do
      capture_log(fn -> assert get(conn, "/api/v2/get_theme").status == 500 end)
    end

    assert get(build_conn(), "/api/external/v1/people/get_me").status == 401
    assert get(conn, "/admin/api/v1/get_companies").status == 401
  end

  test "preserves a sent response even when the wrapped connection is stale", %{conn: conn} do
    with_mock OperatelyWeb.PageController, [:passthrough],
      index: fn conn, _ ->
        send_resp(conn, 200, "already sent")
        raise queue_error()
      end do
      capture_log(fn ->
        assert {200, _, "already sent"} = assert_error_sent(200, fn -> get(conn, "/") end)
        refute_received {_, {_, _, _}}
      end)
    end
  end

  test "preserves a chunked response and reraises the original failure", %{conn: conn} do
    with_mock OperatelyWeb.PageController, [:passthrough],
      index: fn conn, _ ->
        send_chunked(conn, 200)
        raise queue_error()
      end do
      capture_log(fn ->
        error = assert_raise DBConnection.ConnectionError, fn -> get(conn, "/") end
        assert error.reason == :queue_timeout
        assert_received {:plug_conn, :sent}
        refute_received {_, {_, _, _}}
      end)
    end
  end

  defp assert_json_unavailable(request) do
    capture_log(fn ->
      {503, headers, body} = assert_error_sent(503, request)
      assert {"content-type", "application/json; charset=utf-8"} in headers
      assert {"cache-control", "no-store"} in headers
      refute List.keymember?(headers, "retry-after", 0)
      assert Jason.decode!(body)["code"] == "database_connection_queue_timeout"
      refute body =~ "sensitive"
    end)
  end

  defp assert_html_unavailable(request) do
    capture_log(fn ->
      {503, headers, body} = assert_error_sent(503, request)
      assert {"content-type", "text/html; charset=utf-8"} in headers
      assert {"cache-control", "no-store"} in headers
      assert body == "The service is temporarily unavailable. Please try again."
    end)
  end

  defp queue_error, do: %DBConnection.ConnectionError{reason: :queue_timeout, message: "sensitive diagnostic"}
  defp failure_function(0), do: fn -> raise queue_error() end
  defp failure_function(1), do: fn _ -> raise queue_error() end
  defp failure_function(2), do: fn _, _ -> raise queue_error() end
end
