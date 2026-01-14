defimpl OperatelyWeb.Api.Serializable, for: Operately.InviteLinks.InviteLink do
  def serialize(invite_link, level: :essential) do
    %{
      id: invite_link.id,
      token: invite_link.token,
      type: serialize_type(invite_link.type),
      company_id: invite_link.company_id,
      author: OperatelyWeb.Api.Serializer.serialize(invite_link.author),
      expires_at: OperatelyWeb.Api.Serializer.serialize(invite_link.expires_at),
      use_count: invite_link.use_count,
      is_active: invite_link.is_active,
      inserted_at: OperatelyWeb.Api.Serializer.serialize(invite_link.inserted_at),
      allowed_domains: invite_link.allowed_domains
    }
  end

  def serialize(invite_link, level: :full) do
    serialize(invite_link, level: :essential)
    |> Map.merge(%{
      company: OperatelyWeb.Api.Serializer.serialize(invite_link.company)
    })
  end

  defp serialize_type(nil), do: nil
  defp serialize_type(type), do: Atom.to_string(type)
end
