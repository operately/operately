defmodule OperatelyEmail.DateFormatting do
  @moduledoc "Formats email calendar dates in the recipient's scoped Gettext locale."

  use Gettext, backend: OperatelyWeb.Gettext

  alias Operately.ContextualDates.ContextualDate

  def format(nil), do: nil
  def format(%ContextualDate{date_type: :day, date: date}), do: format(date)
  def format(%ContextualDate{date_type: :month, date: date}), do: gettext("%{month} %{year}", month: month(date.month), year: date.year)
  def format(%ContextualDate{date_type: :quarter, date: date}), do: gettext("Q%{quarter} %{year}", quarter: div(date.month - 1, 3) + 1, year: date.year)
  def format(%ContextualDate{date_type: :year, date: date}), do: to_string(date.year)

  def format(value) when is_binary(value) do
    case Date.from_iso8601(value) do
      {:ok, date} -> format(date)
      _ -> value
    end
  end

  def format(%{year: year, month: month, day: day}) do
    gettext("%{month} %{day}, %{year}", month: month(month), day: day, year: year)
  end

  defp month(1), do: pgettext("abbreviated month", "Jan")
  defp month(2), do: pgettext("abbreviated month", "Feb")
  defp month(3), do: pgettext("abbreviated month", "Mar")
  defp month(4), do: pgettext("abbreviated month", "Apr")
  defp month(5), do: pgettext("abbreviated month", "May")
  defp month(6), do: pgettext("abbreviated month", "Jun")
  defp month(7), do: pgettext("abbreviated month", "Jul")
  defp month(8), do: pgettext("abbreviated month", "Aug")
  defp month(9), do: pgettext("abbreviated month", "Sep")
  defp month(10), do: pgettext("abbreviated month", "Oct")
  defp month(11), do: pgettext("abbreviated month", "Nov")
  defp month(12), do: pgettext("abbreviated month", "Dec")
end
