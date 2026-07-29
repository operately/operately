defmodule Operately.Search.Sources.CoreWork.ProjectRetrospectiveTest do
  use Operately.DataCase, async: true

  alias Operately.Access
  alias Operately.Projects.Project
  alias Operately.Search.Sources.CoreWork.ProjectRetrospective, as: ProjectRetrospectiveSource
  alias Operately.Support.{Factory, RichText}

  setup ctx do
    ctx =
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space)
      |> Factory.add_project(:project, :space, goal: :goal)
      |> Factory.add_project_retrospective(:retrospective, :project, :creator)

    project =
      ctx.project
      |> Project.changeset(%{status: "closed", closed_at: DateTime.utc_now()})
      |> Repo.update!()

    retrospective =
      ctx.retrospective
      |> Ecto.Changeset.change(content: RichText.rich_text("Launch lessons"))
      |> Repo.update!()

    %{ctx | project: project, retrospective: retrospective}
  end

  test "builds project retrospectives with inherited scopes and closed state", ctx do
    attrs = entry_attrs(ctx.retrospective.id)

    assert attrs.title == "Project retrospective"
    assert attrs.body == "Launch lessons"
    assert attrs.body_kind == "content"
    assert attrs.company_id == ctx.company.id
    assert attrs.access_context_id == Access.get_context!(project_id: ctx.project.id).id
    assert attrs.space_id == ctx.space.id
    assert attrs.project_id == ctx.project.id
    assert attrs.goal_id == ctx.goal.id
    assert attrs.state == :closed
    assert attrs.source_inserted_at == ctx.retrospective.inserted_at
    assert NaiveDateTime.compare(attrs.source_updated_at, ctx.retrospective.updated_at) in [:eq, :gt]
  end

  test "treats malformed rich content as an empty body", ctx do
    ctx.retrospective
    |> Ecto.Changeset.change(content: %{"content" => "invalid"})
    |> Repo.update!()

    assert entry_attrs(ctx.retrospective.id).body == ""
  end

  test "skips retrospectives whose project or space is deleted", ctx do
    ctx.project |> Repo.soft_delete!()
    assert :skip = ctx.retrospective |> fetch_record() |> ProjectRetrospectiveSource.to_entry()

    ctx.project |> Ecto.Changeset.change(deleted_at: nil) |> Repo.update!()
    ctx.space |> Repo.soft_delete!()
    assert :skip = ctx.retrospective |> fetch_record() |> ProjectRetrospectiveSource.to_entry()
  end

  test "uses stable UUID keyset pagination", ctx do
    {:ok, [first]} = ProjectRetrospectiveSource.fetch_batch(nil, 1)
    {:ok, remaining} = ProjectRetrospectiveSource.fetch_batch(first.id, 10)

    assert Enum.all?(remaining, &(&1.id > first.id))
    assert Enum.any?([first | remaining], &(&1.id == ctx.retrospective.id))
  end

  defp entry_attrs(id) do
    id
    |> fetch_record()
    |> ProjectRetrospectiveSource.to_entry()
    |> then(fn {:ok, attrs} -> attrs end)
  end

  defp fetch_record(%{id: id}), do: fetch_record(id)

  defp fetch_record(id) do
    assert {:ok, [record]} = ProjectRetrospectiveSource.fetch_by_ids([id])
    record
  end
end
