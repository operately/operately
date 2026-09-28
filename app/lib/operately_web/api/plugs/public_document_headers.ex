defmodule OperatelyWeb.Api.Plugs.PublicDocumentHeaders do
  def init(opts), do: opts
  def call(conn, _opts) do
    if conn.assigns.turbo_req_name == "documents/get_public" do
      OperatelyWeb.PublicDocumentController.put_public_headers(conn)
    else
      conn
    end
  end
end
