defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.ProjectStartDateUpdating do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    %{
      company_id: Serializer.serialize(content["company_id"], level: :essential),
      company: Serializer.serialize(content["company"], level: :essential),
      space_id: Serializer.serialize(content["space_id"], level: :essential),
      space: Serializer.serialize(content["space"], level: :essential),
      project_id: Serializer.serialize(content["project_id"], level: :essential),
      project: Serializer.serialize(content["project"], level: :essential),
      old_start_date: Serializer.serialize(content["old_start_date"], level: :essential),
      new_start_date: Serializer.serialize(content["new_start_date"], level: :essential)
    }
  end
end
