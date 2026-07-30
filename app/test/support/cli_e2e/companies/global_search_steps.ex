defmodule Operately.Support.CliE2E.Companies.GlobalSearchSteps do
  use Operately.Support.CliE2E

  alias Operately.Access.Binding
  alias Operately.Support.CliE2E.Helpers
  alias OperatelyWeb.Paths

  step :setup, ctx do
    previous = Helpers.enable_auth_methods()
    Ecto.Adapters.SQL.Sandbox.mode(Repo, {:shared, ctx.sandbox_owner})

    on_exit(fn ->
      Helpers.restore_auth_methods(previous)
    end)

    ctx =
      ctx
      |> Factory.setup()
      |> Factory.add_space(:roadmap_space, name: "Roadmap Space", company_permissions: Binding.view_access())
      |> Factory.add_goal(:roadmap_goal, :roadmap_space, name: "Roadmap Goal")
      |> Factory.add_project(:roadmap_project, :roadmap_space, name: "Roadmap Project")
      |> Factory.add_messages_board(:board, :roadmap_space)
      |> Factory.add_message(:discussion, :board, title: "Roadmap Discussion")
      |> Factory.add_resource_hub(:hub, :roadmap_space, :creator)
      |> Factory.add_folder(:roadmap_folder, :hub)
      |> Factory.add_document(:document, :hub, name: "Roadmap Document")
      |> Factory.add_file(:roadmap_file, :hub)
      |> Factory.add_link(:roadmap_link, :hub)
      |> Factory.add_api_token(:api_token, :creator, read_only: true)

    file = ctx.roadmap_file |> Ecto.Changeset.change(name: "Roadmap File") |> Repo.update!()
    link = ctx.roadmap_link |> Ecto.Changeset.change(name: "Roadmap Link") |> Repo.update!()

    login_result =
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

    assert login_result.exit_code == 0, login_result.output

    ctx
    |> Map.put(:roadmap_file, file)
    |> Map.put(:roadmap_link, link)
    |> Map.put(:profile, "e2e")
  end

  step :search, ctx, query do
    result = run_cli(ctx, ["companies", "global_search", "--query", query])
    Map.put(ctx, :cli_result, result)
  end

  step :assert_quick_search_response, ctx do
    assert ctx.cli_result.exit_code == 0
    payload = Jason.decode!(ctx.cli_result.output)

    assert payload |> Map.keys() |> Enum.sort() ==
             ~w(discussions documents files folders goals links milestones people projects spaces tasks)

    assert Enum.any?(payload["spaces"], &(&1["id"] == Paths.space_id(ctx.roadmap_space))), inspect(payload)
    assert Enum.any?(payload["goals"], &(&1["id"] == Paths.goal_id(ctx.roadmap_goal)))
    assert Enum.any?(payload["projects"], &(&1["id"] == Paths.project_id(ctx.roadmap_project)))
    assert Enum.any?(payload["discussions"], &(&1["id"] == Paths.message_id(ctx.discussion)))
    assert Enum.any?(payload["folders"], &(&1["id"] == Operately.ShortUuid.encode!(ctx.roadmap_folder.id)))
    assert Enum.any?(payload["documents"], &(&1["id"] == Operately.ShortUuid.encode!(ctx.document.id)))
    assert Enum.any?(payload["files"], &(&1["id"] == Operately.ShortUuid.encode!(ctx.roadmap_file.id)))
    assert Enum.any?(payload["links"], &(&1["id"] == Operately.ShortUuid.encode!(ctx.roadmap_link.id)))

    ctx
  end
end
