defmodule OperatelyWeb.Api.SignupErrors do
  use Gettext, backend: OperatelyWeb.Gettext
  alias Operately.Billing.EnforceLimits
  alias Operately.Billing.EnforceLimits.LimitError

  def response(%Ecto.Changeset{} = changeset) do
    # Only serialize known validation messages, never parameters or passwords.
    field = Enum.find([:email, :full_name, :password], &Keyword.has_key?(changeset.errors, &1))
    if field do
      field_error(field, field_message(field, Keyword.get_values(changeset.errors, field)))
    else
      {:error, :internal_server_error}
    end
  end

  def response(:email_taken), do: field_error(:email, gettext("Email is already registered"))
  def response(:invalid_code), do: field_error(:code, gettext("Invalid activation code"))
  def response(:not_found), do: field_error(:code, gettext("Invalid activation code"))
  def response(:invalid), do: field_error(:code, gettext("Activation code has expired"))
  def response(:signup_not_allowed), do: {:error, :forbidden, gettext("Email signup is not available.")}
  def response({:invitation, %LimitError{} = error}), do: field_error(:invite_token, EnforceLimits.public_message(error))
  def response({:invitation, :personal}), do: field_error(:invite_token, gettext("This invitation is for an existing account. Open your invitation link to sign in."))

  def response({:invitation, :invite_link_domain_not_allowed}) do
    {:error, :bad_request, gettext("This email domain is not allowed by the invitation."), %{field: "email", reason: "invite_link_domain_not_allowed"}}
  end

  def response({:invitation, _}), do: field_error(:invite_token, gettext("This invitation is no longer valid. Ask your company administrator for a new link."))
  def response(_), do: {:error, :internal_server_error}

  defp field_error(field, message), do: {:error, :bad_request, message, %{field: to_string(field)}}

  defp field_message(:email, errors) do
    cond do
      Enum.any?(errors, fn {_, opts} -> opts[:validation] == :unsafe_unique or opts[:constraint] == :unique end) ->
        gettext("Email is already registered")

      maximum?(errors) ->
        gettext("Enter an email address with no more than 255 characters.")

      true ->
        gettext("Enter a valid email address.")
    end
  end

  defp field_message(:full_name, _), do: gettext("Enter your full name using no more than 255 characters.")

  defp field_message(:password, errors) do
    if maximum?(errors) do
      gettext("Use a password with no more than 72 UTF-8 bytes. Some characters use more than one byte.")
    else
      gettext("Use at least 12 characters, including an uppercase letter, a lowercase letter, and a number.")
    end
  end

  defp field_message(_, _), do: gettext("There was an unexpected error. Please try again later.")

  defp maximum?(errors), do: Enum.any?(errors, fn {_, opts} -> opts[:validation] == :length and opts[:kind] == :max end)
end
