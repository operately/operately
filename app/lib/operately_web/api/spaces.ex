defmodule OperatelyWeb.Api.Spaces do
  alias __MODULE__.SharedMultiSteps, as: Steps

  alias Operately.Groups.Group, as: Space
  alias Operately.Groups.Permissions
  alias OperatelyWeb.Api.Serializer

  defmodule Search do
    use TurboConnect.Query
    use OperatelyWeb.Api.Helpers

    inputs do
      field :query, :string, null: false
      field? :access_level, :access_options, null: false
    end

    outputs do
      field :spaces, list_of(:space), null: false
    end

    def call(conn, inputs) do
      person = me(conn)
      spaces = Space.search(person, inputs.query, inputs[:access_level])

      {:ok, %{spaces: Serializer.serialize(spaces, level: :essential)}}
    end
  end

  defmodule UpdateKanban do
    use TurboConnect.Mutation
    use OperatelyWeb.Api.Helpers

    inputs do
      field :space_id, :id, null: false
      field :task_id, :id, null: false
      field :status, :task_status, null: false
      field :kanban_state, :json, null: false
    end

    outputs do
      field :task, :task
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_space(inputs.space_id)
      |> Steps.find_task(inputs.task_id)
      |> Steps.check_task_permissions(:can_edit)
      |> Steps.update_space_kanban_state(inputs.status, inputs.kanban_state)
      |> Steps.commit()
      |> Steps.broadcast_review_count_update()
      |> Steps.respond(fn changes ->
        %{task: Serializer.serialize(changes.updated_task_with_preloads, level: :full)}
      end)
    end
  end

  defmodule ListMembers do
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
      field :people, list_of(:person), null: true
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
    use TurboConnect.Query
    use OperatelyWeb.Api.Helpers

    inputs do
      field :space_id, :id, null: false
    end

    outputs do
      field :tasks, list_of(:task), null: false
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_space(inputs.space_id)
      |> Steps.check_permissions(:can_view)
      |> Steps.get_tasks()
      |> Steps.commit()
      |> Steps.respond(fn changes ->
        %{tasks: Serializer.serialize(changes.tasks, level: :full)}
      end)
    end
  end

  defmodule UpdateTaskStatuses do
    use TurboConnect.Mutation
    use OperatelyWeb.Api.Helpers

    inputs do
      field :space_id, :id, null: false
      field :task_statuses, list_of(:task_status), null: false
      field? :deleted_status_replacements, list_of(:deleted_status_replacement), null: true
    end

    outputs do
      field :success, :boolean, null: true
    end

    def call(conn, inputs) do
      replacements = inputs[:deleted_status_replacements] || []

      conn
      |> Steps.start_transaction()
      |> Steps.find_space(inputs.space_id)
      |> Steps.check_permissions(:can_edit)
      |> Steps.validate_status_replacements(inputs.task_statuses, replacements)
      |> Steps.update_task_statuses(inputs.task_statuses)
      |> Steps.replace_deleted_task_statuses(replacements)
      |> Steps.commit()
      |> Steps.respond(fn _ -> %{success: true} end)
    end
  end

  defmodule UpdateTools do
    use TurboConnect.Mutation
    use OperatelyWeb.Api.Helpers

    inputs do
      field :space_id, :id, null: false
      field :tools, :update_space_tools_payload, null: false
    end

    outputs do
      field :success, :boolean, null: true
      field :tools, :space_tools, null: true
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
    alias Ecto.Multi
    alias Operately.Repo
    import Ecto.Query, only: [from: 2]

    def start_transaction(conn) do
      Multi.new()
      |> Multi.put(:conn, conn)
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
          {:error, _} -> {:error, {:not_found, "Task not found"}}
        end
      end)
    end

    def check_task_permissions(multi, permission) do
      Multi.run(multi, :permissions, fn _repo, %{task: task} ->
        Operately.Groups.Permissions.check(task.request_info.access_level, permission)
      end)
    end

    def update_space_kanban_state(multi, status, kanban_state) do
      Multi.merge(multi, fn %{me: me, space: space, task: task} ->
        Operately.Operations.KanbanStateUpdating.run(me, %{type: :space, space: space}, task, status, kanban_state)
      end)
    end

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
      Multi.run(multi, :permissions, fn _repo, %{space: space} ->
        Permissions.check(space.request_info.access_level, permission)
      end)
    end

    def update_task_statuses(multi, task_statuses) do
      case task_statuses do
        [] ->
          Multi.run(multi, :validate_task_statuses, fn _repo, _changes ->
            {:error, "At least one task status is required"}
          end)

        _ ->
          Multi.update(multi, :updated_space, fn %{space: space} ->
            Space.changeset(space, %{task_statuses: task_statuses})
          end)
      end
    end

    def update_tools(multi, tools) do
      Multi.update(multi, :updated_space, fn %{space: space} ->
        Space.changeset(space, %{tools: tools})
      end)
    end

    def validate_status_replacements(multi, _task_statuses, []), do: multi

    def validate_status_replacements(multi, task_statuses, replacements) do
      Multi.run(multi, :validate_replacements, fn _repo, _changes ->
        new_status_ids = MapSet.new(task_statuses, & &1.id)
        deleted_status_ids = MapSet.new(replacements, & &1.deleted_status_id)

        invalid_replacements =
          Enum.filter(replacements, fn r ->
            replacement_is_deleted = MapSet.member?(deleted_status_ids, r.replacement_status_id)
            replacement_not_in_new_statuses = not MapSet.member?(new_status_ids, r.replacement_status_id)

            replacement_is_deleted or replacement_not_in_new_statuses
          end)

        if Enum.empty?(invalid_replacements) do
          {:ok, :valid}
        else
          {:error, "Replacement statuses must be existing statuses that are not being deleted"}
        end
      end)
    end

    def replace_deleted_task_statuses(multi, []), do: multi

    def replace_deleted_task_statuses(multi, replacements) do
      Multi.run(multi, :replace_task_statuses, fn _repo, changes ->
        space = Map.get(changes, :updated_space, changes.space)
        replacement_map =
          Map.new(replacements, fn r -> {r.deleted_status_id, r.replacement_status_id} end)

        deleted_status_ids = Map.keys(replacement_map)

        tasks =
          from(t in Operately.Tasks.Task,
            where: t.space_id == ^space.id,
            where: fragment("?->>'id' = ANY(?)", t.task_status, ^deleted_status_ids)
          )
          |> Repo.all()

        new_statuses_by_id = Map.new(space.task_statuses, fn s -> {s.id, s} end)

        results =
          Enum.map(tasks, fn task ->
            old_status_id = task.task_status.id
            new_status_id = Map.get(replacement_map, old_status_id)
            new_status = Map.get(new_statuses_by_id, new_status_id)

            if new_status do
              task
              |> Operately.Tasks.Task.changeset(%{task_status: Map.from_struct(new_status)})
              |> Repo.update()
            else
              {:ok, task}
            end
          end)

        errors = Enum.filter(results, fn
          {:error, _} -> true
          _ -> false
        end)

        if Enum.empty?(errors) do
          {:ok, length(tasks)}
        else
          List.first(errors)
        end
      end)
    end

    def get_tasks(multi) do
      Multi.run(multi, :tasks, fn _repo, %{space: space} ->
        tasks =
          from(t in Operately.Tasks.Task,
            where: t.space_id == ^space.id,
            preload: [:assigned_people]
          )
          |> Repo.all()
          |> Operately.Tasks.Task.load_comments_count()

        {:ok, tasks}
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
        {:error, _failed_operation, {:bad_request, message}, _changes} ->
          {:error, :bad_request, message}

        {:error, _failed_operation, {:not_found, message}, _changes} ->
          {:error, :not_found, message}

        {:error, _failed_operation, :not_found, _changes} ->
          {:error, :not_found}

        {:error, _failed_operation, :forbidden, _changes} ->
          {:error, :forbidden}

        {:error, :updated_space, %Ecto.Changeset{}, _changes} ->
          {:error, :bad_request, "Invalid tools"}

        {:error, :validate_task_statuses, message, _changes} ->
          {:error, :bad_request, message}

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
