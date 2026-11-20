defmodule Operately.Operations.AccountSigningUp do
  use Gettext, backend: OperatelyWeb.Gettext

  alias Operately.Billing.EnforceLimits
  alias Operately.Billing.EnforceLimits.LimitError
  alias Operately.Operations.EmailActivationCodeConsuming
  alias Operately.People.Account
  alias Operately.Repo

  @doc """
  Creates a new account after validating the email activation code.
  Optionally joins a company via an invite token.

  Returns:
    - `{:ok, account, invite_context}` on success, where `invite_context` is
      `%{company: company_or_nil, person: person_or_nil, error: error_string_or_nil, join_error_details: map_or_nil}`
    - `{:error, :signup_not_allowed}` when email signup is disabled
    - `{:error, %Ecto.Changeset{}}` for invalid details or an already registered email
    - `{:error, :invalid_code}` when the activation code format is invalid
    - `{:error, :not_found}` when no matching activation record exists
    - `{:error, :invalid}` when the activation code has expired
    - `{:error, :account_creation_failed}` when a transactional signup job fails
  """
  def run(full_name, email, password, code, invite_token \\ nil, analytics_context \\ %{}) do
    with {:ok, :allowed} <- check_signup_allowed(),
         {:ok, changeset} <- validate_details(%{full_name: full_name, email: email, password: password}),
         {:ok, account} <- create_verified_account(changeset, code, invite_token, analytics_context),
         {:ok, invite_context} <- handle_invite_token(account, invite_token) do
      {:ok, account, invite_context}
    end
  end

  defp validate_details(attrs) do
    changeset = Account.signup_changeset(attrs)
    if changeset.valid?, do: {:ok, changeset}, else: {:error, changeset}
  end

  def preflight(attrs) do
    with {:ok, :allowed} <- check_signup_allowed(),
         :ok <- check_invitation(Account.normalize_email(attrs[:email]), attrs[:invite_token]),
         {:ok, changeset} <- validate_details(attrs) do
      {:ok, Ecto.Changeset.get_field(changeset, :email)}
    end
  end

  defp check_invitation(_email, nil), do: :ok

  defp check_invitation(email, token) do
    with {:ok, link} <- Operately.InviteLinks.get_invite_link_by_token(token),
         :company_wide <- link.type,
         {:ok, _} <- Operately.InviteLinks.validate_invite_link(link, %{email: email}),
         :ok <- Operately.Billing.Usage.check_member_limit(link.company) do
      :ok
    else
      :personal -> {:error, {:invitation, :personal}}
      {:error, reason} -> {:error, {:invitation, reason}}
    end
  end

  defp create_verified_account(changeset, code, invite_token, analytics_context) do
    email = Ecto.Changeset.get_field(changeset, :email)

    # Joining is deliberately outside this transaction: an account can exist
    # even if the invitation is revoked or the company fills up in the meantime.
    Repo.transaction(fn ->
      with {:ok, activation} <- EmailActivationCodeConsuming.run(email, code),
           {:ok, account} <- Account.create_signup(changeset, signup_context(activation, invite_token, analytics_context)) do
        account
      else
        {:error, reason} -> Repo.rollback(reason)
        {:error, :account, changeset, _changes} -> Repo.rollback(changeset)
        {:error, _step, _reason, _changes} -> Repo.rollback(:account_creation_failed)
      end
    end)
  end

  defp signup_context(activation, invite_token, request_context) do
    context = Operately.Analytics.Context.normalize(activation.analytics_context)
    context
    |> Map.put(:channel, request_context[:channel] || "web")
    |> Map.put(:signup_kind, if(invite_token, do: :invitation, else: :self_service))
    |> Map.put(:preference, if(request_context[:preference] == "denied", do: "denied", else: context.preference))
  end

  defp check_signup_allowed do
    if Application.get_env(:operately, :allow_signup_with_email) do
      {:ok, :allowed}
    else
      {:error, :signup_not_allowed}
    end
  end

  defp handle_invite_token(_account, nil), do: {:ok, %{company: nil, person: nil, error: nil, join_error_details: nil}}

  defp handle_invite_token(account, token) do
    case Operately.InviteLinks.join_company_via_invite_link(account, token) do
      {:ok, person} ->
        person = Repo.preload(person, :company)
        {:ok, %{company: person.company, person: person, error: nil, join_error_details: nil}}

      {:error, %LimitError{} = error} ->
        {:ok,
         %{
           company: nil,
           person: nil,
           error: EnforceLimits.public_message(error),
           join_error_details: EnforceLimits.public_details(error)
         }}

      {:error, reason} ->
        {:ok, %{company: nil, person: nil, error: normalize_invite_error(reason), join_error_details: nil}}
    end
  end

  defp normalize_invite_error(:invite_token_not_found), do: gettext("Invalid invite link")
  defp normalize_invite_error(:invite_token_invalid), do: gettext("This invite link is no longer valid")
  defp normalize_invite_error(:invite_token_inactive), do: gettext("This invite link is no longer valid")
  defp normalize_invite_error(:invite_token_domain_not_allowed), do: gettext("This email domain is not allowed by the invitation.")
  defp normalize_invite_error(:person_creation_failed), do: gettext("Unable to add you to this company.")
  defp normalize_invite_error(:invite_link_update_failed), do: gettext("Something went wrong while using this invite link.")
end
