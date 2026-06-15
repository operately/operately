defmodule OperatelyEE.AdminApi.Queries.ListSiteMessages do
  use TurboConnect.Query

  alias Operately.SiteMessages

  inputs do
  end

  outputs do
    field :messages, list_of(:site_message)
  end

  def call(_conn, _inputs) do
    messages = SiteMessages.list_all()
    {:ok, %{messages: OperatelyWeb.Api.Serializer.serialize(messages, level: :full)}}
  end
end
