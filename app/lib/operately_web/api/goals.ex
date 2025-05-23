defmodule OperatelyWeb.Api.Goals do
  alias OperatelyWeb.Api

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
      Api.Goals.update_goal(conn, inputs.goal_id, %{name: inputs.name})
    end
  end

  defmodule UpdateDescription do
    use TurboConnect.Mutation

    inputs do
      field :goal_id, :id, required: true
      field :description, :string, required: true
    end

    outputs do
      field :success, :boolean
    end

    def call(conn, inputs) do
      Api.Goals.update_goal(conn, inputs.goal_id, %{description: inputs.description})
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
      Api.Goals.update_goal(conn, inputs.goal_id, fn goal ->
        %{
          timeframe: %{
            start_date: goal.timeframe.start_date,
            end_date: inputs.due_date,
            type: "days"
          }
        }
      end)
    end
  end

  #
  # Utility functions

  def update_goal(conn, goal_id, updates) when is_map(updates) do
    update_goal(conn, goal_id, fn _goal -> updates end)
  end

  def update_goal(conn, goal_id, updates) when is_function(updates) do
    alias Operately.Repo
    alias OperatelyWeb.Api.Helpers
    alias Operately.Goals.{Goal, Permissions}

    with(
      {:ok, me} <- Helpers.find_me(conn),
      {:ok, goal} <- Goal.get(me, id: goal_id),
      {:ok, _} <- Permissions.check(goal.request_info.access_level, :can_edit),
      {:ok, _} <- Goal.changeset(goal, updates.(goal)) |> Repo.update()
    ) do
      {:ok, %{success: true}}
    else
      {:error, reason} -> {:error, reason}
    end
  end
end
