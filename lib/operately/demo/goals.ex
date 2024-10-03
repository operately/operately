defmodule Operately.Demo.Goals do
  alias Operately.Demo.Resources

  def create_goals(resources, data) do
    Resources.create(resources, data, fn {resources, data} ->
      create_goal(resources, data)
    end)
  end

  def create_goal(resources, data) do
    owner = Resources.get(resources, :owner)
    space = Resources.get(resources, data.space)
    champion = Resources.get(resources, data.champion)
    reviewer = Resources.get(resources, data.reviewer)
    parent = data[:parent] && Resources.get(resources, data.parent)

    targets = Enum.with_index(data.targets) |> Enum.map(fn {target, index} ->
      %{
        index: index,
        name: target.name,
        from: target.from,
        to: target.to,
        unit: target.unit
      }
    end)

    if length(targets) == 0 do
      raise ArgumentError, "Must have at least one target"
    end

    {:ok, goal} = Operately.Operations.GoalCreation.run(owner, %{
      space_id: space.id,
      name: data.name,
      champion_id: champion.id,
      reviewer_id: reviewer.id,
      timeframe: create_timeframe(data[:timeframe] || :current_quarter),
      targets: targets,
      parent_goal_id: parent && parent.id,
      anonymous_access_level: 0,
      company_access_level: 70,
      space_access_level: 70,
    })

    if data.update do
      submit_update(goal, data.update)
    end

    goal
  end

  def submit_update(goal, data) do
    goal = Operately.Repo.preload(goal, [:targets, :champion])

    if length(data.target_values) != length(goal.targets) do
      raise ArgumentError, "Number of target values does not match number of targets"
    end

    target_values = Enum.with_index(data.target_values) |> Enum.map(fn {t, index} ->
      id = goal.targets |> Enum.find(fn t -> t.index == index end) |> Map.get(:id)

      %{"id" => id, "value" => floor(t)}
    end)

    {:ok, _} = Operately.Operations.GoalCheckIn.run(goal.champion, goal, %{
      content: Operately.Demo.RichText.from_string(data.content),
      target_values: target_values,
      subscription_parent_type: :goal_update,
      subscriber_ids: [],
    })
  end

  defp create_timeframe(:current_year) do
    {year, _, _} = Date.to_erl(Date.utc_today())

    start_date = Date.new!(year, 1, 1)
    end_date = Date.new!(year, 12, 31)

    %{start_date: start_date, end_date: end_date, type: "year"}
  end

  defp create_timeframe(:current_quarter) do
    {year, month, _day} = Date.to_erl(Date.utc_today())

    {start_month, end_month} = 
      case month do
        1 -> {1, 3}
        2 -> {1, 3}
        3 -> {1, 3}
        4 -> {4, 6}
        5 -> {4, 6}
        6 -> {4, 6}
        7 -> {7, 9}
        8 -> {7, 9}
        9 -> {7, 9}
        10 -> {10, 12}
        11 -> {10, 12}
        12 -> {10, 12}
      end

    start_date = Date.new!(year, start_month, 1)
    end_date = Date.new!(year, end_month, Date.days_in_month(Date.new!(year, end_month, 1)))

    %{start_date: start_date, end_date: end_date, type: "quarter"}
  end
end
