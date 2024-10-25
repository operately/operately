defmodule Operately.Data.Change034AddSpaceProjectPausingToActivityTest do
  use Operately.DataCase

  alias Operately.Repo
  alias Operately.Support.RichText

  import Ecto.Query, only: [from: 2]
  import Operately.ProjectsFixtures

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
  end

  describe "project_pausing and project_renamed" do
    test "migration doesn't delete existing data in activity content", ctx do
      projects = Enum.map(1..3, fn _ ->
        p = project_fixture(%{company_id: ctx.company.id, creator_id: ctx.creator.id, group_id: ctx.space.id, name: "name"})
        {:ok, _} = Operately.Operations.ProjectPausing.run(ctx.creator, p)
        {:ok, p} = Operately.Projects.rename_project(ctx.creator, p, "new name")
        p
      end)

      Operately.Data.Change034AddSpaceProjectPausingToActivity.run()

      fetch_activities("project_pausing")
      |> Enum.each(fn activity ->
        assert activity.content["company_id"] == ctx.company.id
        assert activity.content["space_id"] == ctx.space.id
        assert Enum.find(projects, &(&1.id == activity.content["project_id"]))
      end)

      fetch_activities("project_renamed")
      |> Enum.each(fn activity ->
        assert Enum.find(projects, &(&1.id == activity.content["project_id"]))
        assert activity.content["company_id"] == ctx.company.id
        assert activity.content["space_id"] == ctx.space.id
        assert activity.content["old_name"] == "name"
        assert activity.content["new_name"] == "new name"
      end)
    end
  end

  describe "project_milestone_commented" do
    setup ctx do
      ctx
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_milestone(:milestone, :project)
    end

    test "migration doesn't delete existing data in activity content", ctx do
      comments = Enum.map(1..3, fn _ ->
        {:ok, comment} = Operately.Comments.create_milestone_comment(ctx.creator, ctx.milestone, "none", %{
          content: %{"message" => RichText.rich_text("message")},
          author_id: ctx.creator.id,
        })
        comment
      end)

      Operately.Data.Change034AddSpaceProjectPausingToActivity.run()

      fetch_activities("project_milestone_commented")
      |> Enum.each(fn activity ->
        assert activity.content["company_id"] == ctx.company.id
        assert activity.content["space_id"] == ctx.space.id
        assert activity.content["project_id"] == ctx.project.id
        assert activity.content["milestone_id"] == ctx.milestone.id
        assert activity.content["comment_action"] == "none"
        assert Enum.find(comments, &(&1.comment_id == activity.content["comment_id"]))
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
