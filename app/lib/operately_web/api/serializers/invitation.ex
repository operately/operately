defimpl OperatelyWeb.Api.Serializable, for: Operately.Invitations.Invitation do
  def serialize(inv, level: :essential) do
    %{
      id: inv.id,
      admin: OperatelyWeb.Api.Serializer.serialize(inv.admin),
      member: OperatelyWeb.Api.Serializer.serialize(inv.member, level: :full),
      company: OperatelyWeb.Api.Serializer.serialize(inv.company),
    }
    |> add_expiration_if_present(inv)
  end

  def serialize(inv, level: :full) do
    serialize(inv, level: :essential) |> Map.merge(%{
      token: inv.invitation_token && inv.invitation_token.token,
    })
  end

  defp add_expiration_if_present(map, inv) do
    case inv.invitation_token do
      nil -> map
      %Ecto.Association.NotLoaded{} -> map
      token -> Map.put(map, :expires_at, OperatelyWeb.Api.Serializer.serialize(token.valid_until))
    end
  end
end
