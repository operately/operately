defmodule Operately.Operations.ProjectRetrospectiveEditingTest do
  use Operately.DataCase

  alias Operately.Activities.Activity
  alias Operately.Support.RichText
  alias Operately.Operations.ProjectRetrospectiveEditing

  @new_content RichText.rich_text("Everything went well")

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
    |> Factory.add_project_retrospective(:retrospective, :project, :creator)
    |> Factory.preload(:retrospective, :project)
  end

  test "ProjectRetrospectiveEditing operation edits retrospective", ctx do
    refute ctx.retrospective.content == @new_content

    {:ok, _} =
      ProjectRetrospectiveEditing.run(ctx.creator, ctx.retrospective, %{
        content: @new_content,
        success_status: "achieved"
      })

    retrospective = Repo.reload(ctx.retrospective)

    assert retrospective.content == @new_content
  end

  test "ProjectRetrospectiveEditing operation doesn't update if there are no changes", ctx do
    query = fetch_activity_query(ctx.retrospective)

    assert Repo.aggregate(query, :count) == 0

    {:ok, _} =
      ProjectRetrospectiveEditing.run(ctx.creator, ctx.retrospective, %{
        content: @new_content,
        success_status: :achieved
      })

    assert Repo.aggregate(query, :count) == 1

    retrospective =
      ctx.retrospective
      |> Repo.reload()
      |> Repo.preload(:project)

    {:ok, _} =
      ProjectRetrospectiveEditing.run(ctx.creator, retrospective, %{
        content: @new_content,
        success_status: :achieved
      })

    assert Repo.aggregate(query, :count) == 1
  end

  test "ProjectRetrospectiveEditing operation creates activity", ctx do
    query = fetch_activity_query(ctx.retrospective)

    refute Repo.one(query)

    {:ok, _} =
      ProjectRetrospectiveEditing.run(ctx.creator, ctx.retrospective, %{
        content: @new_content,
        success_status: "achieved"
      })

    assert Repo.one(query)
  end

  #
  # Helpers
  #

  defp fetch_activity_query(retrospective) do
    from(a in Activity, where: a.action == "project_retrospective_edited" and a.content["project_id"] == ^retrospective.project_id)
  end
end
