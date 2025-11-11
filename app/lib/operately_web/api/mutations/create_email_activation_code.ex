defmodule OperatelyWeb.Api.Mutations.CreateEmailActivationCode do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field? :email, :string, null: true
  end

  def call(_conn, inputs) do
    with(
      {:ok, :allowed} <- check_signup_allowed(),
      {:ok, _} <- Operately.People.EmailActivationCode.create(inputs.email)
    ) do
      {:ok, %{}}
    else
      {:error, :email_delivery_not_configured} ->
        {:error, :bad_request, email_delivery_not_configured_message()}

      {:error, _} ->
        {:error, :internal_server_error}
    end
  end

  defp check_signup_allowed() do
    if Application.get_env(:operately, :allow_signup_with_email) do
      {:ok, :allowed}
    else
      {:error, :signup_not_allowed}
    end
  end

  defp email_delivery_not_configured_message do
    "Email signup isn't available because email delivery hasn't been configured. Please contact your workspace administrator."
  end

end
