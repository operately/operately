defmodule Operately.Operations.CompanyJoiningViaInviteLink do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.InviteLinks
  alias Operately.People

  require Logger

  def run(account, token) do
    case InviteLinks.get_invite_link_by_token(token) do
      {:ok, invite_link} ->  handle_operation(account, invite_link)

      {:error, :not_found} -> {:error, :invite_link, :not_found, nil}
    end
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

      {:error, :validate_invite_link, :invite_link_expired, _changes} ->
        Logger.info("Expired invite token during account creation")
        {:error, :invite_token_invalid}

      {:error, :validate_invite_link, :invite_link_domain_not_allowed, _changes} ->
        Logger.info("Invite link blocked due to email domain restriction")
        {:error, :invite_token_domain_not_allowed}

      {:error, :validate_invite_link, _reason, _changes} ->
        Logger.info("Invalid invite token during account creation")
        {:error, :invite_token_invalid}

      {:error, :validate_person, :invite_link_not_for_person, _changes} ->
        Logger.info("Invite link does not belong to the logged-in account")
        {:error, :invite_token_invalid}

      {:error, :validate_person, :person_not_invited, _changes} ->
        Logger.info("Invite link used for a person without an open invitation")
        {:error, :invite_token_invalid}

      {:error, :person, changeset, _changes} ->
        Logger.error("Failed to create person via invite link: #{inspect(changeset)}")
        {:error, :person_creation_failed}

      {:error, :person_update, reason, _changes} ->
        Logger.error("Failed to update person via invite link: #{inspect(reason)}")
        {:error, :person_creation_failed}

      {:error, :invite_link_update, reason, _changes} ->
        Logger.error("Failed to increment invite link use count: #{inspect(reason)}")
        {:error, :invite_link_update_failed}
    end
  end

  defp handle_operation(account, invite_link = %{type: :company_wide}) do
    Multi.new()
    |> Multi.put(:invite_link, invite_link)
    |> Multi.run(:validate_invite_link, fn _, %{invite_link: invite_link} ->
      InviteLinks.validate_invite_link(invite_link, account)
    end)
    |> Multi.run(:company, fn _, %{invite_link: invite_link} ->
      {:ok, Operately.Companies.get_company!(invite_link.company_id)}
    end)
    |> Multi.run(:check_existing_person, fn _, %{company: company} ->
      case People.get_person(account, company) do
        nil -> {:ok, :no_existing_person}
        person -> {:error, {:person_already_in_company, person}}
      end
    end)
    |> Multi.run(:person, fn _, %{invite_link: invite_link} ->
      People.create_person(%{
        full_name: account.full_name,
        email: account.email,
        company_id: invite_link.company_id,
        account_id: account.id
      })
    end)
    |> Multi.run(:invite_link_update, fn _repo, %{invite_link: invite_link} ->
      InviteLinks.increment_use_count(invite_link)
    end)
    |> Repo.transaction()
  end

  defp handle_operation(account, invite_link = %{type: :personal}) do
    Multi.new()
    |> Multi.put(:invite_link, invite_link)
    |> Multi.run(:validate_invite_link, fn _, %{invite_link: invite_link} ->
      InviteLinks.validate_personal_invite_link(invite_link)
    end)
    |> Multi.run(:person, fn _, %{invite_link: invite_link} ->
      {:ok, People.get_person!(invite_link.person_id)}
    end)
    |> Multi.run(:validate_person, fn _, %{person: person} ->
      cond do
        person.account_id != account.id ->
          {:error, :invite_link_not_for_person}
        person.email != account.email ->
          {:error, :invite_link_not_for_person}
        not person.has_open_invitation ->
          {:error, :person_not_invited}
        true ->
          {:ok, person}
      end
    end)
    |> Multi.run(:person_update, fn _, %{person: person} ->
      People.update_person(person, %{ has_open_invitation: false })
    end)
    |> Multi.run(:invite_link_update, fn _repo, %{invite_link: invite_link} ->
      InviteLinks.revoke_invite_link(invite_link)
    end)
    |> Repo.transaction()
  end
end
