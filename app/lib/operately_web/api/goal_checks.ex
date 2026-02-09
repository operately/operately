defmodule OperatelyWeb.Api.GoalChecks do
  alias __MODULE__.SharedMultiSteps, as: Steps

  defmodule Add do
    use TurboConnect.Mutation

    inputs do
      field :goal_id, :id, null: false
      field :name, :string, null: false
    end

    outputs do
      field :check_id, :id
      field :success, :boolean
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_goal(inputs.goal_id)
      |> Steps.check_permissions(:can_edit)
      |> Steps.add_check(inputs.name)
      |> Steps.save_activity(:goal_check_adding, fn changes ->
        %{
          company_id: changes.goal.company_id,
          space_id: changes.goal.group_id,
          goal_id: changes.goal.id,
          name: changes.added_check.name
        }
      end)
      |> Steps.commit()
      |> Steps.respond(fn changes -> %{success: true, check_id: OperatelyWeb.Paths.goal_check_id(changes.added_check.id)} end)
    end
  end

  defmodule Delete do
    use TurboConnect.Mutation

    inputs do
      field :goal_id, :id
      field :check_id, :id
    end

    outputs do
      field :success, :boolean
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_goal(inputs.goal_id)
      |> Steps.check_permissions(:can_edit)
      |> Steps.find_check(inputs.check_id)
      |> Steps.delete_check()
      |> Steps.save_activity(:goal_check_removing, fn changes ->
        %{
          company_id: changes.goal.company_id,
          space_id: changes.goal.group_id,
          goal_id: changes.goal.id,
          name: changes.deleted_check.name
        }
      end)
      |> Steps.commit()
      |> Steps.respond(fn _ -> %{success: true} end)
    end
  end

  defmodule Update do
    use TurboConnect.Mutation

    inputs do
      field :goal_id, :id
      field :check_id, :id
      field :name, :string
    end

    outputs do
      field :success, :boolean
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_goal(inputs.goal_id)
      |> Steps.check_permissions(:can_edit)
      |> Steps.find_check(inputs.check_id)
      |> Steps.update_check(inputs.name)
      |> Steps.commit()
      |> Steps.respond(fn _ -> %{success: true} end)
    end
  end

  defmodule UpdateIndex do
    use TurboConnect.Mutation

    inputs do
      field :goal_id, :id
      field :check_id, :id
      field :index, :integer
    end

    outputs do
      field :success, :boolean
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_goal(inputs.goal_id)
      |> Steps.check_permissions(:can_edit)
      |> Steps.find_check(inputs.check_id)
      |> Steps.update_check_index(inputs.index)
      |> Steps.commit()
      |> Steps.respond(fn _ -> %{success: true} end)
    end
  end

  defmodule Toggle do
    use TurboConnect.Mutation

    inputs do
      field :goal_id, :id
      field :check_id, :id
    end

    outputs do
      field :success, :boolean
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_goal(inputs.goal_id)
      |> Steps.check_permissions(:can_edit)
      |> Steps.find_check(inputs.check_id)
      |> Steps.toggle_check()
      |> Steps.save_activity(:goal_check_toggled, fn changes ->
        %{
          company_id: changes.goal.company_id,
          space_id: changes.goal.group_id,
          goal_id: changes.goal.id,
          name: changes.updated_check.name,
          completed: changes.updated_check.completed
        }
      end)
      |> Steps.commit()
      |> Steps.respond(fn _ -> %{success: true} end)
    end
  end

  defmodule SharedMultiSteps do
    require Logger

    def start_transaction(conn) do
      Ecto.Multi.new()
      |> Ecto.Multi.put(:conn, conn)
      |> Ecto.Multi.run(:me, fn _repo, %{conn: conn} ->
        {:ok, conn.assigns.current_person}
      end)
    end

    def find_goal(multi, goal_id) do
      Ecto.Multi.run(multi, :goal, fn _repo, %{me: me} ->
        case Operately.Goals.Goal.get(me, id: goal_id, opts: [preload: [:access_context]]) do
          {:ok, goal} -> {:ok, goal}
          {:error, _} -> {:error, {:not_found, "Goal not found"}}
        end
      end)
    end

    def check_permissions(multi, permission) do
      Ecto.Multi.run(multi, :permissions, fn _repo, %{goal: goal} ->
        Operately.Goals.Permissions.check(goal.request_info.access_level, permission)
      end)
    end

    def add_check(multi, name) do
      Ecto.Multi.insert(multi, :added_check, fn %{goal: goal, me: me} ->
        Operately.Goals.Check.changeset(%{
          goal_id: goal.id,
          creator_id: me.id,
          name: name,
          index: check_count(goal) + 1
        })
      end)
    end

    def find_check(multi, check_id) do
      Ecto.Multi.run(multi, :check, fn _repo, _ ->
        case Operately.Repo.get(Operately.Goals.Check, check_id) do
          nil -> {:error, {:not_found, "Check not found"}}
          check -> {:ok, check}
        end
      end)
    end

    def delete_check(multi) do
      Ecto.Multi.delete(multi, :deleted_check, fn %{check: check} -> check end)
    end

    def update_check(multi, name) do
      Ecto.Multi.update(multi, :updated_check, fn %{check: check} ->
        Operately.Goals.Check.changeset(check, %{name: name})
      end)
    end

    def update_check_index(multi, index) do
      Ecto.Multi.merge(multi, fn %{goal: goal, check: check} ->
        goal
        |> Operately.Repo.preload(:checks)
        |> Map.get(:checks, [])
        |> Enum.sort_by(& &1.index)
        |> Enum.reject(&(&1.id == check.id))
        |> List.insert_at(index, check)
        |> Enum.with_index(1)
        |> Enum.reduce(Ecto.Multi.new(), fn {c, idx}, m ->
          Ecto.Multi.update(m, {:update_check_index, c.id}, Operately.Goals.Check.changeset(c, %{index: idx}))
        end)
      end)
    end

    def toggle_check(multi) do
      Ecto.Multi.update(multi, :updated_check, fn %{check: check} ->
        new_completed = !check.completed
        completed_at = if new_completed, do: DateTime.utc_now(), else: nil
        Operately.Goals.Check.changeset(check, %{completed: new_completed, completed_at: completed_at})
      end)
    end

    def commit(multi) do
      Operately.Repo.transaction(multi)
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

        {:error, _failed_operation, reason, _changes} ->
          Logger.error("Unexpected error in goal checks: #{inspect(reason)}")
          {:error, :internal_server_error}

        e ->
          Logger.error("Unexpected error in goal checks: #{inspect(e)}")
          {:error, :internal_server_error}
      end
    end

    defp check_count(goal) do
      goal
      |> Operately.Repo.preload(:checks)
      |> Map.get(:checks, [])
      |> Enum.count()
    end

    def save_activity(multi, activity_type, callback) do
      Ecto.Multi.merge(multi, fn changes ->
        Operately.Activities.insert_sync(Ecto.Multi.new(), changes.me.id, activity_type, fn _ -> callback.(changes) end)
      end)
    end
  end
end
