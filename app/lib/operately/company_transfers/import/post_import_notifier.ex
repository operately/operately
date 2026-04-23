defmodule Operately.CompanyTransfers.Import.PostImportNotifier do
  @moduledoc """
  Sends onboarding emails to imported people after the relational import commits.
  """

  import Ecto.Query, only: [from: 2]

  require Logger

  alias Operately.Activities.Activity
  alias Operately.Companies
  alias Operately.Companies.Company
  alias Operately.CompanyTransfers.Import.AccountResolver
  alias Operately.InviteLinks
  alias Operately.People.Person
  alias Operately.Repo
  alias OperatelyEmail.Emails.{CompanyMemberAddedEmail, GuestInvitedEmail}

  def notify(company_id, requested_by_id, account_resolution) when is_binary(company_id) and is_binary(requested_by_id) do
    company = Companies.get_company!(company_id)
    account_statuses = AccountResolver.status_by_destination_account(account_resolution)

    people = people_to_notify(company_id, requested_by_id, Map.keys(account_statuses))

    if people == [] do
      :ok
    else
      authors = author_candidates(company, requested_by_id)

      Enum.each(people, fn person ->
        notify_person(person, company, authors, account_statuses)
      end)

      :ok
    end
  end

  defp people_to_notify(_company_id, _requested_by_id, []), do: []

  defp people_to_notify(company_id, requested_by_id, destination_account_ids) do
    from(p in Person,
      where: p.company_id == ^company_id,
      where: p.account_id in ^destination_account_ids,
      where: p.account_id != ^requested_by_id,
      where: p.type in [:human, :guest],
      order_by: [asc: p.inserted_at]
    )
    |> Repo.all()
  end

  defp author_candidates(%Company{} = company, requested_by_id) do
    company = Company.load_owners(company)

    people =
      from(p in Person,
        where: p.company_id == ^company.id,
        where: p.type in [:human, :guest],
        order_by: [asc: p.inserted_at]
      )
      |> Repo.all()

    importer = Enum.find(people, &(&1.account_id == requested_by_id))

    (List.wrap(importer) ++ List.wrap(company.owners) ++ people)
    |> Enum.uniq_by(& &1.id)
  end

  defp notify_person(%Person{} = person, %Company{} = company, authors, account_statuses) do
    status = Map.get(account_statuses, person.account_id)
    author = Enum.find(authors, &(&1.id != person.id)) || person

    case invite_link_for(person, company, author, status) do
      {:ok, invite_link} ->
        activity = email_activity(person, company, author, invite_link)
        deliver_email(email_module(person), person, activity)

      {:error, reason} ->
        Logger.error("Failed to prepare post-import notification for person #{person.id}: #{inspect(reason)}")
    end
  end

  defp invite_link_for(_person, _company, _author, :reused), do: {:ok, nil}

  defp invite_link_for(person, company, author, :created) do
    case InviteLinks.get_personal_invite_link_for_person(person.id) do
      {:ok, invite_link} ->
        InviteLinks.refresh_personal_invite_link(invite_link)

      {:error, :not_found} ->
        InviteLinks.create_personal_invite_link(%{
          company_id: company.id,
          author_id: author.id,
          person_id: person.id
        })
    end
  end

  defp invite_link_for(person, _company, _author, status) do
    {:error, {:unsupported_account_resolution_status, person.id, status}}
  end

  defp email_activity(%Person{} = person, %Company{} = company, %Person{} = author, invite_link) do
    action = activity_action(person)

    %Activity{
      action: action,
      author_id: author.id,
      content: %{
        "company_id" => company.id,
        "person_id" => person.id,
        "invite_link_id" => invite_link && invite_link.id
      }
    }
  end

  defp deliver_email(module, %Person{} = person, %Activity{} = activity) do
    case apply(module, :send, [person, activity]) do
      {:error, reason} ->
        Logger.error("Failed to send post-import notification to person #{person.id}: #{inspect(reason)}")

      _result ->
        :ok
    end
  end

  defp email_module(%Person{type: :guest}), do: GuestInvitedEmail
  defp email_module(%Person{}), do: CompanyMemberAddedEmail

  defp activity_action(%Person{type: :guest}), do: "guest_invited"
  defp activity_action(%Person{}), do: "company_member_added"
end
