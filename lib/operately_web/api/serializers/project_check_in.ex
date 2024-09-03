defimpl OperatelyWeb.Api.Serializable, for: Operately.Projects.CheckIn do
  def serialize(check_in, level: :essential) do
    %{
      id: OperatelyWeb.Paths.project_check_in_id(check_in),
      status: check_in.status,
      description: check_in.description && Jason.encode!(check_in.description),
      inserted_at: OperatelyWeb.Api.Serializer.serialize(check_in.inserted_at),
      acknowledged_at: OperatelyWeb.Api.Serializer.serialize(check_in.acknowledged_at),
      acknowledged_by: OperatelyWeb.Api.Serializer.serialize(check_in.acknowledged_by),
      project: OperatelyWeb.Api.Serializer.serialize(check_in.project, level: :full),
      reactions: OperatelyWeb.Api.Serializer.serialize(check_in.reactions),
      author: OperatelyWeb.Api.Serializer.serialize(check_in.author),
      subscription_list: OperatelyWeb.Api.Serializer.serialize(check_in.subscription_list)
    }
  end

  def serialize(check_in, level: :full) do
    serialize(check_in, level: :essential)
  end
end
