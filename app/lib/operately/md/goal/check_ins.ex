defmodule Operately.MD.Goal.CheckIns do
  def render(check_ins) do
    check_ins_with_comments = load_check_ins_with_comments(check_ins)

    if Enum.empty?(check_ins_with_comments) do
      """
      ## Check-ins

      _No check-ins yet._
      """
    else
      """
      ## Check-ins

      #{Enum.map_join(check_ins_with_comments, "\n\n", &render_check_in/1)}
      """
    end
  end

  defp render_check_in(check_in) do
    """
    ### Check-in on #{render_date(check_in.inserted_at)}

    Author: #{check_in.author.full_name}

    #{render_status_overview(check_in)}

    #{render_targets(check_in.targets || [])}

    #{render_checklist(check_in.checks || [])}

    #### Key wins, obstacles and needs

    #{Operately.MD.RichText.render(check_in.message)}

    #{render_check_in_comments(check_in.comments || [])}
    """
  end

  defp render_check_in_comments([]) do
    ""
  end

  defp render_check_in_comments(comments) do
    """
    #### Comments

    #{Enum.map_join(comments, "\n\n", &render_check_in_comment/1)}
    """
  end

  defp render_check_in_comment(comment) do
    """
    **#{comment.author.full_name}** on #{render_date(comment.inserted_at)}:

    #{Operately.MD.RichText.render(comment.content["message"])}
    """
  end

  defp render_status_overview(check_in) do
    status_text =
      case to_string(check_in.status) do
        "on_track" -> "🟢 **On Track** - The goal is progressing as planned."
        "caution" -> "🟡 **Needs Attention** - The goal needs attention due to emerging risks or delays."
        "off_track" -> "🔴 **Off Track** - The goal is off track due to significant problems affecting success."
        _ -> "**Status**: #{check_in.status}"
      end

    """
    #### Overview

    #{status_text}
    """
  end

  defp render_targets([]) do
    ""
  end

  defp render_targets(targets) do
    target_list =
      Enum.map_join(targets, "\n", fn target ->
        value = format_target_value(target)
        "- #{target.name} - #{value}"
      end)

    """
    #### Targets

    #{target_list}
    """
  end

  defp render_checklist([]) do
    ""
  end

  defp render_checklist(checks) do
    sorted_checks = Enum.sort_by(checks, & &1.index)

    checklist_items =
      Enum.map_join(sorted_checks, "\n", fn check ->
        checkbox = if check.completed, do: "- [x]", else: "- [ ]"
        "#{checkbox} #{check.name}"
      end)

    """
    #### Checklist

    #{checklist_items}
    """
  end

  defp load_check_ins_with_comments(check_ins) do
    Enum.map(check_ins, fn check_in ->
      comments = load_comments_for_check_in(check_in.id)
      targets = check_in.targets || []
      checks = check_in.checks || []

      check_in
      |> Map.put(:comments, comments)
      |> Map.put(:targets, targets)
      |> Map.put(:checks, checks)
    end)
  end

  defp load_comments_for_check_in(check_in_id) do
    import Ecto.Query

    from(c in Operately.Updates.Comment,
      where: c.entity_id == ^check_in_id and c.entity_type == :goal_update,
      order_by: [asc: c.inserted_at],
      preload: [:author]
    )
    |> Operately.Repo.all()
  end

  defp render_date(date) do
    Operately.Time.as_date(date) |> Date.to_iso8601()
  end

  defp format_target_value(target) do
    value = Operately.Goals.Update.Target.format_value(target)
    diff = format_value_difference(target)

    case diff do
      nil -> value
      diff -> "#{value} #{diff}"
    end
  end

  defp format_value_difference(%Operately.Goals.Update.Target{value: value, previous_value: previous_value, from: from, to: to})
       when is_number(value) and is_number(previous_value) and is_number(from) and is_number(to) do
    diff = value - previous_value

    if diff == 0 do
      nil
    else
      diff_text = format_number(abs(diff))
      diff_sign = if diff > 0, do: "+", else: "-"
      sentiment = calculate_target_sentiment(diff, from, to)

      case sentiment do
        :positive -> "(#{diff_sign}#{diff_text})"
        :negative -> "(#{diff_sign}#{diff_text})"
        :neutral -> "(#{diff_sign}#{diff_text})"
      end
    end
  end

  defp format_value_difference(_), do: nil

  defp calculate_target_sentiment(diff, from, to) do
    cond do
      diff == 0 -> :neutral
      from < to -> if diff > 0, do: :positive, else: :negative
      from > to -> if diff > 0, do: :negative, else: :positive
      true -> :neutral
    end
  end

  # Format numbers for human readable output, avoiding scientific notation
  defp format_number(num) when is_integer(num), do: Integer.to_string(num)

  defp format_number(num) when is_float(num) do
    cond do
      num == trunc(num) ->
        Integer.to_string(trunc(num))

      true ->
        # Round to 2 decimal places and then remove trailing zeros, similar to JS parseFloat(fixed).toString()
        rounded = Float.round(num, 2)

        if rounded == trunc(rounded) do
          Integer.to_string(trunc(rounded))
        else
          :erlang.float_to_binary(rounded, [{:decimals, 2}, :compact])
        end
    end
  end
end
