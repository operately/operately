defimpl OperatelyWeb.Api.Serializable, for: Operately.Projects.Retrospective do
   def serialize(retrospective, level: :essential) do
    %{
      id: OperatelyWeb.Paths.project_retrospective_id(retrospective),
      author: OperatelyWeb.Api.Serializer.serialize(retrospective.author),
      project: OperatelyWeb.Api.Serializer.serialize(retrospective.project),
      content: Jason.encode!(retrospective.content),
      closed_at: OperatelyWeb.Api.Serializer.serialize(retrospective.closed_at),
      permissions: OperatelyWeb.Api.Serializer.serialize(retrospective.permissions),
      reactions: OperatelyWeb.Api.Serializer.serialize(retrospective.reactions),
      subscription_list: OperatelyWeb.Api.Serializer.serialize(retrospective.subscription_list),
      potential_subscribers: OperatelyWeb.Api.Serializer.serialize(retrospective.potential_subscribers),
    }
  end
end
