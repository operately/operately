defmodule Operately.Activities.Content.ResourceHubLinkEdited do
  use Operately.Activities.Content

  defmodule Link do
    use Operately.Activities.Content

    embedded_schema do
      field :name, :string
      field :type, :string
      field :url, :string
    end

    def changeset(link, attrs) do
      link
      |> cast(attrs, __schema__(:fields))
      |> validate_required(__schema__(:fields))
    end
  end

  embedded_schema do
    belongs_to :company, Operately.Companies.Company
    belongs_to :space, Operately.Groups.Group
    belongs_to :resource_hub, Operately.ResourceHubs.ResourceHub
    belongs_to :node, Operately.ResourceHubs.Node
    belongs_to :link, Operately.ResourceHubs.Link

    embeds_one :previous_link, Link
    embeds_one :updated_link, Link
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, [:company_id, :space_id, :resource_hub_id, :node_id, :link_id])
    |> cast_embed(:previous_link)
    |> cast_embed(:updated_link)
    |> validate_required([:company_id, :space_id, :resource_hub_id, :node_id, :link_id])
  end

  def build(params) do
    changeset(params)
  end
end
