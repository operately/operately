defmodule Operately.Activities.Content.ProjectDiscussionSubmitted do
  use Operately.Activities.Content

  embedded_schema do
    belongs_to :company, Operately.Companies.Company
    belongs_to :project, Operately.Projects.Project
    belongs_to :discussion, Operately.Updates.Update

    field :title, :string
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, __schema__(:fields))
    |> validate_required(__schema__(:fields))
  end

  def build(params) do
    project = Operately.Projects.get_project!(params["project_id"])
    discussion = Operately.Updates.get_update!(params["update_id"])

    changeset(%{
      company_id: project.company_id,
      project_id: project.id,
      discussion_id: discussion.id,
      title: discussion.content["title"]
    })
  end
end
