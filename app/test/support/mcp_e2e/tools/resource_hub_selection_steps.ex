defmodule Operately.Support.McpE2E.Tools.ResourceHubSelectionSteps do
  use Operately.McpE2ECase

  step :given_two_hubs, ctx do
    ctx
    |> Factory.add_space(:space)
    |> Factory.fetch_default_resource_hub(:default_hub, :space)
    |> Factory.add_resource_hub(:other_hub, :space, :creator, name: "Design")
  end

  step :discover_hubs, ctx do
    payload = successful_call!(ctx, "list_resource_hubs", %{"space_id" => Paths.space_id(ctx.space)})
    hubs = payload["hubs"]

    assert length(hubs) == 2
    default = Enum.find(hubs, & &1["is_default"])
    selected = Enum.find(hubs, &(not &1["is_default"]))
    assert default["id"] == Paths.resource_hub_id(ctx.default_hub.id)
    assert selected["id"] == Paths.resource_hub_id(ctx.other_hub.id)
    assert selected["name"] == "Design"

    Map.put(ctx, :selected_hub_id, selected["id"])
  end

  step :create_and_list_folder_in_selected_hub, ctx do
    created = successful_call!(ctx, "create_folder", %{"resource_hub_id" => ctx.selected_hub_id, "name" => "Design assets"})
    assert created["resource_hub_id"] == ctx.selected_hub_id

    listed = successful_call!(ctx, "list_docs_and_files", %{"resource_hub_id" => ctx.selected_hub_id})
    assert listed["resource_hub_id"] == ctx.selected_hub_id
    assert [%{"folder" => %{"id" => folder_id}, "name" => "Design assets"}] = listed["nodes"]
    assert folder_id == created["folder"]["id"]

    ctx
  end

  step :assert_space_uses_default_hub, ctx do
    payload = successful_call!(ctx, "list_docs_and_files", %{"space_id" => Paths.space_id(ctx.space)})
    assert payload["resource_hub_id"] == Paths.resource_hub_id(ctx.default_hub.id)
    assert payload["nodes"] == []

    ctx
  end

  step :unset_default_hub, ctx do
    ctx.space |> Ecto.Changeset.change(default_resource_hub_id: nil) |> Repo.update!()
    ctx
  end

  step :assert_error_and_select_candidate, ctx do
    conn = call_tool(ctx.access_token, ctx.session_id, "list_docs_and_files", %{"space_id" => Paths.space_id(ctx.space)})
    assert conn.status == 200
    result = json_body(conn)["result"]
    assert result["isError"] == true
    error = result["structuredContent"]
    assert [%{"type" => "text", "text" => text}] = result["content"]
    assert Jason.decode!(text) == error
    assert error["details"]["code"] == "default_resource_hub_unavailable"
    assert error["message"] =~ "resource_hub_id"
    candidates = error["details"]["candidates"]
    assert length(candidates) == 2
    assert Enum.all?(candidates, &(&1["is_default"] == false))
    selected = Enum.find(candidates, &(&1["id"] == Paths.resource_hub_id(ctx.other_hub.id)))
    assert selected["name"] == "Design"

    Map.put(ctx, :selected_hub_id, selected["id"])
  end

  defp successful_call!(ctx, name, arguments) do
    conn = call_tool(ctx.access_token, ctx.session_id, name, arguments)
    assert conn.status == 200
    body = json_body(conn)
    assert %{"result" => result} = body
    refute result["isError"], inspect(result)
    result["structuredContent"]
  end
end
