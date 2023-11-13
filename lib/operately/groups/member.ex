defmodule Operately.Groups.Member do
  use Operately.Schema

  schema "members" do
    field :group_id, :binary_id
    field :person_id, :binary_id

    timestamps()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(member, attrs) do
    member
    |> cast(attrs, [:group_id, :person_id])
    |> validate_required([:group_id, :person_id])
  end
end
