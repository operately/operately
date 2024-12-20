defmodule Operately.ResourceHubs.Node do
  use Operately.Schema
  use Operately.Repo.Getter

  schema "resource_nodes" do
    belongs_to :resource_hub, Operately.ResourceHubs.ResourceHub
    belongs_to :parent_folder, Operately.ResourceHubs.Folder, foreign_key: :parent_folder_id

    field :name, :string
    field :type, Ecto.Enum, values: [:document, :folder, :file, :link]

    has_one :access_context, through: [:resource_hub, :access_context]
    has_one :folder, Operately.ResourceHubs.Folder, foreign_key: :node_id
    has_one :document, Operately.ResourceHubs.Document, foreign_key: :node_id
    has_one :file, Operately.ResourceHubs.File, foreign_key: :node_id

    timestamps()
    soft_delete()
    request_info()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(node, attrs) do
    node
    |> cast(attrs, [:resource_hub_id, :parent_folder_id, :name, :type])
    |> validate_required([:resource_hub_id, :name, :type])
  end

  def preload_nodes, do: [folder: :node, document: :node, file: [:node, :preview_blob, :blob]]

  #
  # After load hooks
  #

  def load_comments_count(nodes) when is_list(nodes) do
    ids = Enum.reduce(nodes, [], fn n, acc ->
      if n.type in [:document, :file] do
        id = if n.document, do: n.document.id, else: n.file.id
        [id | acc]
      else
        acc
      end
    end)

    counts =
      from(c in Operately.Updates.Comment,
        where: c.entity_id in ^ids,
        group_by: c.entity_id,
        select: {c.entity_id, count(c.id)}
      )
      |> Operately.Repo.all()
      |> Enum.into(%{})

    Enum.map(nodes, fn %{document: document, file: file} = node ->
      cond do
        document ->
          count = Map.get(counts, document.id, 0)
          document = Map.put(document, :comments_count, count)
          %{node | document: document}

        file ->
          count = Map.get(counts, file.id, 0)
          file = Map.put(file, :comments_count, count)
          %{node | file: file}

        true ->
          node
      end
    end)
  end
end
