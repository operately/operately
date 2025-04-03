defmodule Operately.Activities.Content.CommentAdded do
  use Operately.Activities.Content

  embedded_schema do
    belongs_to :company, Operately.Companies.Company
    belongs_to :comment_thread, Operately.Comments.CommentThread
    belongs_to :comment, Operately.Updates.Comment

    belongs_to :project, Operately.Projects.Project
    belongs_to :space, Operately.Groups.Group
    belongs_to :goal, Operately.Goals.Goal
    belongs_to :activity, Operately.Activities.Activity
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, __schema__(:fields))
    |> validate_required([:company_id, :comment_thread_id, :comment_id])
  end

  def build(params) do
    changeset(params)
  end
end
