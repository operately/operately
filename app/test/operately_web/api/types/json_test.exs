defmodule OperatelyWeb.Api.Types.JsonTest do
  use ExUnit.Case, async: true

  alias OperatelyWeb.Api.Types.Json
  alias TurboConnect.Plugs.ParseInputs

  test "decodes a JSON string" do
    assert Json.decode(~s({"type":"doc","content":[]})) == {:ok, %{"type" => "doc", "content" => []}}
  end

  test "accepts nil" do
    assert Json.decode(nil) == {:ok, nil}
  end

  test "invalid JSON returns a bad request response when parsing task inputs" do
    conn = parse_task_description("value")

    assert conn.status == 400
    assert conn.halted
    assert Jason.decode!(conn.resp_body) == %{"error" => "Bad request", "message" => "Invalid JSON format"}
  end

  test "a non-string description returns a bad request response when parsing task inputs" do
    conn = parse_task_description(%{"type" => "doc", "content" => []})

    assert conn.status == 400
    assert conn.halted
    assert Jason.decode!(conn.resp_body) == %{"error" => "Bad request", "message" => "Content must be a string or nil"}
  end

  defp parse_task_description(description) do
    Plug.Test.conn(:post, "/api/external/v1/tasks/create", %{"description" => description})
    |> Plug.Conn.assign(:turbo_req_handler, OperatelyWeb.Api.Tasks.Create)
    |> Plug.Conn.assign(:turbo_api, OperatelyWeb.Api.External)
    |> Plug.Conn.assign(:turbo_req_type, :mutation)
    |> ParseInputs.call([])
  end
end
