defmodule Operately.Okrs.Objective do
  use Ecto.Schema
  import Ecto.Changeset

  alias Operately.Alignments.Alignment

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "objectives" do
    belongs_to :group, Operately.Groups.Group, foreign_key: :group_id
    belongs_to :owner, Operately.People.Person, foreign_key: :owner_id
    belongs_to :tenet, Operately.Tenets.Tenet, foreign_key: :tenet_id

    has_many :key_results, Operately.Okrs.KeyResult, on_delete: :delete_all

    has_one :parent, Alignment, foreign_key: :child

    field :description, :map
    field :name, :string

    timestamps()
  end

  @doc false
  def changeset(objective, attrs) do
    objective
    |> cast(attrs, [:name, :description, :group_id, :owner_id, :tenet_id])
    |> validate_required([:name])
  end
end
