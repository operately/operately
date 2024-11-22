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
    |> preload(Operately.Goals.Update)
    |> preload(Operately.Groups.Group)
    |> preload(Operately.Projects.Project)
    |> preload(Operately.Projects.CheckIn)
    |> preload(Operately.Projects.Milestone)
    |> preload(Operately.Updates.Comment)
    |> preload(Operately.Companies.Company)
    |> preload(Operately.Messages.Message)
    |> preload(Operately.ResourceHubs.ResourceHub)
    |> preload(Operately.ResourceHubs.Folder)
    |> preload(Operately.ResourceHubs.Node)
    |> preload_sub_activities()
  end

  def preload(activity = %Activity{}) do
    [activity] |> preload() |> hd()
  end

  def preload(activities, schema) do
    references = Enum.flat_map(activities, fn a -> references(a.id, a.content, schema) end)

    ids = Enum.map(references, &elem(&1, 3)) |> Enum.uniq()

    query = from r in schema, where: r.id in ^ids
    opts = [with_deleted: true]
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
  #   {activity_id, ["project_a"], Operately.Projects.Project, "9b3160cd-2ec9-4d85-9ad5-713bfe2c8c86"}
  #   {activity_id, ["project_b"], Operately.Projects.Project, "317221c7-2999-47c6-84e2-6fb588325115"}
  #
  # For embeds, the function will also look for nested references.
  #
  #   embeds_one :subcontet, Operately.Activities.Content.Subcontent
  #
  #   defmodule Operately.Activities.Content.Subcontent do
  #     embedded_schema do
  #       belongs_to :project, Operately.Projects.Project
  #     end
  #   end
  #
  # Returns:
  #
  #   {activity_id, ["subcontent", "project"], Operately.Projects.Project, "9b3160cd-2ec9-4d85-9ad5-713bfe2c8c86"}
  #
  defp references(activity_id, content, schema) do
    content
    |> Map.from_struct()
    |> Enum.reduce([], fn {k, v}, acc ->
      cond do
        is_field_a_not_loaded_ref(k, v, schema) ->
          id = Map.get(content, String.to_existing_atom("#{k}_id"))
          ref = {activity_id, [k], schema, id}

          [ref | acc]

        is_field_an_embed(content, k, v) ->
          subreferences = references(activity_id, v, schema)
          subreferences = Enum.map(subreferences, fn {id, f, s, i} -> {id, [k | f], s, i} end)
          subreferences ++ acc

        is_list(v) ->
          Enum.with_index(v) |> Enum.reduce(acc, fn {item, index}, acc ->
            refs = references(activity_id, item, schema) |> Enum.map(fn {id, f, s, i} -> {id, [k, index | f], s, i} end)
            refs ++ acc
          end)

        true ->
          acc
      end
    end)
  end


  #
  # Checks if the given field is a reference to a schema that is not loaded.
  # To determine if the field is a reference, the function checks if the
  # value is an Ecto.Association.NotLoaded struct and if the schema of the
  # field is the same as the given schema.
  #
  # Example:
  #
  #   belongs_to :project, Operately.Projects.Project
  #
  # > is_field_a_not_loaded_ref("project", %Ecto.Association.NotLoaded{}, Operately.Projects.Project)
  #   => true
  #
  defp is_field_a_not_loaded_ref(_key, value, schema) do
    case value do
      %Ecto.Association.NotLoaded{__owner__: owner_schema, __field__: field} ->
        owner_schema.__schema__(:association, field).queryable == schema
      _ -> false
    end
  end

  #
  # Checks if the given field is an embed and if the related schema is the same
  # as the given schema.
  #
  # Example:
  #
  #   embeds_one :subcontent, Operately.Activities.Content.Subcontent
  #
  # > is_field_an_embed(%Operately.Activities.Content.Subcontent{}, "subcontent", %Operately.Activities.Content.Subcontent{})
  #   => true
  #
  defp is_field_an_embed(_object, _key, value) when not is_map(value) do
    false
  end

  defp is_field_an_embed(object, key, value) when is_map(value) do
    value_type = value.__struct__
    embeds = object.__struct__.__schema__(:embeds)

    key in embeds && object.__struct__.__schema__(:embed, key).related == value_type
  end

  #
  # Injects the records into the activities content.
  #
  # The function goes through the list of activities and for each one
  # it looks for references that are related to the given records.
  #
  # The references are then injected into the content of the activity.
  #
  defp inject(activities, references, records) when is_list(activities) do
    Enum.map(activities, fn a ->
      inject(a, references, records)
    end)
  end

  defp inject(activity, references, records) do
    found = Enum.filter(references, fn {activity_id, _, _, ref_id} ->
      activity_id == activity.id && Map.has_key?(records, ref_id)
    end)

    content = Enum.reduce(found, activity.content, fn {_, path, _, ref_id}, acc ->
      ref = Map.get(records, ref_id)
      path = ref_path_to_access_path(path)

      put_in(acc, path, ref)
    end)

    %{activity | content: content}
  end

  defp preload_sub_activities(activities) do
    activities
    |> preload(Operately.Activities.Activity)
    |> map_fields(fn _k, v ->
      case v do
        %Activity{} ->
          v
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

  defp ref_path_to_access_path([]) do
    []
  end

  defp ref_path_to_access_path([head | tail]) when is_integer(head) do
    [Access.at(head) | ref_path_to_access_path(tail)]
  end

  defp ref_path_to_access_path([head | tail]) when is_atom(head) do
    [Access.key(head) | ref_path_to_access_path(tail)]
  end
end
