defmodule OperatelyWeb.Api.Spaces do
  alias __MODULE__.SharedMultiSteps, as: Steps

  alias Operately.Groups.Group, as: Space
  alias Operately.Groups
  alias Operately.Groups.Permissions
  alias OperatelyWeb.Api.Serializer

  defmodule Search do
    use TurboConnect.Query

    inputs do
      field :query, :string, null: false
    end

    outputs do
      field :spaces, list_of(:space), null: false
    end

    def call(conn, inputs) do
      spaces = Space.search(conn.assigns.current_person, inputs.query)

      {:ok, %{spaces: Serializer.serialize(spaces, level: :essential)}}
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

  defmodule UpdateTaskStatuses do
    use TurboConnect.Mutation
    use OperatelyWeb.Api.Helpers

    inputs do
      field :space_id, :id, null: false
      field :task_statuses, list_of(:task_status), null: false
    end

    outputs do
      field :success, :boolean, null: true
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_space(inputs.space_id)
      |> Steps.check_permissions(:can_edit_statuses)
      |> Steps.update_task_statuses(inputs.task_statuses)
      |> Steps.commit()
      |> Steps.respond(fn _ -> %{success: true} end)
    end
  end

  defmodule SharedMultiSteps do
    alias Ecto.Multi
    alias Operately.Repo

    def start_transaction(conn) do
      Multi.new()
      |> Multi.put(:conn, conn)
      |> Multi.run(:me, fn _repo, %{conn: conn} ->
        {:ok, conn.assigns.current_person}
      end)
    end

    def find_space(multi, space_id) do
      Multi.run(multi, :space, fn _repo, _changes ->
        case Repo.get(Space, space_id) do
          nil -> {:error, {:not_found, "Space not found"}}
          space -> {:ok, space}
        end
      end)
    end

    def check_permissions(multi, permission) do
      Multi.run(multi, :permissions, fn _repo, %{me: me, space: space} ->
        access_level = Groups.get_access_level(space.id, me.id)
        Permissions.check(access_level, permission)
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
        {:error, _failed_operation, {:not_found, message}, _changes} ->
          {:error, :not_found, message}

        {:error, _failed_operation, :not_found, _changes} ->
          {:error, :not_found}

        {:error, _failed_operation, :forbidden, _changes} ->
          {:error, :forbidden}

        {:error, :validate_task_statuses, message, _changes} ->
          {:error, :bad_request, message}

        {:error, _failed_operation, _reason, _changes} ->
          {:error, :internal_server_error}

        _ ->
          {:error, :internal_server_error}
      end
    end
  end
end
