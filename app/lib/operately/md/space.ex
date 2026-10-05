defmodule Operately.MD.Space do
  use Gettext, backend: OperatelyWeb.Gettext
  def render(space) do
    space = Operately.Repo.preload(space, [:company, :members])

    """
    # #{space.name}

    #{render_overview_info(space)}
    #{render_mission(space)}
    #{render_members(space.members)}
    #{render_task_statuses(space.task_statuses || [])}
    """
    |> compact_empty_lines()
  end

  defp render_overview_info(space) do
    """
    #{gettext("Company")}: #{render_company(space)}
    #{gettext("Type")}: #{render_space_type(space)}
    #{gettext("Members")}: #{length(space.members)}
    #{gettext("Created")}: #{render_date(space.inserted_at)}
    #{gettext("Last Updated")}: #{render_date(space.updated_at)}
    """
    |> then(fn info -> info <> "\n\n" end)
  end

  defp render_mission(space) do
    if blank?(space.mission) do
      """
      ## #{gettext("Mission")}

      _#{gettext("No mission provided.")}_
      """
    else
      """
      ## #{gettext("Mission")}

      #{space.mission}
      """
    end
  end

  defp render_members([]) do
    """
    ## #{gettext("Members")}

    _#{gettext("No members listed.")}_
    """
  end

  defp render_members(members) do
    """
    ## #{gettext("Members")}

    #{members |> Enum.sort_by(& &1.full_name) |> Enum.map_join("\n", fn member -> "- #{member.full_name}#{render_member_title(member)}" end)}
    """
  end

  defp render_task_statuses([]), do: ""

  defp render_task_statuses(statuses) do
    """
    ## #{gettext("Task Statuses")}

    #{statuses |> Enum.sort_by(& &1.index) |> Enum.map_join("\n", fn status ->
      value = status.value || "unknown"
      "- #{status.label} (#{value})"
    end)}
    """
  end

  defp render_company(space) do
    render_association(space.company_id, space.company, & &1.name)
  end

  defp render_space_type(space) do
    cond do
      is_nil(space.company) -> gettext("Unknown")
      space.company.company_space_id == space.id -> gettext("General Space")
      true -> gettext("Space")
    end
  end

  defp render_member_title(%{title: nil}), do: ""
  defp render_member_title(%{title: ""}), do: ""
  defp render_member_title(member), do: " (#{member.title})"

  defp render_association(nil, _association, _formatter), do: gettext("None")

  defp render_association(_id, association, formatter) do
    if is_nil(association), do: gettext("None"), else: formatter.(association)
  end

  defp render_date(d), do: Operately.Time.as_date(d) |> Date.to_iso8601()

  defp compact_empty_lines(text) do
    text |> String.replace(~r/\n{3,}/, "\n\n")
  end

  defp blank?(nil), do: true
  defp blank?(""), do: true
  defp blank?(value), do: String.trim(value) == ""
end
