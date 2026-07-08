defmodule OperatelyWeb.Api.McpGrants do
  defmodule List do
    use TurboConnect.Query
    use OperatelyWeb.Api.Helpers

    alias Operately.Mcp
    alias OperatelyWeb.Api.Serializer

    outputs do
      field :mcp_grants, list_of(:mcp_grant)
    end

    def call(conn, _inputs) do
      if conn.assigns[:api_auth_mode] == :api_token do
        {:error, :forbidden}
      else
        with {:ok, account} <- find_account(conn),
             {:ok, company} <- find_company(conn) do
          grants = Mcp.list_grants_for_company(account, company)

          {:ok, %{mcp_grants: Enum.map(grants, &Serializer.serialize(&1, level: :essential))}}
        end
      end
    end
  end

  defmodule Revoke do
    use TurboConnect.Mutation
    use OperatelyWeb.Api.Helpers

    alias Operately.Mcp

    inputs do
      field :id, :id
    end

    outputs do
      field :success, :boolean, null: false
    end

    def call(conn, inputs) do
      if conn.assigns[:api_auth_mode] == :api_token do
        {:error, :forbidden}
      else
        with {:ok, account} <- find_account(conn),
             {:ok, company} <- find_company(conn),
             {:ok, grant_id} <- decode_id(inputs.id),
             :ok <- Mcp.revoke_grant_for_company(account, company, grant_id) do
          {:ok, %{success: true}}
        else
          {:error, :not_found} -> {:error, :not_found}
        end
      end
    end
  end
end
