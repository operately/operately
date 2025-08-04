defmodule OperatelyWeb.Api.GoalChecks do
  defmodule Add do
    use TurboConnect.Mutation

    inputs do
      field :goal_id, :id
      field :name, :string
    end

    outputs do
      field :check_id, :id
      field :success, :boolean
    end

    def call(_conn, _inputs) do
      raise "AddCheck not implemented yet"
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

    def call(_conn, _inputs) do
      raise "DeleteCheck not implemented yet"
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

    def call(_conn, _inputs) do
      raise "UpdateCheck not implemented yet"
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

    def call(_conn, _inputs) do
      raise "UpdateCheckIndex not implemented yet"
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

    def call(_conn, _inputs) do
      raise "ToggleCheck not implemented yet"
    end
  end
end
