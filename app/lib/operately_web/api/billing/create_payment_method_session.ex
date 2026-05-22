defmodule OperatelyWeb.Api.Billing.CreatePaymentMethodSession do
  use TurboConnect.Mutation

  alias Operately.Billing
  alias OperatelyWeb.Api.Billing.Helpers
  alias OperatelyWeb.Api.Serializer

  inputs do
    field? :return_to, :string, null: true
  end

  outputs do
    field :session, :billing_hosted_session, null: false
  end

  def call(conn, inputs) do
    with {:ok, %{company: company}} <- Helpers.authorize_owner_billing_access(conn),
         {:ok, session} <- Billing.create_payment_method_session(company, return_to: inputs[:return_to]) do
      {:ok, %{session: Serializer.serialize(session, level: :essential)}}
    else
      {:error, :not_found} -> {:error, :not_found}
      {:error, :forbidden} -> {:error, :forbidden}
      {:error, :bad_request} -> {:error, :bad_request}
      {:error, :internal_server_error} -> {:error, :internal_server_error}
    end
  end
end
