defmodule OperatelyWeb.Api.PageableTest do
  use Operately.DataCase

  alias Operately.Support.Factory
  alias Operately.Tasks.Task
  alias OperatelyWeb.Api.Serializer
  alias OperatelyWeb.Paths

  setup do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space)
      |> Factory.add_project(:project, :space, goal: :goal)
      |> Factory.add_resource_hub(:resource_hub, :space, :creator)
      |> Factory.add_folder(:folder, :resource_hub)
      |> Factory.add_link(:link, :resource_hub)
      |> Factory.preload(:folder, [:node])
      |> Factory.preload(:link, [:node])

    {:ok, ctx}
  end

  test "attaches a canonical folder page URL", ctx do
    serialized = serialize_with_company(ctx, ctx.folder)
    uri = URI.parse(serialized.url)

    assert serialized.url == Paths.to_url(Paths.folder_path(ctx.company, ctx.folder))
    assert String.starts_with?(serialized.url, OperatelyWeb.Endpoint.url())
    assert uri.path == Paths.folder_path(ctx.company, ctx.folder)
    assert String.contains?(uri.path, "/folders/")
    refute String.contains?(uri.path, "/spaces/")
    refute String.contains?(uri.path, "/files/folders/")
  end

  test "attaches matching Paths URLs for project, goal, and space", ctx do
    project = serialize_with_company(ctx, ctx.project)
    goal = serialize_with_company(ctx, ctx.goal)
    space = serialize_with_company(ctx, ctx.space)

    assert project.url == Paths.to_url(Paths.project_path(ctx.company, ctx.project))
    assert goal.url == Paths.to_url(Paths.goal_path(ctx.company, ctx.goal))
    assert space.url == Paths.to_url(Paths.space_path(ctx.company, ctx.space))
  end

  test "keeps the link destination url and adds page_url", ctx do
    serialized = serialize_with_company(ctx, ctx.link)

    assert serialized.url == ctx.link.url
    assert serialized.page_url == Paths.to_url(Paths.link_path(ctx.company, ctx.link))
    refute serialized.url == serialized.page_url
  end

  test "omits url when no company option is supplied", ctx do
    folder = Serializer.serialize(ctx.folder, level: :essential)
    project = Serializer.serialize(ctx.project, level: :essential)
    link = Serializer.serialize(ctx.link, level: :essential)

    refute Map.has_key?(folder, :url)
    refute Map.has_key?(project, :url)
    refute Map.has_key?(link, :page_url)
    assert link.url == ctx.link.url
  end

  test "attaches URLs to every item in a list", ctx do
    [project, goal] = Serializer.serialize([ctx.project, ctx.goal], company: ctx.company)

    assert project.url == Paths.to_url(Paths.project_path(ctx.company, ctx.project))
    assert goal.url == Paths.to_url(Paths.goal_path(ctx.company, ctx.goal))
  end

  test "rejects unsupported serialization options", ctx do
    assert_raise ArgumentError, fn ->
      Serializer.serialize(ctx.project, unsupported: true)
    end
  end

  test "omits a space-task URL when its space is not loaded", ctx do
    task = %Task{id: Ecto.UUID.generate(), name: "Unroutable task", project_id: nil}

    serialized = Serializer.serialize(task, company: ctx.company)

    refute Map.has_key?(serialized, :url)
  end

  defp serialize_with_company(ctx, resource) do
    Serializer.serialize(resource, level: :essential, company: ctx.company)
  end
end
