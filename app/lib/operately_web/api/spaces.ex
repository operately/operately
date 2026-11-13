defmodule OperatelyWeb.Api.Spaces do
  alias __MODULE__.SharedMultiSteps, as: Steps

  alias Operately.Groups.Group, as: Space
  alias Operately.Groups.Permissions
  alias OperatelyWeb.Api.Serializer

  defmodule Search do
    @moduledoc """
    Searches for spaces.
    """

    use TurboConnect.Query
    use OperatelyWeb.Api.Helpers

    inputs do
      field :query, :string, null: false
      field? :access_level, :access_options, null: false
      field? :ignored_ids, list_of(:id), null: false
      field? :with_tasks_enabled_only, :boolean, null: false
    end

    outputs do
      field :spaces, list_of(:space), null: false
    end

    def call(conn, inputs) do
      person = me(conn)
      opts = [
        ignored_ids: inputs[:ignored_ids] || [],
        with_tasks_enabled_only: inputs[:with_tasks_enabled_only]
      ]

      spaces = search_spaces(conn, person, inputs.query, inputs[:access_level], opts)

      {:ok, %{spaces: Serializer.serialize(spaces, level: :essential)}}
    end

    defp search_spaces(conn, person, query, access_level, opts) do
      if company_read_only(conn) && access_level && access_level != :view_access do
        []
      else
        Space.search(person, query, access_level, opts)
      end
    end
  end

  defmodule CountByAccessLevel do
    @moduledoc """
    Counts spaces by access level.
    """

    use TurboConnect.Query
    use OperatelyWeb.Api.Helpers

    inputs do
      field :access_level, :access_options, null: false
    end

    outputs do
      field :count, :integer, null: false
    end

    def call(conn, inputs) do
      with {:ok, person} <- find_me(conn) do
        count = count_spaces(conn, person, inputs.access_level)

        {:ok, %{count: count}}
      else
        {:error, :not_found} -> {:ok, %{count: 0}}
      end
    end

    defp count_spaces(conn, person, access_level) do
      if company_read_only(conn) && access_level != :view_access do
        0
      else
        Space.count_by_access_level(person, access_level)
      end
    end
  end

  defmodule UpdateKanban do
    @moduledoc """
    Updates ordering and task status on the selected board, or the space’s default board when board_id is omitted.
    """

    use TurboConnect.Mutation
    use OperatelyWeb.Api.Helpers

    inputs do
      field :space_id, :id, null: false
      field? :board_id, :id, null: true
      field :task_id, :id, null: false
      field :status, :task_status, null: false
      field :kanban_state, :json, null: false
    end

    outputs do
      field :board_id, :id, null: false
      field :task, :task, null: false
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_space(inputs.space_id)
      |> Steps.find_task(inputs.task_id)
      |> Steps.check_task_permissions(:can_edit)
      |> Steps.find_board(inputs[:board_id])
      |> Steps.update_space_kanban_state(inputs.status, inputs.kanban_state)
      |> Steps.commit()
      |> Steps.broadcast_review_count_update()
      |> Steps.respond(fn changes ->
        %{task: Serializer.serialize(changes.updated_task_with_preloads, level: :full), board_id: Operately.ShortUuid.encode!(changes.board.id)}
      end)
    end
  end

  defmodule ListMembers do
    @moduledoc """
    Lists members of a space.
    """

    use TurboConnect.Query
    use OperatelyWeb.Api.Helpers

    import Ecto.Query, only: [from: 2]
    import Operately.Access.Filters, only: [filter_by_view_access: 2]

    alias Operately.Groups.{Group, Member}
    alias Operately.People.Person
    alias Operately.Repo

    inputs do
      field :space_id, :id, null: false
      field? :query, :string, null: true
      field? :ignored_ids, list_of(:id), null: true
    end

    outputs do
      field :people, list_of(:person), null: false
    end

    def call(conn, inputs) do
      person = me(conn)

      if has_permissions?(person, inputs.space_id) do
        inputs
        |> load_members()
        |> Serializer.serialize(level: :essential)
        |> then(&{:ok, %{people: &1}})
      else
        {:ok, %{people: []}}
      end
    end

    defp has_permissions?(person, space_id) do
      from(g in Group, where: g.id == ^space_id)
      |> filter_by_view_access(person.id)
      |> Repo.exists?()
    end

    defp load_members(inputs) do
      inputs
      |> build_query()
      |> Repo.all()
    end

    defp build_query(inputs) do
      from(p in Person,
        join: m in Member,
        on: m.person_id == p.id,
        where: m.group_id == ^inputs.space_id,
        where: p.suspended == false,
        order_by: [asc: p.full_name]
      )
      |> maybe_filter_query(inputs[:query])
      |> maybe_ignore_ids(inputs[:ignored_ids])
    end

    defp maybe_filter_query(query, nil), do: query
    defp maybe_filter_query(query, ""), do: query

    defp maybe_filter_query(query, search) do
      from(p in query, where: ilike(p.full_name, ^"%#{search}%") or ilike(p.title, ^"%#{search}%"))
    end

    defp maybe_ignore_ids(query, nil), do: query
    defp maybe_ignore_ids(query, []), do: query

    defp maybe_ignore_ids(query, ids) do
      from(p in query, where: p.id not in ^ids)
    end
  end

  defmodule ListTasks do
    @moduledoc """
    Lists tasks across all boards in a space. Supply board_id to filter to one board.
    """

    use TurboConnect.Query
    use OperatelyWeb.Api.Helpers

    inputs do
      field :space_id, :id, null: false
      field? :board_id, :id, null: true
    end

    outputs do
      field :tasks, list_of(:task), null: false
    end

    def call(conn, inputs), do: OperatelyWeb.Api.Tasks.List.call(conn, inputs)
  end

  defmodule UpdateTaskStatuses do
    @moduledoc """
    Updates task statuses on the selected board, or the space’s default board when board_id is omitted.
    """

    use TurboConnect.Mutation
    use OperatelyWeb.Api.Helpers

    inputs do
      field :space_id, :id, null: false
      field? :board_id, :id, null: true
      field :task_statuses, list_of(:task_status), null: false
      field? :deleted_status_replacements, list_of(:deleted_status_replacement), null: true
    end

    outputs do
      field :board_id, :id, null: false
      field :success, :boolean, null: false
    end

    def call(conn, inputs) do
      replacements = inputs[:deleted_status_replacements] || []

      conn
      |> Steps.start_transaction()
      |> Steps.find_space(inputs.space_id)
      |> Steps.check_permissions(:can_edit)
      |> Steps.find_board(inputs[:board_id])
      |> Steps.validate_status_replacements(inputs.task_statuses, replacements)
      |> Steps.require_status_replacements(inputs.task_statuses, replacements)
      |> Steps.update_task_statuses(inputs.task_statuses)
      |> Steps.replace_deleted_task_statuses(replacements)
      |> Steps.commit()
      |> Steps.respond(fn changes -> %{success: true, board_id: Operately.ShortUuid.encode!(changes.board.id)} end)
    end
  end

  defmodule UpdateTools do
    @moduledoc """
    Updates the tools configuration for a space.
    """

    use TurboConnect.Mutation
    use OperatelyWeb.Api.Helpers

    inputs do
      field :space_id, :id, null: false
      field :tools, :update_space_tools_payload, null: false
    end

    outputs do
      field :success, :boolean, null: false
      field :tools, :space_tools, null: false
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_space(inputs.space_id)
      |> Steps.check_permissions(:can_edit)
      |> Steps.update_tools(inputs.tools)
      |> Steps.commit()
      |> Steps.respond(fn changes ->
        updated_space = Map.get(changes, :updated_space, changes.space)
        %{success: true, tools: Serializer.serialize(updated_space.tools, level: :essential)}
      end)
    end
  end

  defmodule SharedMultiSteps do
    use Gettext, backend: OperatelyWeb.Gettext
    alias Ecto.Multi
    alias Operately.Repo

    def start_transaction(conn) do
      Multi.new()
      |> Multi.put(:conn, conn)
      |> Multi.put(:company_read_only, OperatelyWeb.Api.Helpers.company_read_only(conn))
      |> Multi.run(:me, fn _repo, %{conn: conn} ->
        {:ok, conn.assigns.current_person}
      end)
    end

    def find_space(multi, space_id) do
      Multi.run(multi, :space, fn _repo, %{me: me} ->
        Space.get(me, id: space_id)
      end)
    end

    def find_task(multi, task_id) do
      Multi.run(multi, :task, fn _repo, %{me: me} ->
        case Operately.Tasks.Task.get(me, id: task_id, opts: [preload: [:assigned_people]]) do
          {:ok, task} -> {:ok, task}
          {:error, _} -> {:error, {:not_found, gettext("Task not found")}}
        end
      end)
    end

    def check_task_permissions(multi, permission) do
      Multi.run(multi, :permissions, fn _repo, %{task: task, company_read_only: company_read_only} ->
        Operately.Groups.Permissions.check(task.request_info.access_level, permission, company_read_only: company_read_only)
      end)
    end

    def find_board(multi, board_id) do
      Multi.run(multi, :board, fn _repo, %{me: me, space: space} ->
        with {:ok, board} <- OperatelyWeb.Api.Tasks.BoardScope.resolve(me, space, board_id) do
          Operately.Tasks.BoardSync.lock_board(board.id)
        end
      end)
    end

    defdelegate update_space_kanban_state(multi, status, kanban_state), to: OperatelyWeb.Api.Tasks.BoardMultiSteps, as: :update_kanban

    def broadcast_review_count_update(result) do
      case result do
        {:ok, changes} ->
          broadcast(changes[:task])
          broadcast(changes[:updated_task_with_preloads] || changes[:updated_task])

        _result ->
          :ok
      end

      result
    end

    defp broadcast(task = %Operately.Tasks.Task{}) do
      if Ecto.assoc_loaded?(task.assigned_people) do
        Enum.each(task.assigned_people, fn person ->
          OperatelyWeb.Api.Subscriptions.AssignmentsCount.broadcast(person_id: person.id)
        end)
      end
    end

    defp broadcast(_), do: :ok

    def check_permissions(multi, permission) do
      Multi.run(multi, :permissions, fn _repo, %{space: space, company_read_only: company_read_only} ->
        Permissions.check(space.request_info.access_level, permission, company_read_only: company_read_only)
      end)
    end

    defdelegate update_task_statuses(multi, statuses), to: OperatelyWeb.Api.Tasks.BoardMultiSteps
    defdelegate require_status_replacements(multi, statuses, replacements), to: OperatelyWeb.Api.Tasks.BoardMultiSteps
    defdelegate validate_status_replacements(multi, statuses, replacements), to: OperatelyWeb.Api.Tasks.BoardMultiSteps
    defdelegate replace_deleted_task_statuses(multi, replacements), to: OperatelyWeb.Api.Tasks.BoardMultiSteps

    def update_tools(multi, tools) do
      Multi.update(multi, :updated_space, fn %{space: space} ->
        Space.changeset(space, %{tools: tools})
      end)
    end

    def commit(multi) do
      Repo.transaction(multi)
    end

    def respond(result, ok_callback, error_callback \\ &handle_error/1) do
      case result do
        {:ok, changes} ->
          {:ok, ok_callback.(changes)}

        {:error, _, :idempotent, changes} ->
          {:ok, ok_callback.(changes)}

        e ->
          error_callback.(e)
      end
    end

    defp handle_error(reason) do
      case reason do
        {:error, _step, {:bad_request, message, details}, _changes} ->
          {:error, :bad_request, message, details}

        {:error, _failed_operation, {:bad_request, message}, _changes} ->
          {:error, :bad_request, message}

        {:error, _failed_operation, {:not_found, message}, _changes} ->
          {:error, :not_found, message}

        {:error, _failed_operation, :not_found, _changes} ->
          {:error, :not_found}

        {:error, _failed_operation, :forbidden, _changes} ->
          {:error, :forbidden}

        {:error, _failed_operation, :bad_request, _changes} ->
          {:error, :bad_request}

        {:error, :updated_board, %Ecto.Changeset{}, _changes} ->
          {:error, :bad_request, gettext("Invalid status")}

        {:error, :updated_space, %Ecto.Changeset{}, _changes} ->
          {:error, :bad_request, gettext("Invalid tools")}

        {:error, :validate_task_statuses, message, _changes} ->
          {:error, :bad_request, message}

        {:error, :require_status_replacements, :replacement_required, _changes} ->
          {:error, :bad_request, gettext("Every deleted task status in use requires a replacement")}

        {:error, :validate_replacements, message, _changes} ->
          {:error, :bad_request, message}

        {:error, _failed_operation, _reason, _changes} ->
          {:error, :internal_server_error}

        _ ->
          {:error, :internal_server_error}
      end
    end
  end
end
