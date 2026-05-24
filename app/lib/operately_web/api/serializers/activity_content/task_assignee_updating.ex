defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.TaskAssigneeUpdating do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias Operately.People.Person
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    %{
      space: Serializer.serialize(content["space"], level: :essential),
      project: Serializer.serialize(content["project"], level: :essential),
      task: Serializer.serialize(content["task"], level: :essential),
      old_assignee: Serializer.serialize(content["old_assignee"], level: :essential),
      new_assignee: Serializer.serialize(content["new_assignee"], level: :essential),
      added_assignees: Serializer.serialize(load_people(content["added_assignee_ids"]), level: :essential),
      removed_assignees: Serializer.serialize(load_people(content["removed_assignee_ids"]), level: :essential)
    }
  end

  defp load_people(nil), do: []
  defp load_people([]), do: []

  defp load_people(ids) do
    people =
      from(p in Person, where: p.id in ^ids)
      |> Repo.all(with_deleted: true)
      |> Map.new(fn person -> {person.id, person} end)

    Enum.flat_map(ids, fn id ->
      case people[id] do
        nil -> []
        person -> [person]
      end
    end)
  end
end
