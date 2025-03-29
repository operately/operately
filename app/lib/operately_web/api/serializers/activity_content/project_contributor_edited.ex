defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.ProjectContributorEdited do
  def serialize(content, level: :essential) do
    %{
      project: OperatelyWeb.Api.Serializer.serialize(content["project"], level: :essential),
      previous_contributor: %{
        person: OperatelyWeb.Api.Serializer.serialize(content["previous_contributor"]["person"], level: :essential),
        person_id: content["previous_contributor"]["person_id"],
        role: content["previous_contributor"]["role"],
        permissions: content["previous_contributor"]["permissions"]
      },
      updated_contributor: %{
        person: OperatelyWeb.Api.Serializer.serialize(content["updated_contributor"]["person"], level: :essential),
        person_id: content["updated_contributor"]["person_id"],
        role: content["updated_contributor"]["role"],
        permissions: content["updated_contributor"]["permissions"]
      }
    }
  end
end
