defmodule Operately.Activities.Content.ResourceHubFileCreated do
  use Operately.Activities.Content

  defmodule File do
    use Operately.Activities.Content

    embedded_schema do
      belongs_to :file, Operately.ResourceHubs.File
      belongs_to :node, Operately.ResourceHubs.File
    end

    def changeset(file, attrs) do
      file
      |> cast(attrs, __schema__(:fields))
      |> validate_required(__schema__(:fields))
    end
  end

  embedded_schema do
    belongs_to :company, Operately.Companies.Company
    belongs_to :space, Operately.Groups.Group
    belongs_to :resource_hub, Operately.ResourceHubs.ResourceHub
    embeds_many :files, File
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, [:company_id, :space_id, :resource_hub_id])
    |> cast_embed(:files)
    |> validate_required([:company_id, :space_id, :resource_hub_id])
  end

  def build(params) do
    changeset(params)
  end
end
