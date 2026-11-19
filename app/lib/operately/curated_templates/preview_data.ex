defmodule Operately.CuratedTemplates.PreviewData do
  @moduledoc """
  Validates public example content separately from the resource definition.

  KPI entries and annotations use integer `period_offset` values relative to the
  consumer's current reporting period: 0 is current, -1 is previous. Monthly
  periods start on the first; weekly periods start on Monday. Consumers resolve
  dates at display time using a shared reference date across related examples.
  Existing templates may use an empty map. Instantiation never reads this field.
  """
  import Ecto.Changeset
  alias Operately.CuratedTemplates.Definitions
  alias Operately.CuratedTemplates.PreviewData.Kpi

  def validate(_type, attrs) when attrs == %{}, do: {:ok, %{}}

  def validate(:kpi, attrs) when is_map(attrs) do
    attrs |> Kpi.changeset() |> normalize()
  end

  def validate(_, _), do: {:error, [{"", {"is invalid", []}}]}

  defp normalize(cs) do
    if cs.valid? do
      {:ok, cs |> apply_changes() |> Ecto.embedded_dump(:json) |> Jason.encode!() |> Jason.decode!()}
    else
      {:error, Definitions.errors(cs)}
    end
  end
end
