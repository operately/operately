defmodule Operately.Support.CliE2E.Documents.ListContentsSteps do
  use Operately.Support.CliE2E

  alias Operately.Support.CliE2E.Documents.HubScopeSteps

  step :setup, ctx do
    ctx
    |> HubScopeSteps.setup_base()
    |> Factory.add_document(:space_document, :resource_hub, name: "Space seeded document")
  end

  step :setup_project, ctx do
    ctx
    |> HubScopeSteps.init_project_scope()
    |> Factory.add_document(:project_document, :project_hub, name: "Project seeded document")
  end

  step :setup_goal, ctx do
    ctx
    |> HubScopeSteps.init_goal_scope()
    |> Factory.add_document(:goal_document, :goal_hub, name: "Goal seeded document")
  end

  step :list_contents_for_parent, ctx do
    result =
      run_cli(ctx, [
        "documents",
        "list_contents" | HubScopeSteps.hub_scope_flag(ctx)
      ])

    Map.put(ctx, :cli_result, result)
  end

  step :assert_seeded_document_listed, ctx do
    HubScopeSteps.assert_cli_success!(ctx)

    payload = HubScopeSteps.cli_payload(ctx)
    nodes = payload["nodes"] || []
    names = Enum.map(nodes, & &1["name"])

    expected_name =
      case ctx.parent_scope do
        :project -> "Project seeded document"
        :goal -> "Goal seeded document"
        _ -> "Space seeded document"
      end

    assert expected_name in names

    ctx
  end

  step :create_folder_and_nested_document, ctx do
    folder_result =
      run_cli(ctx, [
        "documents",
        "create_folder",
        "--space-id",
        ctx.engineering.id,
        "--name",
        "CLI nested folder"
      ])

    assert folder_result.exit_code == 0

    folder_id = folder_result.output |> Jason.decode!() |> get_in(["folder", "id"])

    document_result =
      run_cli(ctx, [
        "documents",
        "create_document",
        "--space-id",
        ctx.engineering.id,
        "--folder-id",
        folder_id,
        "--name",
        "CLI nested document",
        "--content",
        "Nested content"
      ])

    assert document_result.exit_code == 0

    ctx
    |> Map.put(:folder_api_id, folder_id)
    |> Map.put(:nested_document_name, "CLI nested document")
  end

  step :list_folder_contents, ctx do
    result =
      run_cli(ctx, [
        "documents",
        "list_contents",
        "--space-id",
        ctx.engineering.id,
        "--folder-id",
        ctx.folder_api_id
      ])

    Map.put(ctx, :cli_result, result)
  end

  step :assert_only_nested_document_listed, ctx do
    HubScopeSteps.assert_cli_success!(ctx)

    payload = HubScopeSteps.cli_payload(ctx)
    nodes = payload["nodes"] || []

    assert length(nodes) == 1
    assert hd(nodes)["name"] == ctx.nested_document_name
    refute hd(nodes)["name"] == "Space seeded document"

    ctx
  end
end
