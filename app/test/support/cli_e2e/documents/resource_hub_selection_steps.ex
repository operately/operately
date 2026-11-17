defmodule Operately.Support.CliE2E.Documents.ResourceHubSelectionSteps do
  use Operately.Support.CliE2E

  alias Operately.Support.CliE2E.Documents.HubScopeSteps
  alias OperatelyWeb.Paths

  step :setup, ctx do
    ctx
    |> HubScopeSteps.setup_base()
    |> Factory.add_resource_hub(:other_hub, :engineering, :creator, name: "Design")
  end

  step :discover_hubs, ctx do
    payload = command!(ctx, ["list_hubs", "--space-id", ctx.engineering.id])
    hubs = payload["hubs"]

    assert length(hubs) == 2
    default = Enum.find(hubs, & &1["is_default"])
    selected = Enum.find(hubs, &(not &1["is_default"]))
    assert default["id"] == Paths.resource_hub_id(ctx.resource_hub.id)
    assert selected["id"] == Paths.resource_hub_id(ctx.other_hub.id)
    assert selected["name"] == "Design"

    Map.put(ctx, :selected_hub_id, selected["id"])
  end

  step :create_and_list_folder_in_selected_hub, ctx do
    created = command!(ctx, ["create_folder", "--resource-hub-id", ctx.selected_hub_id, "--name", "Design assets"])
    assert created["resource_hub_id"] == ctx.selected_hub_id

    listed = command!(ctx, ["list_contents", "--resource-hub-id", ctx.selected_hub_id])
    assert listed["resource_hub_id"] == ctx.selected_hub_id
    assert [%{"folder" => %{"id" => folder_id}, "name" => "Design assets"}] = listed["nodes"]
    assert folder_id == created["folder"]["id"]

    ctx
  end

  step :assert_space_uses_default_hub, ctx do
    payload = command!(ctx, ["list_contents", "--space-id", ctx.engineering.id])
    assert payload["resource_hub_id"] == Paths.resource_hub_id(ctx.resource_hub.id)
    assert payload["nodes"] == []

    ctx
  end

  step :unset_default_hub, ctx do
    ctx.engineering |> Ecto.Changeset.change(default_resource_hub_id: nil) |> Repo.update!()
    ctx
  end

  step :assert_error_and_select_candidate, ctx do
    result = run_cli(ctx, ["documents", "list_contents", "--space-id", ctx.engineering.id])
    assert result.exit_code == 4, result.output
    assert result.output =~ "API request failed (400): "
    [_, json] = String.split(result.output, "API request failed (400): ", parts: 2)
    error = Jason.decode!(String.trim(json))

    assert error["details"]["code"] == "default_resource_hub_unavailable"
    assert error["message"] =~ "resource_hub_id"
    candidates = error["details"]["candidates"]
    assert length(candidates) == 2
    assert Enum.all?(candidates, &(&1["is_default"] == false))
    selected = Enum.find(candidates, &(&1["id"] == Paths.resource_hub_id(ctx.other_hub.id)))
    assert selected["name"] == "Design"

    Map.put(ctx, :selected_hub_id, selected["id"])
  end

  step :create_collection, ctx do
    created = command!(ctx, ["create_hub", "--space-id", ctx.engineering.id, "--name", "Lifecycle"])
    Map.put(ctx, :collection_id, created["hub"]["id"])
  end

  step :rename_collection, ctx do
    command!(ctx, ["rename_hub", "--resource-hub-id", ctx.collection_id, "--new-name", "Reference"])
    listed = command!(ctx, ["list_hubs", "--space-id", ctx.engineering.id])
    assert Enum.map(listed["hubs"], & &1["id"]) == [Paths.resource_hub_id(ctx.resource_hub.id), Paths.resource_hub_id(ctx.other_hub.id), ctx.collection_id]
    assert Enum.find(listed["hubs"], &(&1["id"] == ctx.collection_id))["name"] == "Reference"
    ctx
  end

  step :add_folder_to_collection, ctx do
    folder = command!(ctx, ["create_folder", "--resource-hub-id", ctx.collection_id, "--name", "Keep me"])
    Map.put(ctx, :collection_folder_id, folder["folder"]["id"])
  end

  step :assert_default_collection_cannot_be_deleted, ctx do
    rejected = run_cli(ctx, ["documents", "delete_hub", "--resource-hub-id", Paths.resource_hub_id(ctx.resource_hub.id)])
    assert rejected.exit_code == 4
    assert rejected.output =~ "default_resource_hub_deletion_forbidden"
    ctx
  end

  step :assert_nonempty_collection_cannot_be_deleted, ctx do
    rejected = run_cli(ctx, ["documents", "delete_hub", "--resource-hub-id", ctx.collection_id])
    assert rejected.exit_code == 4
    assert rejected.output =~ "resource_hub_not_empty"
    ctx
  end

  step :delete_collection_folder, ctx do
    command!(ctx, ["delete_folder", "--folder-id", ctx.collection_folder_id])
    ctx
  end

  step :delete_collection, ctx do
    assert command!(ctx, ["delete_hub", "--resource-hub-id", ctx.collection_id])["success"]
    ctx
  end

  step :assert_collection_deleted_and_default_preserved, ctx do
    remaining = command!(ctx, ["list_hubs", "--space-id", ctx.engineering.id])
    assert Enum.map(remaining["hubs"], & &1["id"]) == [Paths.resource_hub_id(ctx.resource_hub.id), Paths.resource_hub_id(ctx.other_hub.id)]
    assert Enum.find(remaining["hubs"], & &1["is_default"])["id"] == Paths.resource_hub_id(ctx.resource_hub.id)
    ctx
  end

  defp command!(ctx, args) do
    result = run_cli(ctx, ["documents" | args])
    assert result.exit_code == 0, result.output
    Jason.decode!(result.output)
  end
end
