defmodule OperatelyWeb.Api.Queries.ListSpaceTools do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.Goals.Goal
  alias Operately.Projects.Project
  alias Operately.Messages.{MessagesBoard, Message}
  alias Operately.ResourceHubs.{ResourceHub, Node}
  alias Operately.Groups.Group
  alias Operately.Groups.SpaceTools
  alias Operately.Access.Filters

  inputs do
    field :space_id, :id, null: false
  end

  outputs do
    field :tools, :space_tools, null: false
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:id, fn -> decode_id(inputs.space_id) end)
    |> run(:space, fn ctx -> load_space(ctx.id) end)
    |> run(:tools_data, fn ctx -> load_tools_data(ctx.space, ctx.me) end)
    |> run(:serialized, fn ctx -> serialize(ctx) end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :id, _} -> {:error, :bad_request}
      {:error, :space, :not_found} -> {:error, :not_found}
      {:error, :nodes, _} -> {:error, :not_found}
      {:error, :bad_request, message} -> {:error, :bad_request, message}
      _ -> {:error, :internal_server_error}
    end
  end

  defp serialize(ctx) do
    space_tools = SpaceTools.build_struct(ctx.space.tools, ctx.tools_data)

    {:ok, %{tools: Serializer.serialize(space_tools)}}
  end

  defp load_space(space_id) do
    case Repo.get(Group, space_id) do
      nil -> {:error, :not_found}
      space -> {:ok, space}
    end
  end

  defp load_tools_data(space, me) do
    projects_task = Task.async(fn -> load_projects(space.id, me) end)
    goals_task = Task.async(fn -> load_goals(space.id, me) end)

    tasks_task =
      Task.async(fn ->
        if space.tools.tasks_enabled do
          load_tasks(space.id, me)
        else
          {:ok, []}
        end
      end)

    messages_boards_task =
      Task.async(fn ->
        if space.tools.discussions_enabled do
          load_messages_boards(space.id, me)
        else
          {:ok, []}
        end
      end)

    resource_hubs_task =
      Task.async(fn ->
        if space.tools.resource_hub_enabled do
          load_resource_hubs(space.id, me)
        else
          {:ok, []}
        end
      end)

    {:ok, projects} = Task.await(projects_task)
    {:ok, goals} = Task.await(goals_task)
    {:ok, tasks} = Task.await(tasks_task)
    {:ok, messages_boards} = Task.await(messages_boards_task)
    {:ok, resource_hubs} = Task.await(resource_hubs_task)

    {:ok,
     %{
       projects: projects,
       goals: goals,
       tasks: tasks,
       messages_boards: messages_boards,
       resource_hubs: resource_hubs
     }}
  end

  defp load_projects(space_id, me) do
    projects =
      from(p in Project,
        as: :project,
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
      from(g in Goal, as: :goals, preload: [:parent_goal, :targets, :last_update, :checks])
      |> Goal.scope_space(space_id)
      |> Filters.filter_by_view_access(me.id)
      |> Repo.all()

    {:ok, goals}
  end

  defp load_tasks(space_id, me) do
    tasks =
      from(t in Operately.Tasks.Task,
        join: s in assoc(t, :space), as: :space,
        preload: [:assigned_people]
      )
      |> Operately.Tasks.Task.scope_space(space_id)
      |> Filters.filter_by_view_access(me.id, named_binding: :space)
      |> Repo.all()

    {:ok, tasks}
  end

  defp load_messages_boards(space_id, me) do
    subquery =
      from(m in Message,
        where: m.state != :draft,
        preload: :author,
        order_by: [desc: m.published_at]
      )

    boards =
      from(b in MessagesBoard, join: s in assoc(b, :space), as: :space, preload: [messages: ^subquery], where: b.space_id == ^space_id)
      |> Filters.filter_by_view_access(me.id, named_binding: :space)
      |> Repo.all()
      |> MessagesBoard.load_messages_comments_count()

    {:ok, boards}
  end

  defp load_resource_hubs(space_id, me) do
    nodes_q = from(n in Node, where: is_nil(n.parent_folder_id)) |> Node.preload_content()

    hubs =
      from(h in ResourceHub,
        preload: [nodes: ^nodes_q],
        where: h.space_id == ^space_id
      )
      |> Filters.filter_by_view_access(me.id)
      |> Repo.all()
      |> ResourceHub.set_children_count()
      |> ResourceHub.load_comments_count()

    {:ok, hubs}
  end
end
