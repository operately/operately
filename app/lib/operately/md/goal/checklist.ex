defmodule Operately.MD.Goal.Checklist do
  use Gettext, backend: OperatelyWeb.Gettext
  def render(goal) do
    if goal.checks == [] do
      """
      ## #{gettext("Checklist")}

      _#{gettext("No checklist items.")}_
      """
    else
      """
      ## #{gettext("Checklist")}

      #{Enum.map_join(goal.checks, "\n", &render_item/1)}
      """
    end
  end

  defp render_item(item) do
    completion_info =
      if item.completed && item.completed_at do
        " (#{gettext("Completed")}: #{render_date(item.completed_at)})"
      else
        ""
      end

    """
    - [#{if item.completed, do: "x", else: " "}] #{item.name}#{completion_info}
    """
  end

  defp render_date(d) do
    Operately.Time.as_date(d) |> Date.to_iso8601()
  end
end
