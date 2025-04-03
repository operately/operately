defmodule Operately.Activities.Content.ResourceHubDocumentCreated do
  use Operately.Activities.Content

  embedded_schema do
    belongs_to :company, Operately.Companies.Company
    belongs_to :space, Operately.Groups.Group
    belongs_to :resource_hub, Operately.ResourceHubs.ResourceHub
    belongs_to :node, Operately.ResourceHubs.Node
    belongs_to :document, Operately.ResourceHubs.Document
    field :name, :string
    belongs_to :copied_document, Operately.ResourceHubs.Document
    belongs_to :copied_document_node, Operately.ResourceHubs.Node
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, __schema__(:fields))
    |> validate_required([:company_id, :space_id, :resource_hub_id, :node_id, :document_id, :name])
  end

  def build(params) do
    changeset(params)
  end
end
