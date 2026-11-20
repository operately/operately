defmodule OperatelyWeb.Api.Mutations.CreateEmailActivationCode do
  use Gettext, backend: OperatelyWeb.Gettext
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field? :email, :string, null: true
  end

  def call(conn, inputs) do
    with(
      {:ok, :allowed} <- check_signup_allowed(),
      {:ok, _} <- Operately.People.EmailActivationCode.create_for_signup(Map.get(inputs, :email), OperatelyWeb.Analytics.context(conn))
    ) do
      {:ok, %{}}
    else
      {:error, :rate_limited} ->
        {:error, :bad_request, gettext("Please wait before requesting another code.")}

      {:error, %Ecto.Changeset{} = changeset} ->
        {:error, :bad_request, invalid_email_message(changeset), %{field: "email"}}

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
    gettext("Email signup isn't available because email delivery hasn't been configured. Please contact your organization administrator.")
  end

  defp invalid_email_message(changeset) do
    oversized? =
      Enum.any?(changeset.errors, fn
        {:email, {_, options}} -> options[:validation] == :length and options[:kind] == :max
        _ -> false
      end)

    if oversized? do
      gettext("Enter an email address with no more than 255 characters.")
    else
      gettext("Enter a valid email address.")
    end
  end
end
