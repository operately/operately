defmodule Operately.Comments.MilestoneComment do
  use Operately.Schema

  schema "milestone_comments" do
    belongs_to :milestone, Operately.Projects.Milestone
    belongs_to :comment, Operately.Updates.Comment

    field :action, Ecto.Enum, values: [:none, :complete, :reopen]

    timestamps()
  end

  def changeset(atts) do
    changeset(%__MODULE__{}, atts)
  end

  def changeset(milestone_comment, attrs) do
    milestone_comment
    |> cast(attrs, [:action, :comment_id, :milestone_id])
    |> validate_required([:action, :comment_id, :milestone_id])
  end
end
