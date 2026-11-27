defmodule Operately.Activities.Content.DiscussionCommentSubmitted do
  use Operately.Activities.Content

  embedded_schema do
    belongs_to :company, Operately.Companies.Company
    belongs_to :project, Operately.Projects.Project
    belongs_to :space, Operately.Groups.Group
    belongs_to :discussion, Operately.Messages.Message
    belongs_to :comment, Operately.Updates.Comment
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, __schema__(:fields))
    |> validate_required([:company_id, :space_id, :discussion_id, :comment_id])
  end

  def build(params) do
    changeset(params)
  end
end
