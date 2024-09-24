defmodule Operately.Operations.ProjectRetrospectiveEditingTest do
  use Operately.DataCase

  alias Operately.Activities.Activity
  alias Operately.Support.RichText
  alias Operately.Operations.ProjectRetrospectiveEditing

  @new_content %{
    "whatWentWell" => RichText.rich_text("Everything went well"),
    "whatDidYouLearn" => RichText.rich_text("I learned many things"),
    "whatCouldHaveGoneBetter" => RichText.rich_text("Some things could have gone better"),
  }

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
    |> Factory.add_project_retrospective(:retrospective, :project, :creator)
  end

  test "ProjectRetrospectiveEditing operation edits retrospective", ctx do
    refute ctx.retrospective.content == @new_content

    retrospective = Repo.preload(ctx.retrospective, :project)
    {:ok, _} = ProjectRetrospectiveEditing.run(ctx.creator, retrospective, @new_content)
    retrospective = Repo.reload(ctx.retrospective)

    assert retrospective.content == @new_content
  end

  test "ProjectRetrospectiveEditing operation doesn't update if there are no changes", ctx do
    retrospective = Repo.preload(ctx.retrospective, :project)
    query = fetch_activity_query(retrospective)

    assert Repo.aggregate(query, :count) == 0

    {:ok, _} = ProjectRetrospectiveEditing.run(ctx.creator, retrospective, @new_content)

    assert Repo.aggregate(query, :count) == 1

    retrospective = Repo.reload(ctx.retrospective)
    {:ok, _} = ProjectRetrospectiveEditing.run(ctx.creator, retrospective, @new_content)

    assert Repo.aggregate(query, :count) == 1
  end

  test "ProjectRetrospectiveEditing operation creates activity", ctx do
    retrospective = Repo.preload(ctx.retrospective, :project)
    query = fetch_activity_query(retrospective)

    refute Repo.one(query)

    {:ok, _} = ProjectRetrospectiveEditing.run(ctx.creator, retrospective, @new_content)

    assert Repo.one(query)
  end

  #
  # Helpers
  #

  defp fetch_activity_query(retrospective) do
    from(a in Activity, where: a.action == "project_retrospective_edited" and a.content["project_id"] == ^retrospective.project_id)
  end
end
