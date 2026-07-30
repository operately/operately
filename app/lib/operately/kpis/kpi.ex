defmodule Operately.Kpis.Kpi do
  use Operately.Schema

  schema "kpis" do
    belongs_to :space, Operately.Groups.Group, foreign_key: :space_id

    has_many :data_points, Operately.Kpis.DataPoint, preload_order: [asc: :recorded_for]

    field :name, :string
    field :description, :string
    field :unit, :string

    field :target, :float
    field :target_direction, :string
    field :warning_threshold, :float
    field :warning_direction, :string
    field :danger_threshold, :float
    field :danger_direction, :string

    timestamps()
  end

  @cast_fields [
    :space_id,
    :name,
    :description,
    :unit,
    :target,
    :target_direction,
    :warning_threshold,
    :warning_direction,
    :danger_threshold,
    :danger_direction
  ]

  def changeset(attrs), do: changeset(%__MODULE__{}, attrs)

  def changeset(kpi, attrs) do
    kpi
    |> cast(attrs, @cast_fields)
    |> validate_required([:space_id, :name])
  end
end
