defmodule Operately.Activities.Preloader do
  @moduledoc """
  Loads the referenced in the activity content.
  """

  import Ecto.Query, only: [from: 2]
  
  alias Operately.Repo

  def preload(activities, :update), do: preload(activities, Operately.Updates.Update)
  def preload(activities, :person), do: preload(activities, Operately.People.Person)
  def preload(activities, :project), do: preload(activities, Operately.Projects.Project)
  def preload(activities, :goal), do: preload(activities, Operately.Goals.Goal)
  def preload(activities, :group), do: preload(activities, Operately.Groups.Group)

  def preload(activities, schema) do
    references = Enum.flat_map(activities, fn a -> references(a, schema) end)
    ids = Enum.map(references, &elem(&1, 3)) |> Enum.uniq()

    query = from r in schema, where: r.id in ^ids
    opts = [include_deleted: true]
    records = Repo.all(query, opts) |> Enum.map(fn r -> {r.id, r} end) |> Map.new()

    inject(activities, references, records)
  end

  #
  # Takes an activity and returns a list of references to preload
  # that are related to the given schema.
  #
  # The lookup is done by checking the content of the activity
  # and looking for fields that are not yet loaded and are related
  # to the given schema.
  # 
  # The references are returned as a list of tuples with the following
  # structure:
  #
  #   {activity_id, field_name, schema, id}
  #
  # Example:
  #
  #   belongs_to :project_a, Operately.Projects.Project
  #   belongs_to :project_b, Operately.Projects.Project
  #
  # Returns:
  #
  #   {activity_id, "project_a", Operately.Projects.Project, "project_a_id"},
  #   {activity_id, "project_b", Operately.Projects.Project, "project_b_id"}
  #
  defp references(activity, schema) do
    activity.content
    |> Enum.reduce([], fn {k, v}, acc ->
      case v do
        %Ecto.Association.NotLoaded{__owner__: owner_schema} ->
          if owner_schema == schema do
            [{activity.id, k, schema, "#{k}_id"} | acc]
          else
            acc
          end
        _ -> acc
      end
    end)
  end

  defp inject(activities, references, records) when is_list(activities) do
    Enum.map(activities, fn a -> 
      inject(a, references, records)
    end)
  end

  defp inject(activity, references, records) do
    Enum.map(activity.content, fn {k, v} ->
      case find_ref(references, activity.id, k) do
        nil -> {k, v}
        {_, _, _, id} -> {k, Map.get(records, v[id])}
      end
    end) 
    |> Enum.into(%{})
  end

  defp find_ref(references, activity_id, field) do
    Enum.find(references, fn {id, f, _, _} -> id == activity_id and f == field end)
  end
end
