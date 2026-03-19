defmodule OperatelyWeb.Api.People.UpdateTheme do
  @moduledoc """
  Updates the theme preference for the current account.
  """

  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :theme, :account_theme, null: false
  end

  outputs do
    field :success, :boolean, null: false
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:account, fn -> find_account(conn) end)
    |> run(:operation, fn ctx -> Operately.People.update_theme(ctx.account, inputs.theme) end)
    |> respond()
  end

  def respond(result) do
    case result do
      {:ok, _} -> {:ok, %{success: true}}
      {:error, :account, _} -> {:error, :unauthorized}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end
end
