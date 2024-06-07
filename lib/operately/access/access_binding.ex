defmodule Operately.Access.Binding do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "access_bindings" do
    belongs_to :group, Operately.Access.Group
    belongs_to :context, Operately.Access.Context
    field :access_level, Ecto.Enum, values: [:full_access, :edit_access, :comment_access, :view_access]

    timestamps()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(binding, attrs) do
    binding
    |> cast(attrs, [:group_id, :context_id, :access_level])
    |> validate_required([:group_id, :context_id, :access_level])
  end
end
