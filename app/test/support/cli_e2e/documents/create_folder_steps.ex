defmodule Operately.Support.CliE2E.Documents.CreateFolderSteps do
  use Operately.Support.CliE2E

  alias Operately.ResourceHubs.Folder
  alias Operately.Support.CliE2E.Documents.HubScopeSteps

  step :setup, ctx do
    HubScopeSteps.setup_base(ctx)
  end

  step :setup_project, ctx do
    HubScopeSteps.init_project_scope(ctx)
  end

  step :setup_goal, ctx do
    HubScopeSteps.init_goal_scope(ctx)
  end

  step :create_folder_for_parent, ctx do
    name = "CLI #{ctx.parent_scope} folder"

    result =
      run_cli(ctx, [
        "documents",
        "create_folder"
        | HubScopeSteps.hub_scope_flag(ctx) ++ ["--name", name]
      ])

    ctx
    |> Map.put(:cli_result, result)
    |> Map.put(:folder_name, name)
  end

  step :assert_folder_created_successfully, ctx do
    HubScopeSteps.assert_cli_success!(ctx)

    payload = HubScopeSteps.cli_payload(ctx)
    folder = payload["folder"]

    assert is_map(folder)
    assert folder["id"]

    {:ok, id} = OperatelyWeb.Api.Helpers.decode_id(folder["id"])

    folder_record =
      Folder
      |> Repo.get!(id)
      |> Repo.preload(:node)

    assert folder_record.node.resource_hub_id == ctx.expected_resource_hub_id
    assert folder_record.node.name == ctx.folder_name

    ctx
    |> Map.put(:created_folder_id, id)
    |> Map.put(:created_folder_api_id, folder["id"])
    |> Map.put(:created_folder, folder_record)
  end
end
