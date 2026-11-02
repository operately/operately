defmodule Operately.Features.Projects.ProjectPageLiveUpdatesTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.Projects.ProjectPageLiveUpdatesSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  feature "external API changes appear on the open project without reloading", ctx do
    ctx
    |> Steps.open_project()
    |> Steps.update_description_and_reviewer_through_api()
    |> Steps.create_milestone_through_api()
    |> Steps.create_task_through_api()
    |> Steps.create_link_through_api()
    |> Steps.assert_no_reload()
  end

  feature "MCP updates preserve a description draft", ctx do
    ctx
    |> Steps.open_project()
    |> Steps.start_description_draft()
    |> Steps.update_description_through_mcp()
    |> Steps.assert_draft_preserved()
    |> Steps.cancel_draft_and_assert_remote_description()
    |> Steps.assert_no_reload()
  end

  feature "a change in another browser reaches the open project", ctx do
    ctx
    |> Steps.open_project()
    |> Steps.rename_in_another_browser()
    |> Steps.assert_no_reload()
  end
end
