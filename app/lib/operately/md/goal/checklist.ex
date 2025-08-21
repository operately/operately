defmodule Operately.MD.Goal.Checklist do
  import Ecto.Query, only: [from: 2, where: 3]

  def render(goal) do
    if goal.checks == [] do
      """
      ## Checklist

      _No checklist items._
      """
    else
      """
      ## Checklist

      #{Enum.map_join(goal.checks, "\n", &render_item(&1, goal.id))}
      """
    end
  end

  defp render_item(item, goal_id) do
    completion_info = if item.completed do
      get_completion_timestamp(item.name, goal_id)
    else
      ""
    end

    """
    - [#{if item.completed, do: "x", else: " "}] #{item.name}#{completion_info}
    """
  end

  defp get_completion_timestamp(item_name, goal_id) do
    activity = from(a in Operately.Activities.Activity,
      where: a.resource_id == ^goal_id,
      where: a.action == "goal_check_toggled",
      where: fragment("?->>'name' = ? AND ?->>'completed' = 'true'", a.content, ^item_name, a.content),
      preload: [:author],
      order_by: [desc: a.inserted_at],
      limit: 1
    )
    |> Operately.Repo.one()

    if activity do
      timestamp = activity.inserted_at |> Operately.Time.as_date() |> Date.to_iso8601()
      " (completed by #{activity.author.full_name} on #{timestamp})"
    else
      ""
    end
  end
end
