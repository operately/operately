defmodule Operately.Access.Binding do
  use Operately.Schema

  @type t :: %__MODULE__{
          id: integer() | nil,
          group_id: integer(),
          context_id: integer(),
          access_level: integer(),
          tag: :champion | :reviewer | nil,
          inserted_at: NaiveDateTime.t() | nil,
          updated_at: NaiveDateTime.t() | nil
        }

  schema "access_bindings" do
    belongs_to :group, Operately.Access.Group
    belongs_to :context, Operately.Access.Context

    field :access_level, :integer
    field :tag, Ecto.Enum, values: [:champion, :reviewer]

    timestamps()
  end

  @no_access 0
  @view_access 10
  @comment_access 40
  @edit_access 70
  @admin_access 90
  @full_access 100

  @valid_access_levels [@no_access, @view_access, @comment_access, @edit_access, @admin_access, @full_access]

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(binding, attrs) do
    binding
    |> cast(attrs, [:group_id, :context_id, :access_level, :tag])
    |> validate_inclusion(:access_level, @valid_access_levels, message: "invalid access level")
    |> validate_required([:group_id, :context_id, :access_level])
    |> foreign_key_constraint(:context_id, name: "access_bindings_context_id_fkey")
  end

  def no_access, do: @no_access
  def view_access, do: @view_access
  def comment_access, do: @comment_access
  def edit_access, do: @edit_access
  def admin_access, do: @admin_access
  def full_access, do: @full_access
  def valid_access_levels, do: @valid_access_levels
  def valid_access_levels(:as_atom), do: @valid_access_levels |> Enum.map(&to_atom/1)

  def from_atom(:no_access), do: @no_access
  def from_atom(:view_access), do: @view_access
  def from_atom(:comment_access), do: @comment_access
  def from_atom(:edit_access), do: @edit_access
  def from_atom(:admin_access), do: @admin_access
  def from_atom(:full_access), do: @full_access

  def to_atom(@no_access), do: :no_access
  def to_atom(@view_access), do: :view_access
  def to_atom(@comment_access), do: :comment_access
  def to_atom(@edit_access), do: :edit_access
  def to_atom(@admin_access), do: :admin_access
  def to_atom(@full_access), do: :full_access

  def label(:no_access), do: "No Access"
  def label(@no_access), do: "No Access"
  def label(:view_access), do: "View Access"
  def label(@view_access), do: "View Access"
  def label(:comment_access), do: "Comment Access"
  def label(@comment_access), do: "Comment Access"
  def label(:edit_access), do: "Edit Access"
  def label(@edit_access), do: "Edit Access"
  def label(:admin_access), do: "Admin Access"
  def label(@admin_access), do: "Admin Access"
  def label(:full_access), do: "Full Access"
  def label(@full_access), do: "Full Access"
end
