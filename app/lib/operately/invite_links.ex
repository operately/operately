defmodule Operately.InviteLinks do
  import Ecto.Query, warn: false
  alias Operately.Repo

  alias Operately.InviteLinks.InviteLink
  alias Ecto.Multi

  require Logger

  def list_invite_links_for_company(company_id) do
    from(il in InviteLink,
      where: il.company_id == ^company_id,
      order_by: [desc: il.inserted_at],
      preload: [:author, :company]
    )
    |> Repo.all()
  end

  def get_invite_link!(id), do: Repo.get!(InviteLink, id)

  def get_invite_link_by_token(nil), do: {:error, :not_found}

  def get_invite_link_by_token(token) when is_binary(token) do
    from(il in InviteLink,
      where: il.token == ^token,
      preload: [:author, :company]
    )
    |> Repo.one()
    |> case do
      nil -> {:error, :not_found}
      invite_link -> {:ok, invite_link}
    end
  end

  def fetch_or_create_invite_link(attrs) do
    case get_invite_link(attrs.company_id) do
      {:error, :not_found} -> create_invite_link(attrs)
      {:ok, invite_link} -> {:ok, invite_link}
    end
  end

  def get_invite_link(company_id) do
    from(il in InviteLink,
      where: il.company_id == ^company_id,
      order_by: [desc: il.inserted_at],
      limit: 1
    )
    |> Repo.one()
    |> case do
      nil -> {:error, :not_found}
      invite_link -> {:ok, invite_link}
    end
  end

  def create_invite_link(attrs \\ %{}) do
    token = InviteLink.build_token()

    attrs_with_token = Map.put(attrs, :token, token)

    %InviteLink{}
    |> InviteLink.changeset(attrs_with_token)
    |> Repo.insert()
  end

  def update_invite_link(%InviteLink{} = invite_link, attrs) do
    invite_link
    |> InviteLink.changeset(attrs)
    |> Repo.update()
  end

  def revoke_invite_link(%InviteLink{} = invite_link) do
    update_invite_link(invite_link, %{is_active: false})
  end

  def activate_invite_link(%InviteLink{} = invite_link) do
    update_invite_link(invite_link, %{is_active: true})
  end

  def increment_use_count(%InviteLink{} = invite_link) do
    update_invite_link(invite_link, %{use_count: invite_link.use_count + 1})
  end

  def delete_invite_link(%InviteLink{} = invite_link) do
    Repo.delete(invite_link)
  end

  def change_invite_link(%InviteLink{} = invite_link, attrs \\ %{}) do
    InviteLink.changeset(invite_link, attrs)
  end

  def get_users_joined_via_link(_invite_link_id) do
    raise "Not implemented yet"
  end

  def validate_invite_link(link, account) do
    cond do
      link.is_active == false ->
        {:error, :invite_link_inactive}

      not allowed_for_account?(link.allowed_domains, account) ->
        {:error, :invite_link_domain_not_allowed}

      true ->
        {:ok, link}
    end
  end

  def join_company_via_invite_link(account, token) do
    Multi.new()
    |> Multi.run(:invite_link, fn _, _ ->
      get_invite_link_by_token(token)
    end)
    |> Multi.run(:validate_invite_link, fn _, %{invite_link: invite_link} ->
      validate_invite_link(invite_link, account)
    end)
    |> Multi.run(:company, fn _, %{invite_link: invite_link} ->
      {:ok, Operately.Companies.get_company!(invite_link.company_id)}
    end)
    |> Multi.run(:check_existing_person, fn _, %{company: company} ->
      case Operately.People.get_person(account, company) do
        nil -> {:ok, :no_existing_person}
        person -> {:error, {:person_already_in_company, person}}
      end
    end)
    |> Multi.run(:person, fn _, %{invite_link: invite_link} ->
      Operately.People.create_person(%{
        full_name: account.full_name,
        email: account.email,
        company_id: invite_link.company_id,
        account_id: account.id
      })
    end)
    |> Multi.run(:invite_link_update, fn _repo, %{invite_link: invite_link} ->
      # __MODULE__ required for test mocking
      __MODULE__.increment_use_count(invite_link)
    end)
    |> Repo.transaction()
    |> case do
      {:ok, %{person: person, invite_link: invite_link}} ->
        Logger.info("Successfully created person #{person.id} for company #{invite_link.company_id} via invite link")
        {:ok, person}

      {:error, :check_existing_person, {:person_already_in_company, person}, _changes} ->
        Logger.info("Account #{account.id} already has a person in the company for invite link")
        {:ok, person}

      {:error, :invite_link, :not_found, _changes} ->
        Logger.info("Invite token not found during account creation")
        {:error, :invite_token_not_found}

      {:error, :validate_invite_link, :invite_link_inactive, _changes} ->
        Logger.info("Inactive invite token during account creation")
        {:error, :invite_token_inactive}

      {:error, :validate_invite_link, :invite_link_domain_not_allowed, _changes} ->
        Logger.info("Invite link blocked due to email domain restriction")
        {:error, :invite_token_domain_not_allowed}

      {:error, :validate_invite_link, _reason, _changes} ->
        Logger.info("Invalid invite token during account creation")
        {:error, :invite_token_invalid}

      {:error, :person, changeset, _changes} ->
        Logger.error("Failed to create person via invite link: #{inspect(changeset)}")
        {:error, :person_creation_failed}

      {:error, :invite_link_update, reason, _changes} ->
        Logger.error("Failed to increment invite link use count: #{inspect(reason)}")
        {:error, :invite_link_update_failed}
    end
  end

  defp allowed_for_account?(allowed_domains, account) do
    allowed_domains = allowed_domains || []

    if Enum.empty?(allowed_domains) do
      true
    else
      case account_email_domain(account) do
        nil -> false
        domain -> domain in allowed_domains
      end
    end
  end

  defp account_email_domain(%{email: email}), do: account_email_domain(email)

  defp account_email_domain(email) when is_binary(email) do
    email
    |> String.trim()
    |> String.downcase()
    |> String.split("@")
    |> case do
      [_, domain] when domain != "" -> domain
      _ -> nil
    end
  end

  defp account_email_domain(_), do: nil
end
