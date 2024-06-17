defmodule Operately.Activities.Preloader do
  @moduledoc """
  Loads the referenced in the activity content.
  """

  import Ecto.Query, only: [from: 2]
  
  alias Operately.Repo
  alias Operately.Activities.Activity

  def preload(activities) when is_list(activities) do
    activities
    |> preload(Operately.Updates.Update)
    |> preload(Operately.People.Person)
    |> preload(Operately.Goals.Goal)
    |> preload(Operately.Groups.Group)
    |> preload(Operately.Projects.Project)
    |> preload(Operately.Projects.CheckIn)
    |> preload(Operately.Projects.Milestone)
    |> preload(Operately.Updates.Comment)
    |> preload_sub_activities()
  end

  def preload(activity = %Activity{}) do
    [activity] |> preload() |> hd()
  end

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
    |> Map.from_struct()
    |> Enum.reduce([], fn {k, v}, acc ->
      case v do
        %Ecto.Association.NotLoaded{__owner__: owner_schema, __field__: field} ->
          if owner_schema.__schema__(:association, field).queryable === schema do
            [{activity.id, k, schema, Map.get(activity.content, String.to_existing_atom("#{k}_id"))} | acc]
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
    keys = Map.keys(Map.from_struct(activity.content))

    content = Enum.reduce(keys, activity.content, fn k, acc ->
      case find_ref(references, activity.id, k) do
        nil -> acc
        {_, _, _, id} -> 
          Map.put(acc, k, Map.get(records, id))
      end
    end)

    %{activity | content: content}
  end

  defp find_ref(references, activity_id, field) do
    Enum.find(references, fn {id, f, _, _} -> id == activity_id and f == field end)
  end

  defp preload_sub_activities(activities) do
    activities
    |> preload(Operately.Activities.Activity)
    |> map_fields(fn _k, v ->
      case v do
        %Activity{} -> 
          v
          |> IO.inspect(label: "Preloading sub activities")
          |> Operately.Activities.cast_content()
          |> Operately.Repo.preload([:author, comment_thread: [comments: :author, reactions: :person]])
          |> preload()
        _ -> v
      end
    end)
  end

  #
  # Helper that goes through a list of activities and maps the fields
  # of the content using the given function.
  #
  defp map_fields(activities, fun) do
    Enum.map(activities, fn a -> 
      keys = Map.keys(Map.from_struct(a.content))

      content = Enum.reduce(keys, a.content, fn k, acc ->
        mapped = fun.(k, Map.get(a.content, k))
        Map.put(acc, k, mapped)
      end)

      %{a | content: content}
    end)
  end
end
