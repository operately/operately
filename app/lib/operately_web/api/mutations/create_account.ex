defmodule OperatelyWeb.Api.Mutations.CreateAccount do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Operations.AccountSigningUp
  alias OperatelyWeb.Api.Serializer

  require Logger

  inputs do
    field? :invite_token, :string, null: true
    field? :code, :string, null: true
    field? :email, :string, null: true
    field? :password, :string, null: true
    field? :full_name, :string, null: true
  end

  outputs do
    field?(:company, :company, null: true)
    field?(:person, :person, null: true)
    field?(:error, :string, null: true)
    field?(:join_error_details, :json, null: true)
  end

  def call(_conn, inputs) do
    case AccountSigningUp.run(inputs.full_name, inputs.email, inputs.password, inputs.code, inputs[:invite_token]) do
      {:ok, _account, invite_context} ->
        {:ok, build_response(invite_context)}

      {:error, error} ->
        Logger.error("Failed to create account. error: #{inspect(error)}")
        {:error, :internal_server_error}
    end
  end

  defp build_response(%{company: company, person: person, error: error, join_error_details: join_error_details}) do
    %{
      company: serialize_optional(company),
      person: serialize_optional(person),
      error: error,
      join_error_details: join_error_details
    }
  end

  defp serialize_optional(nil), do: nil
  defp serialize_optional(resource), do: Serializer.serialize(resource, level: :essential)
end
