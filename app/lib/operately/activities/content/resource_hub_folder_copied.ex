defmodule Operately.Activities.Content.ResourceHubFolderCopied do
  use Operately.Activities.Content

  defmodule FolderInfo do
    use Operately.Activities.Content

    embedded_schema do
      belongs_to :space, Operately.Groups.Group
      belongs_to :resource_hub, Operately.ResourceHubs.ResourceHub
      belongs_to :node, Operately.ResourceHubs.Node
      belongs_to :folder, Operately.ResourceHubs.Folder
    end

    def changeset(folder, attrs) do
      folder
      |> cast(attrs, __schema__(:fields))
      |> validate_required(__schema__(:fields))
    end
  end

  embedded_schema do
    belongs_to :company, Operately.Companies.Company
    belongs_to :space, Operately.Groups.Group
    belongs_to :resource_hub, Operately.ResourceHubs.ResourceHub
    belongs_to :node, Operately.ResourceHubs.Node
    belongs_to :folder, Operately.ResourceHubs.Folder

    embeds_one :original_folder, FolderInfo
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, [:company_id, :space_id, :resource_hub_id, :node_id, :folder_id])
    |> cast_embed(:original_folder)
    |> validate_required([:company_id, :space_id, :resource_hub_id, :node_id, :folder_id])
  end

  def build(params) do
    changeset(params)
  end
end
