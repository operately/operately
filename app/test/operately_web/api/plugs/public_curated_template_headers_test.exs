defmodule OperatelyWeb.Api.Plugs.PublicCuratedTemplateHeadersTest do
  use OperatelyWeb.ConnCase, async: true
  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  @list "/api/v2/curated_templates/list"
  @get "/api/v2/curated_templates/get"

  setup ctx do
    ctx |> Factory.setup() |> Factory.add_curated_template(:template, published: true)
  end

  test "both queries support credential-free CORS and preflight", ctx do
    for path <- [@list, @get] do
      conn = get(ctx.conn, path, params(path, ctx.template))
      assert conn.status == 200
      assert get_resp_header(conn, "access-control-allow-origin") == ["*"]
      assert get_resp_header(conn, "access-control-allow-credentials") == []
      assert get_resp_header(conn, "access-control-expose-headers") == ["ETag"]
      assert get_resp_header(conn, "cache-control") == ["public, no-cache"]
      preflight = options(ctx.conn, path)
      assert response(preflight, 204) == ""
      assert get_resp_header(preflight, "access-control-allow-methods") == ["GET, OPTIONS"]
      assert get_resp_header(preflight, "access-control-allow-headers") == ["If-None-Match, Content-Type"]
    end
  end

  test "ETags revalidate both queries and change after live edits", ctx do
    for path <- [@list, @get] do
      params = params(path, ctx.template)
      first = get(ctx.conn, path, params)
      [etag] = get_resp_header(first, "etag")

      for header <- [etag, "W/" <> etag, "*", "\"other\", " <> etag] do
        cached = ctx.conn |> put_req_header("if-none-match", header) |> get(path, params)
        assert response(cached, 304) == ""
        assert get_resp_header(cached, "etag") == [etag]
      end

      current = Operately.CuratedTemplates.get(ctx.template.id)
      {:ok, _} = Operately.Operations.CuratedTemplateUpdating.run(current, ctx.account, current.updated_at, {:update, %{title: "Renamed #{path}"}})
      changed = ctx.conn |> put_req_header("if-none-match", etag) |> get(path, params)
      assert changed.status == 200
      refute get_resp_header(changed, "etag") == [etag]
    end
  end

  test "errors retain CORS but are not cached or converted to 304", ctx do
    for {path, params, status} <- [{@list, %{limit: 101}, 400}, {@get, %{id: "bad!"}, 404}] do
      conn = ctx.conn |> put_req_header("if-none-match", "*") |> get(path, params)
      assert conn.status == status
      assert get_resp_header(conn, "access-control-allow-origin") == ["*"]
      assert get_resp_header(conn, "etag") == []
      assert get_resp_header(conn, "cache-control") == ["no-store"]
    end
  end

  test "other API endpoints keep their authentication and headers", ctx do
    conn = get(ctx.conn, "/api/v2/goals/list")
    assert conn.status == 401
    assert get_resp_header(conn, "access-control-allow-origin") == []
    assert options(ctx.conn, "/api/v2/goals/list").status == 405
  end

  defp params(@list, _template), do: %{}
  defp params(@get, template), do: %{id: Paths.curated_template_id(template)}
end
