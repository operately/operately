defmodule OperatelyWeb.Api.ProductReleases.Dismiss do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :id, :string, null: false
  end

  outputs do
    field :success, :boolean, null: false
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:company, fn -> find_company(conn) end)
    |> run(:operation, fn ctx ->
      Operately.People.update_person(ctx.me, %{
        preferences: %{dismissed_product_release_id: inputs.id}
      })
    end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, _} -> {:ok, %{success: true}}
      {:error, :me, _} -> {:error, :unauthorized}
      {:error, :company, _} -> {:error, :not_found}
      {:error, :operation, %{error: %Ecto.Changeset{}}} -> {:error, :bad_request}
      _ -> {:error, :internal_server_error}
    end
  end
end
