defmodule Operately.Support.CliE2E.ResourceHubs.CommandsSteps do
  use Operately.Support.CliE2E

  alias Operately.ResourceHubs
  alias Operately.ResourceHubs.File, as: ResourceHubFile
  alias Operately.ResourceHubs.Folder
  alias Operately.Support.CliE2E.Helpers
  alias OperatelyWeb.Paths

  step :setup, ctx do
    previous = Helpers.enable_auth_methods()

    on_exit(fn ->
      Helpers.restore_auth_methods(previous)
    end)

    ctx = Factory.setup(ctx)
    ctx = Factory.add_space(ctx, :engineering, company_id: ctx.company.id)
    ctx = Factory.add_resource_hub(ctx, :resource_hub, :engineering, :creator)
    ctx = Factory.add_file(ctx, :hub_file, :resource_hub)
    ctx = Factory.add_api_token(ctx, :api_token, :creator, read_only: false)

    result =
      run_cli(ctx, [
        "auth",
        "login",
        "--token",
        ctx.api_token,
        "--base-url",
        ctx.cli_base_url,
        "--profile",
        "e2e"
      ])

    ctx
    |> Map.put(:cli_result, result)
    |> Map.put(:profile, "e2e")
  end

  step :setup_folder, ctx do
    ctx = Factory.add_folder(ctx, :folder, :resource_hub)

    Map.put(ctx, :folder_id, ctx.folder.id)
  end

  step :get_resource_hub, ctx do
    result =
      run_cli(ctx, [
        "resource_hubs",
        "get",
        "--id",
        ctx.resource_hub.id
      ])

    payload = assert_cli_success!(result)

    assert payload["resource_hub"]["id"]

    {:ok, hub_id} = OperatelyWeb.Api.Helpers.decode_id(payload["resource_hub"]["id"])
    assert hub_id == ctx.resource_hub.id

    Map.put(ctx, :cli_result, result)
  end

  step :create_folder, ctx do
    result =
      run_cli(ctx, [
        "resource_hubs",
        "create_folder",
        "--resource-hub-id",
        ctx.resource_hub.id,
        "--name",
        "CLI folder"
      ])

    payload = assert_cli_success!(result)
    folder_payload = payload["folder"]

    assert is_map(folder_payload)
    assert folder_payload["id"]

    {:ok, folder_id} = OperatelyWeb.Api.Helpers.decode_id(folder_payload["id"])
    folder = Repo.get!(Folder, folder_id)

    assert ResourceHubs.list_folders(ctx.resource_hub) |> Enum.any?(&(&1.id == folder_id))

    ctx
    |> Map.put(:cli_result, result)
    |> Map.put(:folder, folder)
    |> Map.put(:folder_id, folder_id)
  end

  step :get_folder, ctx do
    result =
      run_cli(ctx, [
        "resource_hubs",
        "get_folder",
        "--id",
        ctx.folder_id
      ])

    payload = assert_cli_success!(result)

    assert payload["folder"]["id"]

    {:ok, folder_id} = OperatelyWeb.Api.Helpers.decode_id(payload["folder"]["id"])
    assert folder_id == ctx.folder_id

    Map.put(ctx, :cli_result, result)
  end

  step :list_nodes, ctx do
    result =
      run_cli(ctx, [
        "resource_hubs",
        "list_nodes",
        "--resource-hub-id",
        ctx.resource_hub.id
      ])

    payload = assert_cli_success!(result)

    assert is_list(payload["nodes"])
    assert is_list(payload["draft_nodes"])

    file_node =
      Enum.find(payload["nodes"], fn node ->
        is_map(node["file"]) && node["file"]["id"] == Paths.file_id(ctx.hub_file)
      end)

    assert file_node

    Map.put(ctx, :cli_result, result)
  end

  step :rename_folder, ctx do
    result =
      run_cli(ctx, [
        "resource_hubs",
        "rename_folder",
        "--folder-id",
        ctx.folder_id,
        "--new-name",
        "Renamed CLI folder"
      ])

    payload = assert_cli_success!(result)
    assert payload["success"]

    folder = Repo.get!(Folder, ctx.folder_id) |> Repo.preload(:node)
    assert folder.node.name == "Renamed CLI folder"

    Map.put(ctx, :cli_result, result)
  end

  step :copy_folder, ctx do
    result =
      run_cli(ctx, [
        "resource_hubs",
        "copy_folder",
        "--folder-id",
        ctx.folder_id,
        "--folder-name",
        "Copied CLI folder"
      ])

    payload = assert_cli_success!(result)
    assert payload["folder_id"]

    {:ok, copied_folder_id} = OperatelyWeb.Api.Helpers.decode_id(payload["folder_id"])
    copied_folder = Repo.get!(Folder, copied_folder_id)

    assert copied_folder.id != ctx.folder_id
    assert ResourceHubs.list_folders(ctx.resource_hub) |> Enum.any?(&(&1.id == copied_folder_id))

    ctx
    |> Map.put(:cli_result, result)
    |> Map.put(:copied_folder_id, copied_folder_id)
  end

  step :update_parent_folder, ctx do
    result =
      run_cli(ctx, [
        "resource_hubs",
        "update_parent_folder",
        "--resource-id",
        ctx.hub_file.id,
        "--resource-type",
        "file",
        "--new-folder-id",
        ctx.folder_id
      ])

    payload = assert_cli_success!(result)
    assert payload["success"]

    file =
      Repo.get!(ResourceHubFile, ctx.hub_file.id)
      |> Repo.preload(:node)

    assert file.node.parent_folder_id == ctx.folder_id

    Map.put(ctx, :cli_result, result)
  end

  step :delete_folder, ctx do
    result =
      run_cli(ctx, [
        "resource_hubs",
        "delete_folder",
        "--folder-id",
        ctx.folder_id
      ])

    payload = assert_cli_success!(result)
    assert payload["success"]
    refute Repo.get(Folder, ctx.folder_id)

    Map.put(ctx, :cli_result, result)
  end

  defp assert_cli_success!(result) do
    assert result.exit_code == 0, "CLI failed with output: #{result.output}"
    Jason.decode!(result.output)
  end
end
