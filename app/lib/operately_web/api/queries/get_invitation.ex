defmodule OperatelyWeb.Api.Queries.GetInvitation do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers
  alias Operately.InviteLinks

  inputs do
    field :token, :string, null: false
  end

  outputs do
    field :invite_link, :invite_link, null: false
    field :member, :person, null: false
  end

  def call(_conn, inputs) do
    with {:ok, invite_link} <- InviteLinks.get_personal_invite_link_by_token(inputs[:token], preload: [:author, :company, person: [:account]]),
         {:ok, invite_link} <- InviteLinks.validate_personal_invite_link(invite_link),
         %{} = person <- invite_link.person do
      {:ok, %{
        invite_link: Serializer.serialize(invite_link, level: :full),
        member: Serializer.serialize(person, level: :full)
      }}
    else
      _ -> {:error, :not_found}
    end
  end
end
