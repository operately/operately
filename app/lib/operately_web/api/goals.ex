defmodule OperatelyWeb.Api.Goals do
  alias OperatelyWeb.Api.Helpers
  alias Operately.Goals.Goal

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
      with(
        {:ok, me} <- Helpers.find_me(conn),
        {:ok, _} <- Goal.update_name(me, inputs.goal_id, inputs.name)
      ) do
        {:ok, %{success: true}}
      end
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
      with(
        {:ok, me} <- Helpers.find_me(conn),
        {:ok, _} <- Goal.update_description(me, inputs.goal_id, inputs.description)
      ) do
        {:ok, %{success: true}}
      end
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
      with(
        {:ok, me} <- Helpers.find_me(conn),
        {:ok, _} <- Goal.update_due_date(me, inputs.goal_id, inputs.due_date)
      ) do
        {:ok, %{success: true}}
      end
    end
  end
end
