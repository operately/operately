defmodule OperatelyEmail.ProjectCheckInSubmittedEmailTest do
  use Operately.DataCase

  import Operately.ActivitiesFixtures

  alias OperatelyEmail.Emails.ProjectCheckInSubmittedEmail
  alias Operately.Support.RichText
  alias OperatelyWeb.Paths

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
    |> Factory.add_project_check_in(:check_in, :project, :creator)
    |> update_check_in_description()
    |> then(&{:ok, &1})
  end

  test "buffered item links the parent to the project and the update to the check-in", ctx do
    activity =
      activity_fixture(%{
        action: "project_check_in_submitted",
        author_id: ctx.creator.id,
        content: %{"project_id" => ctx.project.id, "check_in_id" => ctx.check_in.id}
      })

    item = ProjectCheckInSubmittedEmail.buffered_item(ctx.creator, activity)

    assert item.parent_url == Paths.project_path(ctx.company, ctx.project) |> Paths.to_url()
    assert item.item_url == Paths.project_check_in_path(ctx.company, ctx.check_in) |> Paths.to_url()
  end

  defp update_check_in_description(ctx) do
    {:ok, check_in} =
      Operately.Projects.CheckIn.changeset(ctx.check_in, %{
        description: RichText.rich_text("Progress update")
      })
      |> Operately.Repo.update()

    Map.put(ctx, :check_in, check_in)
  end
end
