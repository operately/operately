defmodule OperatelyWeb.Api.Billing.CreateCheckoutSession do
  use TurboConnect.Mutation

  alias Operately.Billing
  alias OperatelyWeb.Api.Billing.Helpers
  alias OperatelyWeb.Api.Serializer

  inputs do
    field :plan, :billing_plan, null: false
    field :billing_interval, :billing_interval, null: false
  end

  outputs do
    field :session, :billing_checkout_session, null: false
  end

  def call(conn, inputs) do
    with {:ok, %{company: company}} <- Helpers.authorize_billing_management_access(conn),
         {:ok, session} <- Billing.create_checkout_session(company, inputs[:plan], inputs[:billing_interval]) do
      {:ok, %{session: Serializer.serialize(session, level: :essential)}}
    else
      {:error, :not_found} -> {:error, :not_found}
      {:error, :forbidden} -> {:error, :forbidden}
      {:error, :bad_request} -> {:error, :bad_request}
      {:error, :internal_server_error} -> {:error, :internal_server_error}
    end
  end
end
