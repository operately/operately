defmodule Operately.Activities.ResourceLoader do
  alias Operately.Repo
  import Ecto.Query, warn: false

  def load_resources(activities) do
    resources = 
      Operately.Activities.Activity.resource_types()
      |> Enum.map(fn resource_type -> 
        schema = Operately.Activities.Activity.resource_schema(resource_type)
        ids = get_resource_ids(activities, resource_type)
        records = load_associated_resources(schema, ids)

        {resource_type, records}
      end)
      |> Enum.into(%{})

    Enum.map(activities, fn activity ->
      resource = find_resource(resources, activity.resource_type, activity.resource_id)

      Map.put(activity, :resource, resource)
    end)
  end

  defp find_resource(resources, resource_type, resource_id) do
    resources = Map.get(resources, resource_type)

    Enum.find(resources, fn resource -> resource.id == resource_id end)
  end

  def load_associated_resources(_schema, []) do
    []
  end

  def load_associated_resources(schema, ids) do
    Repo.all(from r in schema, where: r.id in ^ids)
  end

  defp get_resource_ids(activities, resource_type) do
    activities 
    |> Enum.filter(fn activity -> activity.resource_type == resource_type end) 
    |> Enum.map(fn activity -> activity.resource_id end)
    |> Enum.uniq()
  end

end
