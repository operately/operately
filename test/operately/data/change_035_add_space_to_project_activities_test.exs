defmodule Operately.Data.Change035AddSpaceToProjectActivitiesTest do
  use Operately.DataCase
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias Operately.Support.RichText

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
  end

  describe "project_check_in_submitted and project_check_in_acknowledged" do
    setup ctx do
      ctx
      |> Factory.add_project(:project, :space)
    end

    test "migration doesn't delete existing data in activity content", ctx do
      check_ins = Enum.map(1..3, fn _ ->
        {:ok, c} = Operately.Operations.ProjectCheckIn.run(ctx.creator, ctx.project, %{
          project_id: ctx.project.id,
          status: "on_track",
          content: RichText.rich_text("content"),
          send_to_everyone: false,
          subscription_parent_type: :project_check_in,
          subscriber_ids: []
        })
        c = Repo.preload(c, :project)
        {:ok, _} = Operately.Operations.ProjectCheckInAcknowledgement.run(ctx.creator, c)
        c
      end)

      Operately.Data.Change035AddSpaceToProjectActivities.run()

      fetch_activities("project_check_in_submitted")
      |> Enum.each(fn activity ->
        assert activity.content["company_id"] == ctx.company.id
        assert activity.content["space_id"] == ctx.space.id
        assert activity.content["project_id"] == ctx.project.id
        assert Enum.find(check_ins, &(&1.id == activity.content["check_in_id"]))
      end)

      fetch_activities("project_check_in_acknowledged")
      |> Enum.each(fn activity ->
        assert activity.content["company_id"] == ctx.company.id
        assert activity.content["space_id"] == ctx.space.id
        assert activity.content["project_id"] == ctx.project.id
        assert Enum.find(check_ins, &(&1.id == activity.content["check_in_id"]))
      end)
    end
  end

  describe "project_check_in_commented" do
    setup ctx do
      ctx
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_check_in(:check_in, :project, :creator)
      |> Factory.preload(:check_in, :project)
    end

    test "migration doesn't delete existing data in activity content", ctx do
      comments = Enum.map(1..3, fn _ ->
        {:ok, comment} = Operately.Operations.CommentAdding.run(ctx.creator, ctx.check_in, "project_check_in", RichText.rich_text("content"))
        comment
      end)

      Operately.Data.Change035AddSpaceToProjectActivities.run()

      fetch_activities("project_check_in_commented")
      |> Enum.each(fn activity ->
        assert activity.content["company_id"] == ctx.company.id
        assert activity.content["space_id"] == ctx.space.id
        assert activity.content["check_in_id"] == ctx.check_in.id
        assert activity.content["project_id"] == ctx.project.id
        assert Enum.find(comments, &(&1.id == activity.content["comment_id"]))
      end)
    end
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
