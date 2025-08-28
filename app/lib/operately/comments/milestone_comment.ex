defmodule Operately.Comments.MilestoneComment do
  use Operately.Schema

  @valid_actions [:none, :complete, :reopen]

  schema "milestone_comments" do
    belongs_to :milestone, Operately.Projects.Milestone
    belongs_to :comment, Operately.Updates.Comment

    field :action, Ecto.Enum, values: @valid_actions

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

  def valid_actions, do: @valid_actions
end
