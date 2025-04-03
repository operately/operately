defmodule OperatelyWeb.Api.Queries.GetAccount do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  inputs do
  end

  outputs do
    field :account, :account
  end

  def call(conn, _inputs) do
    account = conn.assigns[:current_account]
    
    if account == nil do
      {:error, :unauthorized}
    else
      {:ok, %{account: %{
        full_name: account.full_name,
        site_admin: account.site_admin,
      }}}
    end
  end
end
