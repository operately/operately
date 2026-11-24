defmodule OperatelyWeb.Api.Signup.CreateEmailActivationCode do
  use Gettext, backend: OperatelyWeb.Gettext
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field? :email, :string, null: true
    field? :full_name, :string, null: true
    field? :password, :string, null: true
    field? :invite_token, :string, null: true
  end

  def call(conn, inputs) do
    with(
      {:ok, email} <- Operately.Operations.AccountSigningUp.preflight(inputs),
      {:ok, _} <- Operately.People.EmailActivationCode.create_for_signup(email, OperatelyWeb.Analytics.context(conn))
    ) do
      {:ok, %{}}
    else
      {:error, :rate_limited} ->
        {:error, :bad_request, gettext("Please wait before requesting another code.")}

      {:error, :email_delivery_not_configured} ->
        {:error, :bad_request, email_delivery_not_configured_message()}

      {:error, reason} ->
        OperatelyWeb.Api.Signup.Errors.response(reason)
    end
  end

  defp email_delivery_not_configured_message do
    gettext("Email signup isn't available because email delivery hasn't been configured. Please contact your organization administrator.")
  end
end
