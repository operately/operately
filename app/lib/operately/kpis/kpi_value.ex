defmodule Operately.Kpis.KpiValue do
  use Operately.Schema

  @type t :: %__MODULE__{
          id: Ecto.UUID.t() | nil,
          value: float() | nil,
          recorded_at: NaiveDateTime.t() | nil,
          kpi_id: Ecto.UUID.t() | nil,
          person_id: Ecto.UUID.t() | nil,
          inserted_at: NaiveDateTime.t() | nil,
          updated_at: NaiveDateTime.t() | nil
        }

  schema "kpi_values" do
    belongs_to :kpi, Operately.Kpis.Kpi
    belongs_to :person, Operately.People.Person

    field :value, :float
    field :recorded_at, :naive_datetime

    timestamps()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(kpi_value, attrs) do
    kpi_value
    |> cast(attrs, [:value, :recorded_at, :kpi_id, :person_id])
    |> put_default_recorded_at()
    |> validate_required([:value, :recorded_at, :kpi_id, :person_id])
  end

  # recorded_at defaults to the insertion time when it is not supplied.
  defp put_default_recorded_at(changeset) do
    case get_field(changeset, :recorded_at) do
      nil -> put_change(changeset, :recorded_at, NaiveDateTime.truncate(NaiveDateTime.utc_now(), :second))
      _ -> changeset
    end
  end
end
