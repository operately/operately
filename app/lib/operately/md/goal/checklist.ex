defmodule Operately.MD.Goal.Checklist do
  def render(goal) do
    if goal.checks == [] do
      """
      ## Checklist

      _No checklist items._
      """
    else
      """
      ## Checklist

      #{Enum.map_join(goal.checks, "\n", &render_item/1)}
      """
    end
  end

  defp render_item(item) do
    """
    - [#{if item.completed, do: "x", else: " "}] #{item.name}
    """
  end
end
