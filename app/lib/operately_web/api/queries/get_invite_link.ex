defmodule OperatelyWeb.Api.Queries.GetInviteLink do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  inputs do
    field? :token, :string, null: false
  end

  outputs do
    field? :invite_link, :invite_link, null: true
  end

  def call(_conn, inputs) do
    invite_link = Operately.InviteLinks.get_invite_link_by_token(inputs[:token])

    case invite_link do
      nil -> {:ok, %{invite_link: nil}}
      link -> {:ok, %{invite_link: Serializer.serialize(link, level: :full)}}
    end
  end
end