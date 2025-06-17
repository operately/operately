defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.GoalChampionUpdating do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    %{
      company: Serializer.serialize(content["company"], level: :essential),
      space: Serializer.serialize(content["space"], level: :essential),
      goal: Serializer.serialize(content["goal"], level: :essential),
      old_champion: Serializer.serialize(content["old_champion"], level: :essential),
      new_champion: Serializer.serialize(content["new_champion"], level: :essential)
    }
  end
end
