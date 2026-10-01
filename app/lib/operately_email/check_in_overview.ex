defmodule OperatelyEmail.CheckInOverview do
  @moduledoc false
  use Gettext, backend: OperatelyWeb.Gettext
  import Operately.RichContent.Builder

  def construct(resource, status, reviewer, due_date) do
    doc([paragraph(status_message(resource, status) ++ reviewer_note(status, reviewer) ++ deadline(due_date))])
  end

  defp status_message(:goal, :on_track) do
    highlighted(gettext("The goal is <highlight>on-track</highlight> and progressing as planned."), &bg_green/1)
  end

  defp status_message(:goal, :caution) do
    highlighted(gettext("The goal <highlight>needs attention</highlight> due to emerging risks or delays."), &bg_yellow/1)
  end

  defp status_message(:goal, :off_track) do
    highlighted(gettext("The goal is <highlight>off track</highlight> due to significant problems affecting success."), &bg_red/1)
  end

  defp status_message(:project, :on_track) do
    highlighted(gettext("The project is <highlight>on-track</highlight> and progressing as planned."), &bg_green/1)
  end

  defp status_message(:project, :caution) do
    highlighted(gettext("The project <highlight>needs attention</highlight> due to emerging risks or delays."), &bg_yellow/1)
  end

  defp status_message(:project, :off_track) do
    highlighted(gettext("The project is <highlight>off track</highlight> due to significant problems affecting success."), &bg_red/1)
  end

  defp reviewer_note(:on_track, _reviewer), do: []
  defp reviewer_note(_status, nil), do: []
  defp reviewer_note(:caution, reviewer), do: [text(gettext(" %{name} should be aware.", name: Operately.People.Person.first_name(reviewer)))]
  defp reviewer_note(:off_track, reviewer), do: [text(gettext(" %{name}'s help is needed.", name: Operately.People.Person.first_name(reviewer)))]

  defp deadline(nil), do: []

  defp deadline(date) do
    days = Date.diff(date, Date.utc_today())

    if days == 0 do
      [text(gettext(" due today."))]
    else
      {unit, count} = duration(abs(days))
      [text(" ") | highlighted(deadline_message(unit, count, days < 0), &bg_red/1)]
    end
  end

  defp duration(days) when days < 7, do: {:day, days}
  defp duration(days) when days < 30, do: {:week, div(days, 7)}
  defp duration(days), do: {:month, div(days, 30)}

  defp deadline_message(:day, count, true) do
    ngettext("1 day <highlight>overdue.</highlight>", "%{count} days <highlight>overdue.</highlight>", count)
  end

  defp deadline_message(:day, count, false) do
    ngettext("1 day until the deadline.", "%{count} days until the deadline.", count)
  end

  defp deadline_message(:week, count, true) do
    ngettext("1 week <highlight>overdue.</highlight>", "%{count} weeks <highlight>overdue.</highlight>", count)
  end

  defp deadline_message(:week, count, false) do
    ngettext("1 week until the deadline.", "%{count} weeks until the deadline.", count)
  end

  defp deadline_message(:month, count, true) do
    ngettext("1 month <highlight>overdue.</highlight>", "%{count} months <highlight>overdue.</highlight>", count)
  end

  defp deadline_message(:month, count, false) do
    ngettext("1 month until the deadline.", "%{count} months until the deadline.", count)
  end

  # Only catalog-owned emphasis is interpreted; names are rendered as text above.
  defp highlighted(sentence, format) do
    sentence
    |> String.split(["<highlight>", "</highlight>"])
    |> Enum.with_index()
    |> Enum.map(fn {part, index} -> if rem(index, 2) == 1, do: format.(part), else: text(part) end)
  end
end
