defmodule Operately.Access.AccessBinding do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "access_bindings" do
    belongs_to :access_group, Operately.Access.AccessGroup
    belongs_to :access_context, Operately.Access.AccessContext
    field :access_level, Ecto.Enum, values: [:full_access, :edit_access, :comment_access, :view_access]

    timestamps()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(access_binding, attrs) do
    access_binding
    |> cast(attrs, [:access_group_id, :access_context_id, :access_level])
    |> validate_required([:access_group_id, :access_context_id, :access_level])
  end
end
