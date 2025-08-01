defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.ProjectChampionUpdating do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    %{
      company_id: Serializer.serialize(content["company_id"], level: :essential),
      space_id: Serializer.serialize(content["space_id"], level: :essential),
      project_id: Serializer.serialize(content["project_id"], level: :essential),
      old_champion_id: Serializer.serialize(content["old_champion_id"], level: :essential),
      new_champion_id: Serializer.serialize(content["new_champion_id"], level: :essential),
      company: Serializer.serialize(content["company"], level: :essential),
      space: Serializer.serialize(content["space"], level: :essential),
      project: Serializer.serialize(content["project"], level: :essential),
      old_champion: Serializer.serialize(content["old_champion"], level: :essential),
      new_champion: Serializer.serialize(content["new_champion"], level: :essential)
    }
  end
end
