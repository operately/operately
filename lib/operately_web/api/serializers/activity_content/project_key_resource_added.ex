defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.ProjectKeyResourceAdded do
  def serialize(content, level: :essential) do
    %{
      project: OperatelyWeb.Api.Serializer.serialize(content.project),
      project_id: OperatelyWeb.Paths.project_id(content.project),
    }
  end
end
