defmodule Operately.Groups.Contact do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "contacts" do
    belongs_to :group, Operately.Groups.Group

    field :name, :string
    field :value, :string
    field :type, Ecto.Enum, values: [:slack]

    timestamps()
  end

  @doc false
  def changeset(member, attrs) do
    member
    |> cast(attrs, [:group_id, :name, :value, :type])
    |> validate_required([:group_id, :name, :value, :type])
  end
end
