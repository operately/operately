defmodule OperatelyWeb.Api.Mutations.EditCompany do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field company_id, :string
    field old_name, :string
    field new_name, :string
  end

  outputs do
    field :something, :something  # TODO
  end

  def run(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:attrs, fn -> decode_inputs(inputs) end)
    # TODO: check permissions
    |> run(:operation, fn ctx -> CompanyEditing.run(ctx.me, ctx.attrs) end)
    |> run(:serialized, fn ctx -> {:ok, %{something: Serializer.serialize(ctx.operation, level: :essential)}} end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :attrs, _} -> {:error, :bad_request}
      {:error, :space, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end
end
