defmodule Operately.Data.Change102MigrateProjectKeyResourcesToResourceHubLinks do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo

  defmodule KeyResource do
    use Operately.Schema

    schema "project_key_resources" do
      field :title, :string
      field :link, :string
      field :resource_type, :string
      field :project_id, :binary_id

      timestamps()
    end
  end

  defmodule Project do
    use Operately.Schema

    schema "projects" do
      field :creator_id, :binary_id

      timestamps()
    end
  end

  defmodule ResourceHub do
    use Operately.Schema

    schema "resource_hubs" do
      field :project_id, :binary_id

      timestamps()
    end
  end

  defmodule Node do
    use Operately.Schema

    schema "resource_nodes" do
      field :resource_hub_id, :binary_id
      field :parent_folder_id, :binary_id
      field :name, :string
      field :type, Ecto.Enum, values: [:document, :folder, :file, :link]

      timestamps()
    end

    def changeset(node, attrs) do
      node
      |> cast(attrs, [:resource_hub_id, :parent_folder_id, :name, :type, :inserted_at, :updated_at])
      |> validate_required([:resource_hub_id, :name, :type])
    end
  end

  defmodule Link do
    use Operately.Schema

    @valid_types [:airtable, :dropbox, :figma, :google, :google_doc, :google_sheet, :google_slides, :notion, :other]

    schema "resource_links" do
      field :node_id, :binary_id
      field :author_id, :binary_id
      field :subscription_list_id, :binary_id
      field :url, :string
      field :description, :map
      field :type, Ecto.Enum, values: @valid_types

      timestamps()
    end

    def changeset(link, attrs) do
      link
      |> cast(attrs, [:node_id, :author_id, :subscription_list_id, :url, :description, :type, :inserted_at, :updated_at])
      |> validate_required([:node_id, :author_id, :url, :type])
    end
  end

  defmodule SubscriptionList do
    use Operately.Schema

    schema "subscription_lists" do
      field :parent_id, Ecto.UUID
      field :parent_type, Ecto.Enum, values: [:resource_hub_link]
      field :send_to_everyone, :boolean, default: false

      timestamps()
    end

    def changeset(subscription_list, attrs) do
      subscription_list
      |> cast(attrs, [:parent_id, :parent_type, :send_to_everyone])
    end
  end

  alias __MODULE__.KeyResource
  alias __MODULE__.Project
  alias __MODULE__.ResourceHub
  alias __MODULE__.Node
  alias __MODULE__.Link
  alias __MODULE__.SubscriptionList

  def run do
    Repo.transaction(fn ->
      key_resources_to_migrate()
      |> Repo.all()
      |> Enum.each(&migrate_key_resource/1)
    end)
  end

  defp key_resources_to_migrate do
    from(kr in KeyResource,
      join: p in Project, on: kr.project_id == p.id,
      join: h in ResourceHub, on: h.project_id == p.id,
      left_join: n in Node, on: n.resource_hub_id == h.id and n.type == :link and n.name == kr.title,
      left_join: l in Link, on: l.node_id == n.id and l.url == kr.link,
      where: is_nil(l.id) and not is_nil(p.creator_id),
      order_by: [asc: kr.inserted_at],
      select: %{
        key_resource: kr,
        resource_hub_id: h.id,
        author_id: p.creator_id
      }
    )
  end

  defp migrate_key_resource(%{key_resource: key_resource, resource_hub_id: resource_hub_id, author_id: author_id}) do
    {:ok, subscription_list} =
      %SubscriptionList{}
      |> SubscriptionList.changeset(%{send_to_everyone: false})
      |> Repo.insert()

    {:ok, node} =
      %Node{}
      |> Node.changeset(%{
        resource_hub_id: resource_hub_id,
        name: key_resource.title,
        type: :link,
        inserted_at: key_resource.inserted_at,
        updated_at: key_resource.updated_at
      })
      |> Repo.insert()

    {:ok, link} =
      %Link{}
      |> Link.changeset(%{
        node_id: node.id,
        author_id: author_id,
        url: key_resource.link,
        type: infer_link_type(key_resource.link),
        subscription_list_id: subscription_list.id,
        inserted_at: key_resource.inserted_at,
        updated_at: key_resource.updated_at
      })
      |> Repo.insert()

    {:ok, _} =
      subscription_list
      |> SubscriptionList.changeset(%{
        parent_id: link.id,
        parent_type: :resource_hub_link
      })
      |> Repo.update()
  end

  def infer_link_type(url) when is_binary(url) do
    url = String.downcase(url)

    cond do
      String.contains?(url, "docs.google.com/document") -> :google_doc
      String.contains?(url, "docs.google.com/spreadsheets") -> :google_sheet
      String.contains?(url, "docs.google.com/presentation") -> :google_slides
      String.contains?(url, "drive.google.com") -> :google
      String.contains?(url, "figma.com") -> :figma
      String.contains?(url, "notion.so") or String.contains?(url, "notion.site") -> :notion
      String.contains?(url, "airtable.com") -> :airtable
      String.contains?(url, "dropbox.com") -> :dropbox
      true -> :other
    end
  end
end
