defmodule OperatelyWeb.Api.Queries.GetInvitation do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers
  alias Operately.InviteLinks

  inputs do
    field :token, :string, null: false
  end

  outputs do
    field :invite_link, :invite_link, null: false
  end

  def call(_conn, inputs) do
    invite_link = fetch_invitation(inputs[:token])

    {:ok, %{invite_link: Serializer.serialize(invite_link, level: :essential)}}
  end

  defp fetch_invitation(token) do
    with(
      {:ok, invite_link} <- InviteLinks.get_personal_invite_link_by_token(token, preload: [:author, :person]),
      {:ok, _invite_link} <- InviteLinks.validate_personal_invite_link(invite_link),
      true <- invite_link.person && invite_link.person.has_open_invitation
    ) do
      invite_link
    else
      _ -> nil
    end
  end
end
