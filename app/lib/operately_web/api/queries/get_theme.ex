defmodule OperatelyWeb.Api.Queries.GetTheme do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  inputs do

  end

  outputs do
    field :theme, :account_theme
  end

  def call(conn, _inputs) do
    case find_account(conn) do
      {:ok, account} ->
        theme = account.theme || :system
        {:ok, %{theme: theme}}

      {:error, _} ->
        {:ok, %{theme: :system}}
    end
  end
end
