defmodule Operately.Comments.MilestoneComment do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "milestone_comments" do
    field :action, Ecto.Enum, values: [:none, :complete, :reopen]
    field :comment_id, :binary_id
    field :milestone_id, :binary_id

    timestamps()
  end

  @doc false
  def changeset(milestone_comment, attrs) do
    milestone_comment
    |> cast(attrs, [:action])
    |> validate_required([:action])
  end
end
