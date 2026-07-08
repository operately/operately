defimpl OperatelyWeb.Api.Serializable, for: Operately.People.Person do
  def serialize(%{access_group: %{bindings: bindings}} = data, level: :essential) do
    %{
      id: OperatelyWeb.Paths.person_id(data),
      full_name: data.full_name,
      email: data.email,
      avatar_url: data.avatar_url,
      title: data.title,
      type: Atom.to_string(data.type),
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
      type: Atom.to_string(data.type)
    }
    |> then(fn map ->
      case data.access_level do
        nil -> map
        level -> Map.put(map, :access_level, level)
      end
    end)
  end

  def serialize(%{access_group: %{bindings: bindings}} = data, level: :full) do
    serialize_full(data)
    |> Map.put(:access_level, find_access_level(bindings))
  end

  def serialize(data, level: :full) do
    serialize_full(data)
    |> then(fn map ->
      case data.access_level do
        nil -> map
        level -> Map.put(map, :access_level, level)
      end
    end)
  end

  defp serialize_full(data) do
    %{
      id: OperatelyWeb.Paths.person_id(data),
      full_name: data.full_name,
      email: data.email,
      avatar_url: data.avatar_url,
      avatar_blob_id: data.avatar_blob_id,
      title: data.title,
      type: Atom.to_string(data.type),
      suspended: data.suspended,
      timezone: data.timezone,
      time_format: data |> Operately.People.Person.time_format() |> Atom.to_string(),
      manager: OperatelyWeb.Api.Serializer.serialize(data.manager),
      reports: OperatelyWeb.Api.Serializer.serialize(data.reports),
      peers: OperatelyWeb.Api.Serializer.serialize(data.peers),
      has_open_invitation: has_open_invitation(data),
      permissions: OperatelyWeb.Api.Serializer.serialize(data.permissions),
      invite_link: OperatelyWeb.Api.Serializer.serialize(data.invite_link),
      agent_def: data.agent_def && OperatelyWeb.Api.Serializer.serialize(data.agent_def, level: :full),
      email_preference: data |> Operately.People.Person.email_preference() |> Atom.to_string(),
      email_window_minutes: Operately.People.Person.email_window_minutes(data),
      send_daily_summary: Operately.People.Person.send_daily_summary?(data),
      daily_summary_delivery_time: Operately.People.Person.daily_summary_delivery_time(data),
      notify_on_mention: Operately.People.Person.notify_on_mention?(data),
      notify_about_assignments: Operately.People.Person.notify_about_assignments?(data),
      description: encode_description(data.description),
      show_dev_bar: Application.get_env(:operately, :app_env) == :dev
    }
  end

  defp find_access_level([]), do: nil
  defp find_access_level(bindings), do: Enum.max_by(bindings, & &1.access_level).access_level

  defp has_open_invitation(%{account: nil}), do: false
  defp has_open_invitation(%{account: %{first_login_at: nil}}), do: true
  defp has_open_invitation(%{account: %{first_login_at: _}}), do: false
  defp has_open_invitation(_), do: nil

  defp encode_description(nil), do: nil
  defp encode_description(description), do: Jason.encode!(description)
end
