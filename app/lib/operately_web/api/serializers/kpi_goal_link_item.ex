defimpl OperatelyWeb.Api.Serializable, for: Operately.Kpis.GoalLinks.Item do
  alias Operately.Goals.Goal
  alias Operately.Kpis.Kpi
  alias OperatelyWeb.Paths

  def serialize(%{resource: %Goal{} = goal, can_unlink: can_unlink}, _) do
    item = %{
      id: Paths.goal_id(goal),
      name: goal.name,
      can_unlink: can_unlink
    }

    if goal.group, do: Map.put(item, :space_name, goal.group.name), else: item
  end

  def serialize(%{resource: %Kpi{} = kpi, can_unlink: can_unlink}, _) do
    %{
      id: Paths.kpi_id(kpi),
      name: kpi.name,
      space_id: Paths.space_id(kpi.space),
      space_name: kpi.space.name,
      can_unlink: can_unlink
    }
  end
end
