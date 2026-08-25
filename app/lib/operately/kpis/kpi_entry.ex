defmodule Operately.Kpis.KpiEntry do
  use Operately.Schema
  use Operately.Repo.Getter

  schema "kpi_entries" do
    belongs_to(:kpi, Operately.Kpis.Kpi, foreign_key: :kpi_id)
    belongs_to(:recorded_by, Operately.People.Person, foreign_key: :recorded_by_id)

    has_one(:access_context, through: [:kpi, :access_context])
    has_many(:comments, Operately.Updates.Comment, where: [entity_type: :kpi_entry], foreign_key: :entity_id)

    field(:value, :float)
    field(:period, :date)
    field(:comments_count, :integer, virtual: true, default: 0)

    timestamps()
    requester_access_level()
    request_info()
  end

  def changeset(attrs = %{}) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(entry, attrs) do
    entry
    |> cast(attrs, [:kpi_id, :value, :period, :recorded_by_id])
    |> validate_required([:kpi_id, :value, :period, :recorded_by_id])
  end
end
