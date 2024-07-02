defmodule Operately.Access.Binding do
  use Operately.Schema

  schema "access_bindings" do
    belongs_to :group, Operately.Access.Group
    belongs_to :context, Operately.Access.Context
    field :access_level, :integer

    timestamps()
  end

  @no_access 0
  @view_access 10
  @comment_access 40
  @edit_access 70
  @full_access 100

  @valid_access_levels [@no_access, @view_access, @comment_access, @edit_access, @full_access]

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(binding, attrs) do
    binding
    |> cast(attrs, [:group_id, :context_id, :access_level])
    |> validate_inclusion(:access_level, @valid_access_levels, message: "invalid access level")
    |> validate_required([:group_id, :context_id, :access_level])
  end

  def no_access, do: @no_access
  def view_access, do: @view_access
  def comment_access, do: @comment_access
  def edit_access, do: @edit_access
  def full_access, do: @full_access
  def valid_access_levels, do: @valid_access_levels
end
