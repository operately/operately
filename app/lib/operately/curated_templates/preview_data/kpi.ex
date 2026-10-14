defmodule Operately.CuratedTemplates.PreviewData.Kpi do
  use Ecto.Schema
  import Ecto.Changeset
  alias Operately.CuratedTemplates.Definitions
  alias Operately.CuratedTemplates.PreviewData.{KpiEntry, KpiAnnotation}
  @primary_key false

  embedded_schema do
    embeds_many :entries, KpiEntry
    embeds_many :annotations, KpiAnnotation
  end

  def changeset(attrs, definition) do
    %__MODULE__{}
    |> Definitions.cast_fields(attrs, [], [], :published)
    |> cast_embed(:entries)
    |> cast_embed(:annotations)
    |> Definitions.limit_children(:entries)
    |> Definitions.limit_children(:annotations)
    |> unique_periods(definition["cadence"])
  end

  defp unique_periods(%{valid?: false} = cs, _cadence), do: cs

  defp unique_periods(cs, cadence) do
    periods = Enum.map(get_field(cs, :entries), &period(&1.date, cadence))
    if length(periods) == length(Enum.uniq(periods)), do: cs, else: add_error(cs, :entries, "is invalid")
  end

  defp period(date, "monthly"), do: Date.beginning_of_month(date)
  defp period(date, "weekly"), do: Date.beginning_of_week(date)
  defp period(date, _), do: date
end
