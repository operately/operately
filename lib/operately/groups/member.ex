defmodule Operately.Groups.Member do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "members" do
    field :group_id, :binary_id
    field :person_id, :binary_id

    timestamps()
  end

  @doc false
  def changeset(member, attrs) do
    member
    |> cast(attrs, [:group_id, :person_id])
    |> validate_required([:group_id, :person_id])
  end
end
