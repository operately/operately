defmodule OperatelyWeb.Api.Goals do
  alias __MODULE__.SharedMultiSteps, as: Steps

  defmodule UpdateName do
    use TurboConnect.Mutation

    inputs do
      field :goal_id, :id, required: true
      field :name, :string, required: true
    end

    outputs do
      field :success, :boolean
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_goal(inputs.goal_id)
      |> Steps.check_permissions(:can_edit)
      |> Steps.update_goal_name(inputs.name)
      |> Steps.save_activity(:goal_name_changed, fn changes ->
        %{
          company_id: changes.goal.company_id,
          space_id: changes.goal.group_id,
          goal_id: changes.goal.id,
          old_name: changes.goal.name,
          new_name: changes.updated_goal.name
        }
      end)
      |> Steps.commit()
      |> Steps.respond_with_success_or_error()
    end
  end

  defmodule UpdateDescription do
    use TurboConnect.Mutation

    inputs do
      field :goal_id, :id, required: true
      field :description, :json, required: true
    end

    outputs do
      field :success, :boolean
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_goal(inputs.goal_id)
      |> Steps.check_permissions(:can_edit)
      |> Steps.update_goal_description(inputs.description)
      |> Steps.save_activity(:goal_description_changed, fn changes ->
        %{
          company_id: changes.goal.company_id,
          space_id: changes.goal.group_id,
          goal_id: changes.goal.id,
          old_description: changes.goal.description,
          new_description: inputs.description
        }
      end)
      |> Steps.commit()
      |> Steps.respond_with_success_or_error()
    end
  end

  defmodule UpdateDueDate do
    use TurboConnect.Mutation

    inputs do
      field :goal_id, :id, required: true
      field :due_date, :date, required: true
    end

    outputs do
      field :success, :boolean
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_goal(inputs.goal_id)
      |> Steps.check_permissions(:can_edit)
      |> Steps.update_goal_due_date(inputs.due_date)
      |> Steps.save_activity(:goal_due_date_changed, fn changes ->
        %{
          company_id: changes.goal.company_id,
          space_id: changes.goal.group_id,
          goal_id: changes.goal.id,
          old_due_date: changes.goal.timeframe.end_date,
          new_due_date: changes.updated_goal.timeframe.end_date
        }
      end)
      |> Steps.commit()
      |> Steps.respond_with_success_or_error()
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
      Ecto.Multi.run(multi, :goal, fn _repo, %{me: me} -> Operately.Goals.Goal.get(me, id: goal_id) end)
    end

    def check_permissions(multi, permission) do
      Ecto.Multi.run(multi, :permissions, fn _repo, %{goal: goal} ->
        Operately.Goals.Permissions.check(goal.request_info.access_level, permission)
      end)
    end

    def save_activity(multi, activity_type, callback) do
      Ecto.Multi.merge(multi, fn changes ->
        Operately.Activities.insert_sync(Ecto.Multi.new(), changes.me.id, activity_type, fn _ -> callback.(changes) end)
      end)
    end

    def update_goal_name(multi, new_name) do
      Ecto.Multi.update(multi, :updated_goal, fn %{goal: goal} ->
        Operately.Goals.Goal.changeset(goal, %{name: new_name})
      end)
    end

    def update_goal_description(multi, new_description) do
      Ecto.Multi.update(multi, :updated_goal, fn %{goal: goal} ->
        Operately.Goals.Goal.changeset(goal, %{description: new_description})
      end)
    end

    def update_goal_due_date(multi, new_due_date) do
      Ecto.Multi.update(multi, :updated_goal, fn %{goal: goal} ->
        new_timeframe = Map.put(goal.timeframe, :end_date, new_due_date)
        new_timeframe = Map.put(new_timeframe, :type, "days")
        Operately.Goals.Goal.changeset(goal, %{timeframe: new_timeframe})
      end)
    end

    def commit(multi) do
      Operately.Repo.transaction(multi)
    end

    def respond_with_success_or_error(result) do
      result
      |> case do
        {:ok, _val} ->
          {:ok, %{success: true}}

        {:error, _failed_operation, :not_found, _changes} ->
          {:error, :not_found}

        {:error, _failed_operation, :forbidden, _changes} ->
          {:error, :not_found}

        {:error, _failed_operation, reason, _changes} ->
          Logger.error("Transaction failed: #{inspect(reason)}")
          {:error, :bad_request}
      end
    end
  end
end
