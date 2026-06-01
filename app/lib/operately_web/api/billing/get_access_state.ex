defmodule OperatelyWeb.Api.Billing.GetAccessState do
  use TurboConnect.Query

  alias Operately.Billing
  alias OperatelyWeb.Api.Billing.Helpers
  alias OperatelyWeb.Api.Serializer

  inputs do
  end

  outputs do
    field :access_state, :billing_company_access_state, null: false
  end

  def call(conn, _inputs) do
    with {:ok, %{company: company}} <- Helpers.authorize_member_billing_read_access(conn) do
      access_state = Billing.get_company_access_state(company)

      {:ok,
       %{
         access_state:
           access_state.account
           |> serialize_access_state_account()
           |> Map.put(:member_limit, access_state.member_limit)
           |> Map.put(:storage_limit, access_state.storage_limit)
       }}
    end
  end

  defp serialize_access_state_account(nil) do
    %{
      access_state: :normal,
      access_state_reason: nil,
      access_state_started_at: nil,
      access_state_ends_at: nil
    }
  end

  defp serialize_access_state_account(account) do
    Serializer.serialize(account, level: :essential)
  end
end
