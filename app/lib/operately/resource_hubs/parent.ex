defmodule Operately.ResourceHubs.Parent do
  import Ecto.Query, only: [from: 2]

  alias Operately.Access
  alias Operately.Groups.Group
  alias Operately.Notifications.Subscriber
  alias Operately.Projects.{Contributor, Project}
  alias Operately.Repo
  alias Operately.ResourceHubs.ResourceHub

  def parent_type(%Group{}), do: :space
  def parent_type(%Project{}), do: :project
  def parent_type(%ResourceHub{project_id: project_id}) when not is_nil(project_id), do: :project
  def parent_type(%ResourceHub{}), do: :space

  def company_id(%Group{company_id: company_id}), do: company_id
  def company_id(%Project{company_id: company_id}), do: company_id

  def company_id(%ResourceHub{} = hub) do
    case parent_type(hub) do
      :space -> get_space(hub).company_id
      :project -> get_project(hub).company_id
    end
  end

  def project_id(%Group{}), do: nil
  def project_id(%Project{id: project_id}), do: project_id
  def project_id(%ResourceHub{project_id: project_id}), do: project_id

  def space_id(%Group{id: space_id}), do: space_id
  def space_id(%Project{group_id: space_id}), do: space_id

  def space_id(%ResourceHub{} = hub) do
    case parent_type(hub) do
      :space -> hub.space_id
      :project -> get_project(hub).group_id
    end
  end

  def parent_fields(parent) do
    %{
      company_id: company_id(parent),
      space_id: space_id(parent)
    }
    |> maybe_put(:project_id, project_id(parent))
  end

  def resource_hub_fields(%Group{id: space_id}), do: %{space_id: space_id}
  def resource_hub_fields(%Project{id: project_id}), do: %{project_id: project_id}

  def get_access_context(%Group{id: space_id}), do: Access.get_context!(group_id: space_id)
  def get_access_context(%Project{id: project_id}), do: Access.get_context!(project_id: project_id)

  def get_access_context(%ResourceHub{} = hub) do
    case parent_type(hub) do
      :space -> Access.get_context!(group_id: hub.space_id)
      :project -> Access.get_context!(project_id: hub.project_id)
    end
  end

  def notification_parent(%ResourceHub{} = hub) do
    hub = preload_parent(hub)

    case parent_type(hub) do
      :space ->
        %{id: hub.space.id, type: :space, name: hub.space.name}

      :project ->
        %{id: hub.project.id, type: :project, name: hub.project.name}
    end
  end

  def notification_people(%ResourceHub{} = hub) do
    hub = preload_parent(hub, people: true)

    case parent_type(hub) do
      :space ->
        hub.space.members

      :project ->
        hub.project.contributors
        |> Enum.map(& &1.person)
        |> Enum.reject(&is_nil/1)
    end
  end

  def potential_subscribers(%ResourceHub{} = hub) do
    hub = preload_parent(hub, people: true)

    case parent_type(hub) do
      :space ->
        Subscriber.from_space_members(hub.space.members)

      :project ->
        Subscriber.from_project_contributor(hub.project.contributors)
    end
  end

  def preload_parent(%ResourceHub{} = hub, opts \\ []) do
    people? = Keyword.get(opts, :people, false)

    case parent_type(hub) do
      :space -> preload_space(hub, people?)
      :project -> preload_project(hub, people?)
    end
  end

  def preload_child_resource_hub(resource, opts \\ []) do
    resource = Repo.preload(resource, [:resource_hub], force: true)
    hub = preload_parent(resource.resource_hub, opts)

    Map.put(resource, :resource_hub, hub)
  end

  def prepare_for_notifications(resource) do
    resource = preload_child_resource_hub(resource, people: true)
    Map.put(resource, :access_context, get_access_context(resource.resource_hub))
  end

  defp preload_space(hub, false), do: Repo.preload(hub, [:space], force: true)
  defp preload_space(hub, true), do: Repo.preload(hub, [space: :members], force: true)

  defp preload_project(hub, false), do: Repo.preload(hub, [:project], force: true)

  defp preload_project(hub, true) do
    contributors =
      from(c in Contributor,
        join: person in assoc(c, :person),
        preload: [person: person]
      )

    Repo.preload(hub, [project: [contributors: contributors]], force: true)
  end

  defp get_space(%ResourceHub{space: %Group{} = space}), do: space
  defp get_space(%ResourceHub{space_id: space_id}), do: Repo.get!(Group, space_id)

  defp get_project(%ResourceHub{project: %Project{} = project}), do: project
  defp get_project(%ResourceHub{project_id: project_id}), do: Repo.get!(Project, project_id)

  defp maybe_put(map, _key, nil), do: map
  defp maybe_put(map, key, value), do: Map.put(map, key, value)
end
