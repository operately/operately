defmodule Operately.Comments.MilestoneComment do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "milestone_comments" do
    belongs_to :milestone, Operately.Projects.Milestone
    belongs_to :comment, Operately.Updates.Comment

    field :action, Ecto.Enum, values: [:none, :complete, :reopen]

    timestamps()
  end

  @doc false
  def changeset(milestone_comment, attrs) do
    milestone_comment
    |> cast(attrs, [:action, :comment_id, :milestone_id])
    |> validate_required([:action, :comment_id, :milestone_id])
  end
end
