defmodule Operately.Okrs.KeyResult do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "key_results" do
    belongs_to :objective, Operately.Okrs.Objective
    belongs_to :owner, Operately.People.Person, foreign_key: :owner_id
    belongs_to :group, Operately.Groups.Group, foreign_key: :group_id

    field :name, :string
    field :status, Ecto.Enum, values: [:pending, :on_track, :at_risk, :off_track, :completed, :cancelled], default: :pending

    field :target, :integer
    field :unit, Ecto.Enum, values: [:percentage, :number]
    field :direction, Ecto.Enum, values: [:above, :below]

    field :steps_completed, :integer
    field :steps_total, :integer

    timestamps()
  end

  @doc false
  def changeset(key_result, attrs) do
    key_result
    |> cast(attrs, [
      :name, 
      :unit, 
      :target, 
      :direction, 
      :objective_id, 
      :status, 
      :steps_completed, 
      :steps_total, 
      :owner_id, 
      :group_id
    ])
    |> validate_required([:name, :objective_id])
  end
end
