defmodule Operately.Kpis.KpiAnnotation do
  use Operately.Schema
  use Operately.Repo.Getter

  @title_max_length 80
  @description_max_length 500

  schema "kpi_annotations" do
    belongs_to(:kpi, Operately.Kpis.Kpi, foreign_key: :kpi_id)
    belongs_to(:created_by, Operately.People.Person, foreign_key: :created_by_id)

    has_one(:access_context, through: [:kpi, :access_context])

    field(:date, :date)
    field(:title, :string)
    field(:description, :string)

    timestamps()
    requester_access_level()
    request_info()
  end

  def title_max_length, do: @title_max_length
  def description_max_length, do: @description_max_length

  def changeset(attrs = %{}) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(annotation, attrs) do
    annotation
    |> cast(attrs, [:kpi_id, :date, :title, :description, :created_by_id])
    |> update_change(:title, &trim_text/1)
    |> update_change(:description, &blank_to_nil/1)
    |> validate_required([:kpi_id, :date, :title, :created_by_id])
    |> validate_length(:title, max: @title_max_length)
    |> validate_length(:description, max: @description_max_length)
  end

  defp trim_text(nil), do: nil
  defp trim_text(value) when is_binary(value), do: String.trim(value)

  defp blank_to_nil(nil), do: nil

  defp blank_to_nil(value) when is_binary(value) do
    case String.trim(value) do
      "" -> nil
      trimmed -> trimmed
    end
  end
end
