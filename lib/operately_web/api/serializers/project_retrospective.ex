defimpl OperatelyWeb.Api.Serializable, for: Operately.Projects.Retrospective do
   def serialize(retrospective, level: :essential) do
    %{
      id: OperatelyWeb.Paths.project_retrospective_id(retrospective),
      author: OperatelyWeb.Api.Serializer.serialize(retrospective.author),
      project: OperatelyWeb.Api.Serializer.serialize(retrospective.project),
      content: Jason.encode!(retrospective.content),
      closed_at: OperatelyWeb.Api.Serializer.serialize(retrospective.closed_at),
    }
  end
end
