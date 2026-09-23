defmodule Operately.Activities.Content.ResourceHubDocumentPublicSharingChanged do
  use Operately.Activities.Content

  embedded_schema do
    belongs_to :company, Operately.Companies.Company, type: :string
    belongs_to :space, Operately.Groups.Group, type: :string
    belongs_to :project, Operately.Projects.Project, type: :string
    belongs_to :goal, Operately.Goals.Goal, type: :string
    belongs_to :resource_hub, Operately.ResourceHubs.ResourceHub, type: :string
    belongs_to :node, Operately.ResourceHubs.Node, type: :string
    belongs_to :document, Operately.ResourceHubs.Document, type: :string
    field :enabled, :boolean
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, __schema__(:fields))
    |> validate_required(__schema__(:fields) -- [:project_id, :goal_id])
  end

  def build(params), do: changeset(params)
end
