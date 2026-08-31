defmodule OperatelyWeb.Mcp.Tools.SearchFullTextTest do
  use Operately.DataCase, async: true

  alias Operately.Search.SourceIndexer
  alias Operately.ShortUuid
  alias Operately.Support.{Factory, RichText}
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.SearchFullText
  alias OperatelyWeb.Paths

  test "call/2 returns indexed document matches" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.fetch_default_resource_hub(:hub, :space)
      |> Factory.add_document(:document, :hub,
        name: "Distinctive MCP document",
        content: RichText.rich_text("Distinctive MCP search content")
      )

    assert {:ok, _} = SourceIndexer.sync("resource_hub_document", ctx.document.id)

    assert {:ok, %{results: [result | _]}} =
             SearchFullText.call(conn(ctx), %{
               "query" => "Distinctive MCP",
               "types" => ["resource_hub_document"],
               "sort" => "best_match"
             })

    assert result.id == Paths.document_id(ctx.document)
    assert result.type == :resource_hub_document
    assert result.url == Paths.to_url(Paths.document_path(ctx.company, ctx.document))
    refute String.contains?(URI.parse(result.url).path, "/files/folders/")
  end

  test "call/2 returns indexed project matches" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space, name: "Distinctive MCP project")

    assert {:ok, _} = SourceIndexer.sync("project", ctx.project.id)

    assert {:ok, %{results: [result | _]}} =
             SearchFullText.call(conn(ctx), %{
               "query" => "Distinctive MCP",
               "types" => ["project"],
               "sort" => "best_match"
             })

    assert result.id == ShortUuid.encode!(ctx.project.id)
    assert result.type == :project
    assert result.url == Paths.to_url(Paths.project_path(ctx.company, ctx.project))
  end

  test "call/2 returns indexed goal matches" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space, name: "Distinctive MCP goal")

    assert {:ok, _} = SourceIndexer.sync("goal", ctx.goal.id)

    assert {:ok, %{results: [result | _]}} =
             SearchFullText.call(conn(ctx), %{
               "query" => "Distinctive MCP",
               "types" => ["goal"],
               "sort" => "best_match"
             })

    assert result.id == ShortUuid.encode!(ctx.goal.id)
    assert result.type == :goal
  end

  test "call/2 returns indexed milestone matches" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_milestone(:milestone, :project, title: "Distinctive MCP milestone")

    assert {:ok, _} = SourceIndexer.sync("milestone", ctx.milestone.id)

    assert {:ok, %{results: [result | _]}} =
             SearchFullText.call(conn(ctx), %{
               "query" => "Distinctive MCP",
               "types" => ["milestone"],
               "sort" => "best_match"
             })

    assert result.id == ShortUuid.encode!(ctx.milestone.id)
    assert result.type == :milestone
  end

  test "call/2 returns canonical space-task URLs and navigation targets" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space, name: "Distinctive Space")
      |> Factory.create_space_task(:space_task, :space, name: "Distinctive MCP space task")

    assert {:ok, _} = SourceIndexer.sync("task", ctx.space_task.id)

    assert {:ok, %{results: [result]}} =
             SearchFullText.call(conn(ctx), %{
               "query" => "Distinctive MCP space task",
               "types" => ["task"]
             })

    assert result.url == Paths.to_url(Paths.space_task_path(ctx.company, ctx.space, ctx.space_task))
    assert result.navigation_target.space_id == ShortUuid.encode!(ctx.space.id)
    assert result.navigation_target.project_id == nil
  end

  test "call/2 applies space, time_range, and most_recent filters" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space, name: "Product Space")
      |> Factory.add_space(:marketing, name: "Marketing Space")
      |> Factory.add_project(:product_project, :space, name: "Filter marker product")
      |> Factory.add_project(:marketing_project, :marketing, name: "Filter marker marketing")
      |> Factory.add_goal(:product_goal, :space, name: "Filter marker goal")
      |> update_project_description(:product_project, "Filter marker shared body")
      |> update_project_description(:marketing_project, "Filter marker shared body")
      |> update_goal_description(:product_goal, "Filter marker shared body")

    assert {:ok, _} = SourceIndexer.sync("project", ctx.product_project.id)
    assert {:ok, _} = SourceIndexer.sync("project", ctx.marketing_project.id)
    assert {:ok, _} = SourceIndexer.sync("goal", ctx.product_goal.id)

    assert {:ok, %{results: results}} =
             SearchFullText.call(conn(ctx), %{
               "query" => "Filter marker",
               "space_ids" => [Paths.space_id(ctx.space)],
               "types" => ["project"]
             })

    assert Enum.map(results, & &1.id) == [ShortUuid.encode!(ctx.product_project.id)]

    set_entry_inserted_at(ctx.marketing_project, days_ago(1))
    set_entry_inserted_at(ctx.product_project, days_ago(5))
    set_entry_inserted_at(ctx.product_goal, days_ago(40))

    assert {:ok, %{results: recent_results}} =
             SearchFullText.call(conn(ctx), %{
               "query" => "Filter marker",
               "time_range" => "last_7_days",
               "sort" => "most_recent"
             })

    assert Enum.map(recent_results, & &1.id) == [
             ShortUuid.encode!(ctx.marketing_project.id),
             ShortUuid.encode!(ctx.product_project.id)
           ]
  end

  defp conn(ctx), do: ToolConnHelper.conn_with_assigns(ctx.account, ctx.company, ctx.creator)

  defp update_project_description(ctx, project_name, description) do
    project =
      ctx
      |> Map.fetch!(project_name)
      |> Operately.Projects.Project.changeset(%{description: RichText.rich_text(description)})
      |> Operately.Repo.update!()

    Map.put(ctx, project_name, project)
  end

  defp update_goal_description(ctx, goal_name, description) do
    goal =
      ctx
      |> Map.fetch!(goal_name)
      |> Operately.Goals.Goal.changeset(%{description: RichText.rich_text(description)})
      |> Operately.Repo.update!()

    Map.put(ctx, goal_name, goal)
  end

  defp set_entry_inserted_at(resource, inserted_at) do
    import Ecto.Query

    source_type =
      case resource do
        %Operately.Projects.Project{} -> :project
        %Operately.Goals.Goal{} -> :goal
      end

    from(entry in Operately.Search.Entry,
      where: entry.source_type == ^source_type and entry.source_id == ^resource.id
    )
    |> Operately.Repo.update_all(set: [source_inserted_at: inserted_at])
  end

  defp days_ago(days) do
    DateTime.utc_now()
    |> DateTime.shift(day: -days)
    |> DateTime.to_naive()
    |> NaiveDateTime.truncate(:microsecond)
  end
end
