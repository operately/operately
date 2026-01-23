defimpl OperatelyWeb.Api.Serializable, for: Operately.People.Person do
  def serialize(%{access_group: %{bindings: bindings}} = data, level: :essential) do
    %{
      id: OperatelyWeb.Paths.person_id(data),
      full_name: data.full_name,
      email: data.email,
      avatar_url: data.avatar_url,
      title: data.title,
      type: data.type,
      access_level: find_access_level(bindings)
    }
  end

  def serialize(data, level: :essential) do
    %{
      id: OperatelyWeb.Paths.person_id(data),
      full_name: data.full_name,
      email: data.email,
      avatar_url: data.avatar_url,
      title: data.title,
      type: data.type
    }
    |> then(fn map ->
      case data.access_level do
        nil -> map
        level -> Map.put(map, :access_level, level)
      end
    end)
  end

  def serialize(data, level: :full) do
    %{
      id: OperatelyWeb.Paths.person_id(data),
      full_name: data.full_name,
      email: data.email,
      avatar_url: data.avatar_url,
      title: data.title,
      type: data.type,
      suspended: data.suspended,
      timezone: data.timezone,
      manager: OperatelyWeb.Api.Serializer.serialize(data.manager),
      reports: OperatelyWeb.Api.Serializer.serialize(data.reports),
      peers: OperatelyWeb.Api.Serializer.serialize(data.peers),
      has_open_invitation: has_open_invitation(data),
      permissions: OperatelyWeb.Api.Serializer.serialize(data.permissions),
      invite_link: OperatelyWeb.Api.Serializer.serialize(data.invite_link),
      agent_def: data.agent_def && OperatelyWeb.Api.Serializer.serialize(data.agent_def, level: :full),
      notify_about_assignments: data.notify_about_assignments,
      description: encode_description(data.description)
    }
  end

  defp find_access_level(bindings) do
    Enum.max_by(bindings, & &1.access_level).access_level
  end

  defp has_open_invitation(%{account: nil}), do: false
  defp has_open_invitation(%{account: %{first_login_at: nil}}), do: true
  defp has_open_invitation(%{account: %{first_login_at: _}}), do: false
  defp has_open_invitation(_), do: nil

  defp encode_description(nil), do: nil
  defp encode_description(description), do: Jason.encode!(description)
end
