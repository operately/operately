defmodule Operately.Data.Change039AddSpaceToProjectTimelineEditedActivityTest do
  use Operately.DataCase
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias Operately.Support.RichText
  alias Operately.ContextualDates.ContextualDate

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
  end

  test "migration doesn't delete existing data in activity content", ctx do
    attrs = %{
      project_id: ctx.project.id,
      project_start_date: ContextualDate.create_day_date(~D[2024-10-14]),
      project_due_date: ContextualDate.create_day_date(~D[2024-11-14]),
      milestone_updates: [],
      new_milestones: [
        %{
          title: "New milestone",
          description: RichText.rich_text("description"),
          due_date: ContextualDate.create_day_date(~D[2024-11-14])
        }
      ]
    }

    Enum.each(1..3, fn _ ->
      {:ok, _} = Operately.Projects.EditTimelineOperation.run(ctx.creator, ctx.project, attrs)
    end)

    Operately.Data.Change039AddSpaceToProjectTimelineEditedActivity.run()

    fetch_activities("project_timeline_edited")
    |> Enum.each(fn activity ->
      assert activity.content["company_id"] == ctx.company.id
      assert activity.content["space_id"] == ctx.space.id
      assert activity.content["project_id"] == ctx.project.id

      milestones = activity.content["new_milestones"]
      assert length(milestones) == 1
      assert hd(milestones)["title"] == "New milestone"
      assert hd(milestones)["due_date"] == "2024-11-14"

      assert activity.content["new_start_date"] == "2024-10-14"
      assert activity.content["new_end_date"] == "2024-11-14"
    end)
  end

  #
  # Helpers
  #

  defp fetch_activities(action) do
    from(a in Operately.Activities.Activity,
      where: a.action == ^action
    )
    |> Repo.all()
  end
end
