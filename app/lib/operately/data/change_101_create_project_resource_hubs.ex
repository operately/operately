defmodule Operately.Data.Change101CreateProjectResourceHubs do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias __MODULE__.{AccessBinding, AccessContext, KeyResource, Project, ResourceHub, ResourceLink, ResourceNode, SubscriptionList}

  @hub_name "Documents & Files"
  @space_hub_name "Documents & Files"
  @link_type :other

  def run do
    Repo.transaction(fn ->
      sync_existing_space_hub_access()

      from(p in Project, preload: [:key_resources])
      |> Repo.all()
      |> Enum.each(&migrate_project/1)
    end)
  end

  defp sync_existing_space_hub_access do
    from(h in ResourceHub, where: not is_nil(h.space_id) and h.name == ^@space_hub_name)
    |> Repo.all()
    |> Enum.each(&sync_space_hub_access/1)
  end

  defp sync_space_hub_access(hub) do
    hub_context = find_or_create_hub_context(hub)
    space_context = Repo.one(from(c in AccessContext, where: c.group_id == ^hub.space_id))

    if space_context do
      Repo.delete_all(from(b in AccessBinding, where: b.context_id == ^hub_context.id))

      from(b in AccessBinding, where: b.context_id == ^space_context.id)
      |> Repo.all()
      |> Enum.each(fn binding ->
        AccessBinding.changeset(%{
          context_id: hub_context.id,
          group_id: binding.group_id,
          access_level: binding.access_level,
          tag: binding.tag
        })
        |> Repo.insert!()
      end)
    end
  end

  defp migrate_project(project) do
    hub = find_or_create_hub(project)
    hub_context = find_or_create_hub_context(hub)
    sync_access(project, hub_context)
    migrate_key_resources(project, hub)
  end

  defp find_or_create_hub(project) do
    case Repo.one(from(h in ResourceHub, where: h.project_id == ^project.id)) do
      nil ->
        ResourceHub.changeset(%{
          project_id: project.id,
          name: @hub_name,
          description: %{}
        })
        |> Repo.insert!()

      hub ->
        hub
    end
  end

  defp find_or_create_hub_context(hub) do
    case Repo.one(from(c in AccessContext, where: c.resource_hub_id == ^hub.id)) do
      nil -> AccessContext.changeset(%{resource_hub_id: hub.id}) |> Repo.insert!()
      context -> context
    end
  end

  defp sync_access(project, hub_context) do
    project_context = Repo.one!(from(c in AccessContext, where: c.project_id == ^project.id))

    Repo.delete_all(from(b in AccessBinding, where: b.context_id == ^hub_context.id))

    from(b in AccessBinding, where: b.context_id == ^project_context.id)
    |> Repo.all()
    |> Enum.each(fn binding ->
      AccessBinding.changeset(%{
        context_id: hub_context.id,
        group_id: binding.group_id,
        access_level: binding.access_level,
        tag: binding.tag
      })
      |> Repo.insert!()
    end)
  end

  defp migrate_key_resources(project, hub) do
    Enum.each(project.key_resources, fn key_resource ->
      unless link_exists?(hub, key_resource) do
        create_link(project, hub, key_resource)
      end

      Repo.delete!(key_resource)
    end)
  end

  defp link_exists?(hub, key_resource) do
    from(l in ResourceLink,
      join: n in ResourceNode,
      on: n.id == l.node_id,
      where: n.resource_hub_id == ^hub.id and n.name == ^key_resource.title and l.url == ^key_resource.link
    )
    |> Repo.exists?()
  end

  defp create_link(project, hub, key_resource) do
    node =
      ResourceNode.changeset(%{
        resource_hub_id: hub.id,
        name: key_resource.title,
        type: :link
      })
      |> Repo.insert!()

    subscription_list =
      SubscriptionList.changeset(%{parent_type: :resource_hub_link})
      |> Repo.insert!()

    link =
      ResourceLink.changeset(%{
        node_id: node.id,
        author_id: project.creator_id,
        subscription_list_id: subscription_list.id,
        url: key_resource.link,
        description: %{},
        type: @link_type
      })
      |> Repo.insert!()

    SubscriptionList.changeset(subscription_list, %{parent_id: link.id})
    |> Repo.update!()
  end

  defmodule Project do
    use Operately.Schema

    schema "projects" do
      field :creator_id, :binary_id
      has_many :key_resources, Operately.Data.Change101CreateProjectResourceHubs.KeyResource, foreign_key: :project_id
    end
  end

  defmodule KeyResource do
    use Operately.Schema

    schema "project_key_resources" do
      field :title, :string
      field :link, :string
      field :resource_type, :string
      belongs_to :project, Operately.Data.Change101CreateProjectResourceHubs.Project, foreign_key: :project_id

      timestamps()
    end
  end

  defmodule ResourceHub do
    use Operately.Schema

    schema "resource_hubs" do
      field :space_id, :binary_id
      field :project_id, :binary_id
      field :name, :string
      field :description, :map

      timestamps()
    end

    def changeset(attrs), do: changeset(%__MODULE__{}, attrs)

    def changeset(resource_hub, attrs) do
      resource_hub
      |> cast(attrs, [:project_id, :name, :description])
      |> validate_required([:project_id, :name])
    end
  end

  defmodule AccessContext do
    use Operately.Schema

    schema "access_contexts" do
      field :group_id, :binary_id
      field :project_id, :binary_id
      field :resource_hub_id, :binary_id

      timestamps()
    end

    def changeset(attrs), do: changeset(%__MODULE__{}, attrs)

    def changeset(context, attrs) do
      context
      |> cast(attrs, [:group_id, :project_id, :resource_hub_id])
      |> validate_required([])
    end
  end

  defmodule AccessBinding do
    use Operately.Schema

    schema "access_bindings" do
      field :context_id, :binary_id
      field :group_id, :binary_id
      field :access_level, :integer
      field :tag, Ecto.Enum, values: [:champion, :reviewer]

      timestamps()
    end

    def changeset(attrs), do: changeset(%__MODULE__{}, attrs)

    def changeset(binding, attrs) do
      binding
      |> cast(attrs, [:context_id, :group_id, :access_level, :tag])
      |> validate_required([:context_id, :group_id, :access_level])
    end
  end

  defmodule ResourceNode do
    use Operately.Schema

    schema "resource_nodes" do
      field :resource_hub_id, :binary_id
      field :name, :string
      field :type, Ecto.Enum, values: [:document, :folder, :file, :link]

      timestamps()
    end

    def changeset(attrs), do: changeset(%__MODULE__{}, attrs)

    def changeset(node, attrs) do
      node
      |> cast(attrs, [:resource_hub_id, :name, :type])
      |> validate_required([:resource_hub_id, :name, :type])
    end
  end

  defmodule ResourceLink do
    use Operately.Schema

    schema "resource_links" do
      field :node_id, :binary_id
      field :author_id, :binary_id
      field :subscription_list_id, :binary_id
      field :url, :string
      field :description, :map
      field :type, Ecto.Enum, values: [:airtable, :dropbox, :figma, :google, :google_doc, :google_sheet, :google_slides, :notion, :other]

      timestamps()
    end

    def changeset(attrs), do: changeset(%__MODULE__{}, attrs)

    def changeset(link, attrs) do
      link
      |> cast(attrs, [:node_id, :author_id, :subscription_list_id, :url, :description, :type])
      |> validate_required([:node_id, :author_id, :subscription_list_id, :url, :type])
    end
  end

  defmodule SubscriptionList do
    use Operately.Schema

    schema "subscription_lists" do
      field :parent_id, Ecto.UUID

      field :parent_type, Ecto.Enum,
        values: [
          :project_check_in,
          :project_retrospective,
          :goal_update,
          :message,
          :resource_hub_document,
          :resource_hub_file,
          :resource_hub_link,
          :comment_thread,
          :project_task,
          :space_task,
          :project_milestone,
          :project
        ]

      field :send_to_everyone, :boolean, default: false

      timestamps()
    end

    def changeset(attrs), do: changeset(%__MODULE__{}, attrs)

    def changeset(subscription_list, attrs) do
      subscription_list
      |> cast(attrs, [:parent_id, :parent_type, :send_to_everyone])
      |> validate_required([])
    end
  end
end
