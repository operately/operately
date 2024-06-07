defmodule Operately.Access.Binding do
  use Operately.Schema

  schema "access_bindings" do
    belongs_to :group, Operately.Access.Group
    belongs_to :context, Operately.Access.Context
    field :access_level, :integer

    timestamps()
  end

  # view -> 10
  # comment -> 40
  # edit -> 70
  # full -> 100
  @valid_access_levels [10, 40, 70, 100]

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(binding, attrs) do
    binding
    |> cast(attrs, [:group_id, :context_id, :access_level])
    |> validate_inclusion(:access_level, @valid_access_levels, message: "invalid access level")
    |> validate_required([:group_id, :context_id, :access_level])
  end
end
