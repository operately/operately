defmodule OperatelyWeb.Api.KpiGoalLinks do
  alias Operately.Kpis.GoalLinks
  alias OperatelyWeb.Api.Serializer
  import OperatelyWeb.Api.Helpers, only: [me: 1, company_read_only: 1]

  defmodule ForGoal do
    use TurboConnect.Query

    inputs do
      field :goal_id, :id, null: false
    end

    outputs do
      field :items, list_of(:kpi_goal_link_item), null: false
      field :can_link, :boolean, null: false
    end

    def call(conn, inputs) do
      person = me(conn)
      read_only = company_read_only(conn)

      with {:ok, goal} <- GoalLinks.visible_goal(person, inputs.goal_id) do
        items = GoalLinks.linked_kpis(person, goal, read_only)
        can_link = not read_only and Operately.Repo.exists?(GoalLinks.available_kpis(person))

        {:ok, %{items: Serializer.serialize(items), can_link: can_link}}
      end
    end
  end

  defmodule ForKpi do
    use TurboConnect.Query

    inputs do
      field :kpi_id, :id, null: false
    end

    outputs do
      field :goal, :kpi_goal_link_item, null: true
      field :can_link, :boolean, null: false
    end

    def call(conn, inputs) do
      person = me(conn)
      read_only = company_read_only(conn)

      with {:ok, kpi} <- GoalLinks.visible_kpi(person, inputs.kpi_id) do
        goal = GoalLinks.linked_goal(person, kpi, read_only)

        {:ok, %{goal: Serializer.serialize(goal), can_link: is_nil(kpi.goal_id) and GoalLinks.can_edit_kpi?(kpi, read_only)}}
      end
    end
  end

  defmodule SearchGoals do
    use TurboConnect.Query

    inputs do
      field :kpi_id, :id, null: false
      field :query, :string, null: false
    end

    outputs do
      field :items, list_of(:kpi_goal_link_item), null: false
    end

    def call(conn, inputs) do
      person = me(conn)

      with {:ok, kpi} <- GoalLinks.visible_kpi(person, inputs.kpi_id),
           true <- GoalLinks.can_edit_kpi?(kpi, company_read_only(conn)) do
        {:ok, %{items: Serializer.serialize(GoalLinks.search(GoalLinks.available_goals(person), inputs.query))}}
      else
        false -> {:error, :forbidden}
        error -> error
      end
    end
  end

  defmodule SearchKpis do
    use TurboConnect.Query

    inputs do
      field :goal_id, :id, null: false
      field :query, :string, null: false
    end

    outputs do
      field :items, list_of(:kpi_goal_link_item), null: false
    end

    def call(conn, inputs) do
      person = me(conn)

      with {:ok, _goal} <- GoalLinks.visible_goal(person, inputs.goal_id) do
        {:ok, %{items: Serializer.serialize(GoalLinks.search(GoalLinks.available_kpis(person), inputs.query))}}
      end
    end
  end

  defmodule SetLink do
    @moduledoc "Links or unlinks a KPI and a goal. Unlink the current goal before linking another."
    use TurboConnect.Mutation

    inputs do
      field :goal_id, :id, null: false
      field :kpi_id, :id, null: false
      field :linked, :boolean, null: false
    end

    outputs do
      field :success, :boolean, null: false
    end

    def call(conn, inputs) do
      person = me(conn)

      with {:ok, goal} <- GoalLinks.visible_goal(person, inputs.goal_id),
           {:ok, kpi} <- GoalLinks.visible_kpi(person, inputs.kpi_id),
           true <- GoalLinks.can_edit_kpi?(kpi, company_read_only(conn)),
           :ok <- Operately.Operations.KpiGoalLinking.run(person, kpi, goal, inputs.linked) do
        {:ok, %{success: true}}
      else
        false -> {:error, :forbidden}
        error -> error
      end
    end
  end
end
