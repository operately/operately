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

  def changeset(attrs) do
    %__MODULE__{}
    |> Definitions.cast_fields(attrs, [], [], :published)
    |> cast_embed(:entries)
    |> cast_embed(:annotations)
    |> Definitions.limit_children(:entries)
    |> Definitions.limit_children(:annotations)
    |> unique_periods()
  end

  defp unique_periods(%{valid?: false} = cs), do: cs

  defp unique_periods(cs) do
    periods = Enum.map(get_field(cs, :entries), & &1.period_offset)
    if length(periods) == length(Enum.uniq(periods)), do: cs, else: add_error(cs, :entries, "is invalid")
  end
end
