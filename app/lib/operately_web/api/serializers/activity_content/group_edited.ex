defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.GroupEdited do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    %{
      company: Serializer.serialize(content["company"], level: :essential),
      space: Serializer.serialize(content["group"], level: :essential),
      old_name: Serializer.serialize(content["old_name"], level: :essential),
      new_name: Serializer.serialize(content["new_name"], level: :essential),
      old_mission: Serializer.serialize(content["old_mission"], level: :essential),
      new_mission: Serializer.serialize(content["new_mission"], level: :essential)
    }
  end
end
