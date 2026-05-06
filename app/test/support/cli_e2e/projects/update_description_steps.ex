defmodule Operately.Support.CliE2E.Projects.UpdateDescriptionSteps do
  use Operately.Support.CliE2E

  alias Operately.Projects.Project
  alias Operately.Support.CliE2E.Helpers

  step :setup, ctx do
    previous = Helpers.enable_auth_methods()

    on_exit(fn ->
      Helpers.restore_auth_methods(previous)
    end)

    ctx = Factory.setup(ctx)
    ctx = Factory.add_space(ctx, :engineering, company_id: ctx.company.id)
    ctx = Factory.add_project(ctx, :project, :engineering)
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

  step :update_project_description_from_file, ctx, description do
    description_file = create_temp_file!("operately-cli-project-description", description, ".md")

    on_exit(fn ->
      File.rm(description_file)
    end)

    result =
      run_cli(ctx, [
        "projects",
        "update_description",
        "--project-id",
        ctx.project.id,
        "--description-file",
        description_file
      ])

    ctx
    |> Map.put(:cli_result, result)
    |> Map.put(:project_description, description)
    |> Map.put(:project_description_file, description_file)
  end

  step :assert_project_description_updated_successfully, ctx do
    assert ctx.cli_result.exit_code == 0

    payload = Jason.decode!(ctx.cli_result.output)
    assert get_in(payload, ["project", "id"])

    project = Repo.get!(Project, ctx.project.id)
    text = project.description |> collect_text() |> Enum.join(" ")

    assert text =~ "Launch dashboard"
    assert text =~ "Improve API latency"
    refute text =~ ctx.project_description_file

    ctx
  end

  defp collect_text(%{"text" => text}), do: [text]
  defp collect_text(%{"content" => content}) when is_list(content), do: Enum.flat_map(content, &collect_text/1)
  defp collect_text(list) when is_list(list), do: Enum.flat_map(list, &collect_text/1)
  defp collect_text(_), do: []
end
