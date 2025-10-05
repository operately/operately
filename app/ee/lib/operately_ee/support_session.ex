defmodule OperatelyEE.SupportSession do
  @moduledoc """
  Handles support session functionality for site administrators.
  """

  require Logger

  @doc """
  Checks if the current request is in a support session and returns the person.
  """
  def get_as_person(token, account, company) do
    with(
      true <- Operately.People.Account.is_site_admin?(account),
      {:ok, %{person_id: person_id}} <- decode_support_session_cookie(token, company)
    ) do
      {:ok, Operately.People.get_person!(person_id)}
    else
      _ -> {:error, :not_support_session}
    end
  end

  def decode_support_session_cookie(nil, _), do: {:error, :no_cookie}

  def decode_support_session_cookie(token, company) do
    with(
      {:ok, data} <- Phoenix.Token.decrypt(OperatelyWeb.Endpoint, "support_session", token),
      {:ok, :valid} <- validate_expiry(data),
      {:ok, :valid} <- validate_company(data, company)
    ) do
      {:ok, %{company_id: data.company_id, person_id: data.person_id}}
    else
      {:error, _} -> {:error, :invalid_token}
    end
  end

  def create_support_session_token(admin_account, company) do
    # Get the first owner to impersonate during this session
    owners = Operately.Companies.list_owners(company)

    case owners do
      [] ->
        {:error, :no_owners}
      [owner | _] ->
        data = %{
          admin_id: admin_account.id,
          company_id: OperatelyWeb.Paths.company_id(company),
          person_id: owner.id,
          expires_at: DateTime.utc_now() |> DateTime.add(3600, :second), # 1 hour
          session_id: Ecto.UUID.generate()
        }

        encrypted_token = Phoenix.Token.encrypt(OperatelyWeb.Endpoint, "support_session", data)
        {:ok, encrypted_token}
    end
  end


  def validate_expiry(%{expires_at: expires_at}) do
    if DateTime.compare(DateTime.utc_now(), expires_at) == :lt do
      {:ok, :valid}
    else
      {:error, :expired}
    end
  end

  def validate_company(data, company) do
    company_id = Map.get(data, :company_id)

    cond do
      company_id == nil ->
        {:error, :invalid_company}

      not is_binary(company_id) ->
        {:error, :invalid_company}

      company_id == OperatelyWeb.Paths.company_id(company) ->
        {:ok, :valid}

      true ->
        {:error, :invalid_company}
    end
  end
end
