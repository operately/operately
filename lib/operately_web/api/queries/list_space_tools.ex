defmodule OperatelyWeb.Api.Queries.ListSpaceTools do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.Goals.Goal
  alias Operately.Projects.Project
  alias Operately.Messages.{MessagesBoard, Message}
  alias Operately.ResourceHubs.ResourceHub
  alias Operately.Groups.SpaceTools
  alias Operately.Access.Filters

  inputs do
    field :space_id, :string
  end

  outputs do
    field :tools, :space_tools
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:id, fn -> decode_id(inputs.space_id) end)
    |> run(:projects, fn ctx -> load_projects(ctx.id, ctx.me) end)
    |> run(:goals, fn ctx -> load_goals(ctx.id, ctx.me) end)
    |> run(:messages_boards, fn ctx -> load_messages_boards(ctx.id, ctx.me) end)
    |> run(:resource_hubs, fn ctx -> load_resource_hubs(ctx.id, ctx.me) end)
    |> run(:serialized, fn ctx -> serialize(ctx) end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :id, _} -> {:error, :bad_request}
      {:error, :nodes, _} -> {:error, :not_found}
      _ -> {:error, :internal_server_error}
    end
  end

  defp serialize(ctx) do
    space_tools = SpaceTools.build_struct(ctx)

    {:ok, %{tools: Serializer.serialize(space_tools)}}
  end

  defp load_projects(space_id, me) do
    projects =
      from(p in Project, as: :project,
        preload: [last_check_in: :author, milestones: :project]
      )
      |> Project.scope_space(space_id)
      |> Filters.filter_by_view_access(me.id)
      |> Project.order_by_name()
      |> Repo.all()

    {:ok, projects}
  end

  defp load_goals(space_id, me) do
    goals =
      from(g in Goal, as: :goals, preload: :parent_goal)
      |> Goal.scope_space(space_id)
      |> Filters.filter_by_view_access(me.id)
      |> Repo.all()

    {:ok, goals}
  end

  defp load_messages_boards(space_id, me) do
    subquery = from(m in Message,
      where: m.state != :draft,
      preload: :author,
      order_by: [desc: m.published_at]
    )

    boards =
      from(b in MessagesBoard,
        join: s in assoc(b, :space), as: :space,
        preload: [messages: ^subquery],
        where: b.space_id == ^space_id
      )
      |> Filters.filter_by_view_access(me.id, named_binding: :space)
      |> Repo.all()
      |> MessagesBoard.load_messages_comments_count()

    {:ok, boards}
  end

  defp load_resource_hubs(space_id, me) do
    hubs =
      from(h in ResourceHub,
        preload: :nodes,
        where: h.space_id == ^space_id
      )
      |> Filters.filter_by_view_access(me.id)
      |> Repo.all()

    {:ok, hubs}
  end
end
