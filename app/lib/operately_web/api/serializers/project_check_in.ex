defimpl OperatelyWeb.Api.Serializable, for: Operately.Projects.CheckIn do
  def serialize(check_in, level: :essential) do
    %{
      id: OperatelyWeb.Paths.project_check_in_id(check_in),
      status: Atom.to_string(check_in.status),
      description: check_in.description && Jason.encode!(check_in.description),
      inserted_at: OperatelyWeb.Api.Serializer.serialize(check_in.inserted_at),
      acknowledged_at: OperatelyWeb.Api.Serializer.serialize(check_in.acknowledged_at),
      acknowledged_by: OperatelyWeb.Api.Serializer.serialize(check_in.acknowledged_by),
      project: serialize_project_with_permissions(check_in),
      reactions: OperatelyWeb.Api.Serializer.serialize(check_in.reactions),
      author: OperatelyWeb.Api.Serializer.serialize(check_in.author),
      subscription_list: OperatelyWeb.Api.Serializer.serialize(check_in.subscription_list),
      potential_subscribers: OperatelyWeb.Api.Serializer.serialize(check_in.potential_subscribers),
      notifications: OperatelyWeb.Api.Serializer.serialize(check_in.notifications),
      comments_count: check_in.comment_count,
    }
  end

  def serialize(check_in, level: :full) do
    serialize(check_in, level: :essential)
  end

  # If check-in has its own permissions, use those for the project permissions
  # Otherwise, fall back to the project's permissions
  defp serialize_project_with_permissions(check_in) do
    project_data = OperatelyWeb.Api.Serializer.serialize(check_in.project, level: :full)
    
    case check_in.permissions do
      nil -> project_data
      check_in_permissions -> 
        # Override the project permissions with check-in specific permissions
        %{project_data | permissions: OperatelyWeb.Api.Serializer.serialize(check_in_permissions)}
    end
  end
end
