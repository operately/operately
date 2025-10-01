defmodule OperatelyWeb.Api.Mutations.CreateAccount do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.People.{Account, EmailActivationCode}
  alias OperatelyWeb.Api.Serializer
  alias Operately.Repo

  require Logger

  inputs do
    field? :invite_token, :string, null: true
    field? :code, :string, null: true
    field? :email, :string, null: true
    field? :password, :string, null: true
    field? :full_name, :string, null: true
  end

  outputs do
    field?(:company, :company, null: true)
    field?(:person, :person, null: true)
    field?(:error, :string, null: true)
  end

  def call(_conn, inputs) do
    with(
      {:ok, :allowed} <- check_signup_allowed(),
      {:ok, code} <- parse_code(inputs.code),
      {:ok, activation} <- EmailActivationCode.get(:system, email: inputs.email, code: code),
      {:ok, :valid} <- check_validity(activation),
      {:ok, account} <- Account.create(inputs.full_name, inputs.email, inputs.password),
      {:ok, invite_context} <- handle_invite_token(account, inputs[:invite_token])
    ) do
      {:ok, build_response(invite_context)}
    else
      {:error, error} ->
        Logger.error("Failed to create account. error: #{inspect(error)}")
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

  def check_validity(activation) do
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
        # code passed with without hyphen, e.e. A1B2C3
        {:ok, code}

      String.length(code) == 7 ->
        # code passed with hyphen, e.g. A1B-2C3
        code = String.slice(code, 0, 3) <> String.slice(code, 4, 6)
        {:ok, code}

      true ->
        {:error, :invalid_code}
    end
  end

  defp handle_invite_token(_account, nil), do: {:ok, %{company: nil, person: nil, error: nil}}

  defp handle_invite_token(account, token) do
    case Operately.InviteLinks.join_company_via_invite_link(account, token) do
      {:ok, {:person_created, person}} ->
        person = Repo.preload(person, :company)
        {:ok, %{company: person.company, person: person, error: nil}}

      {:error, reason} ->
        {:ok, %{company: nil, person: nil, error: normalize_invite_error(reason)}}
    end
  end

  defp build_response(%{company: company, person: person, error: error}) do
    %{
      company: serialize_optional(company),
      person: serialize_optional(person),
      error: error
    }
  end

  defp serialize_optional(nil), do: nil
  defp serialize_optional(resource), do: Serializer.serialize(resource, level: :essential)

  defp normalize_invite_error(:invite_token_not_found), do: "Invalid invite link"
  defp normalize_invite_error(:invite_token_invalid), do: "This invite link is no longer valid"
  defp normalize_invite_error(:person_creation_failed), do: "Unable to add you to this company."
  defp normalize_invite_error(:invite_link_update_failed),
    do: "Something went wrong while using this invite link."
  defp normalize_invite_error(_), do: nil
end
