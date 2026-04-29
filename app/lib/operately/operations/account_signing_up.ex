defmodule Operately.Operations.AccountSigningUp do
  alias Operately.People.{Account, EmailActivationCode}
  alias Operately.Repo

  require Logger

  @doc """
  Creates a new account after validating the email activation code.
  Optionally joins a company via an invite token.

  Returns:
    - `{:ok, account, invite_context}` on success, where `invite_context` is
      `%{company: company_or_nil, person: person_or_nil, error: error_string_or_nil}`
    - `{:error, :signup_not_allowed}` when email signup is disabled
    - `{:error, :email_taken}` when the email is already registered
    - `{:error, :invalid_code}` when the activation code format is invalid
    - `{:error, :not_found}` when no matching activation record exists
    - `{:error, :invalid}` when the activation code has expired
    - `{:error, %Ecto.Changeset{}}` when account creation fails
  """
  def run(full_name, email, password, code, invite_token \\ nil) do
    with {:ok, :allowed} <- check_signup_allowed(),
         {:ok, _} <- check_email_available(email),
         {:ok, parsed_code} <- parse_code(code),
         {:ok, activation} <- EmailActivationCode.get(:system, email: email, code: parsed_code),
         {:ok, :valid} <- check_validity(activation),
         {:ok, account} <- Account.create(full_name, email, password),
         {:ok, invite_context} <- handle_invite_token(account, invite_token) do
      {:ok, account, invite_context}
    end
  end

  defp check_signup_allowed do
    if Application.get_env(:operately, :allow_signup_with_email) do
      {:ok, :allowed}
    else
      {:error, :signup_not_allowed}
    end
  end

  defp check_email_available(email) do
    if Operately.People.get_account_by_email(email) do
      {:error, :email_taken}
    else
      {:ok, :available}
    end
  end

  defp check_validity(activation) do
    if DateTime.compare(activation.expires_at, DateTime.utc_now()) == :gt do
      {:ok, :valid}
    else
      {:error, :invalid}
    end
  end

  defp parse_code(nil), do: {:error, :invalid_code}

  defp parse_code(code) do
    code = String.trim(code)

    cond do
      String.length(code) == 6 ->
        {:ok, code}

      String.length(code) == 7 ->
        {:ok, String.slice(code, 0, 3) <> String.slice(code, 4, 6)}

      true ->
        {:error, :invalid_code}
    end
  end

  defp handle_invite_token(_account, nil), do: {:ok, %{company: nil, person: nil, error: nil}}

  defp handle_invite_token(account, token) do
    case Operately.InviteLinks.join_company_via_invite_link(account, token) do
      {:ok, person} ->
        person = Repo.preload(person, :company)
        {:ok, %{company: person.company, person: person, error: nil}}

      {:error, reason} ->
        {:ok, %{company: nil, person: nil, error: normalize_invite_error(reason)}}
    end
  end

  defp normalize_invite_error(:invite_token_not_found), do: "Invalid invite link"
  defp normalize_invite_error(:invite_token_invalid), do: "This invite link is no longer valid"
  defp normalize_invite_error(:invite_token_inactive), do: "This invite link is no longer valid"
  defp normalize_invite_error(:person_creation_failed), do: "Unable to add you to this company."
  defp normalize_invite_error(:invite_link_update_failed), do: "Something went wrong while using this invite link."
  defp normalize_invite_error(_), do: "Something went wrong while using this invite link."
end
