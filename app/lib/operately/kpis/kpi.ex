defmodule Operately.Kpis.Kpi do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "kpis" do
    belongs_to :tenet, Operately.Tenets.Tenet

    field :danger_direction, Ecto.Enum, values: [:above, :below]
    field :danger_threshold, :integer
    field :name, :string
    field :target, :integer
    field :target_direction, Ecto.Enum, values: [:above, :below]
    field :unit, Ecto.Enum, values: [:currency, :number, :percentage, :duration]
    field :warning_direction, Ecto.Enum, values: [:above, :below]
    field :warning_threshold, :integer

    timestamps()
  end

  @doc false
  def changeset(kpi, attrs) do
    kpi
    |> cast(attrs, [:name, :unit, :target, :target_direction, :warning_threshold, :warning_direction, :danger_threshold, :danger_direction, :tenet_id])
    |> validate_required([:name])
  end
end
