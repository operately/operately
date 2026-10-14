defmodule Operately.CuratedTemplates.PreviewData do
  @moduledoc """
  Validates public example content separately from the resource definition.

  KPI entries contain a calendar date and numeric value; annotations contain a
  calendar date and title. Dates stay fixed so related examples can share periods.
  Existing templates may use an empty map. Instantiation never reads this field.
  """
  import Ecto.Changeset
  alias Operately.CuratedTemplates.Definitions
  alias Operately.CuratedTemplates.PreviewData.Kpi

  def validate(_type, attrs, _definition) when attrs == %{}, do: {:ok, %{}}

  def validate(:kpi, attrs, definition) when is_map(attrs) do
    attrs |> Kpi.changeset(definition) |> normalize()
  end

  def validate(_, _, _), do: {:error, [{"", {"is invalid", []}}]}

  defp normalize(cs) do
    if cs.valid? do
      {:ok, cs |> apply_changes() |> Ecto.embedded_dump(:json) |> Jason.encode!() |> Jason.decode!()}
    else
      {:error, Definitions.errors(cs)}
    end
  end
end
