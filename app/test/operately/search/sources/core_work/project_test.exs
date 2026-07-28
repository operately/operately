defmodule Operately.Search.Sources.CoreWork.ProjectTest do
  use Operately.DataCase, async: true

  alias Operately.Access
  alias Operately.Projects.Project
  alias Operately.Search.Indexer.EntryBuilder
  alias Operately.Search.Sources.CoreWork.Project, as: ProjectSource
  alias Operately.Support.{Factory, RichText}

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_goal(:goal, :space)
    |> Factory.add_project(:project, :space, goal: :goal)
    |> update_project(%{name: "Search roadmap", description: RichText.rich_text("Customer evidence")})
  end

  test "builds project entries with current scopes, content, and timestamps", ctx do
    attrs = entry_attrs(ctx.project.id)

    assert attrs.title == "Search roadmap"
    assert attrs.body == "Customer evidence"
    assert attrs.body_kind == "description"
    assert attrs.company_id == ctx.company.id
    assert attrs.access_context_id == Access.get_context!(project_id: ctx.project.id).id
    assert attrs.space_id == ctx.space.id
    assert attrs.project_id == ctx.project.id
    assert attrs.goal_id == ctx.goal.id
    assert attrs.state == nil
    assert attrs.source_inserted_at == ctx.project.inserted_at
    assert NaiveDateTime.compare(attrs.source_updated_at, ctx.project.updated_at) in [:eq, :gt]
  end

  test "indexes archived, closed, and paused projects with deterministic state precedence", ctx do
    paused = update_project(ctx, %{status: "paused"}).project
    assert entry_attrs(paused.id).state == :paused

    closed = update_project(%{ctx | project: paused}, %{status: "closed", closed_at: DateTime.utc_now()}).project
    assert entry_attrs(closed.id).state == :closed

    Repo.soft_delete!(closed)
    assert entry_attrs(closed.id).state == :archived
  end

  test "uses stable UUID keyset pagination and excludes projects in deleted spaces", ctx do
    {:ok, [first]} = ProjectSource.fetch_batch(nil, 1)
    {:ok, remaining} = ProjectSource.fetch_batch(first.id, 10)

    assert Enum.all?(remaining, &(&1.id > first.id))

    Repo.soft_delete!(ctx.space)
    assert {:ok, []} = ProjectSource.fetch_by_ids([ctx.project.id])
  end

  test "leaves missing project name validation to the indexer", ctx do
    record = fetch_record(ctx.project.id)
    malformed = %{record | resource: %{record.resource | name: nil}}

    assert {:ok, attrs} = ProjectSource.to_entry(malformed)

    attrs = Map.merge(attrs, %{source_type: "project", source_id: ctx.project.id})
    assert {[], [%{changeset: changeset}]} = EntryBuilder.build([attrs])
    assert %{title: ["can't be blank"]} = errors_on(changeset)
  end

  defp update_project(ctx, attrs) do
    project =
      ctx.project
      |> Project.changeset(attrs)
      |> Repo.update!()

    %{ctx | project: project}
  end

  defp entry_attrs(id) do
    id
    |> fetch_record()
    |> ProjectSource.to_entry()
    |> then(fn {:ok, attrs} -> attrs end)
  end

  defp fetch_record(id) do
    assert {:ok, [record]} = ProjectSource.fetch_by_ids([id])
    record
  end
end
