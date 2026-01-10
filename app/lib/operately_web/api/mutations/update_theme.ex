defmodule OperatelyWeb.Api.Mutations.UpdateTheme do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :theme, :string
  end

  outputs do
    field :success, :boolean
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
