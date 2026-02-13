defmodule Operately.Operations.GuestInviting do
  alias Ecto.Multi
  alias Operately.{Access, Repo}
  alias Operately.Access.Binding
  alias Operately.InviteLinks
  alias Operately.People

  def run(admin, attrs) do
    skip_invitation = People.account_used?(attrs.email)

    result = Multi.new()
    |> insert_account(attrs)
    |> insert_person(admin, attrs)
    |> insert_person_access_group(admin)
    |> insert_invite_link(admin, skip_invitation)
    |> insert_activity(admin)
    |> Repo.transaction()

    case result do
      {:ok, changes} ->
        {:ok, changes}
      {:error, _, changeset, _} ->
        {:error, format_errors(changeset)}
    end
  end

  defp insert_account(multi, attrs) do
    password = :crypto.strong_rand_bytes(64) |> Base.encode64 |> binary_part(0, 64)

    Multi.run(multi, :account, fn repo, _changes ->
      case repo.get_by(Operately.People.Account, email: attrs.email) do
        nil ->
          %Operately.People.Account{}
          |> Operately.People.Account.registration_changeset(%{
            email: attrs.email,
            password: password,
            full_name: attrs.full_name
          })
          |> repo.insert()

        existing_account ->
          {:ok, existing_account}
      end
    end)
  end

  defp insert_person(multi, admin, attrs) do
    Multi.insert(multi, :person, fn %{account: account} ->
      Operately.People.Person.changeset(%Operately.People.Person{}, %{
        company_id: admin.company_id,
        account_id: account.id,
        full_name: attrs.full_name,
        email: attrs.email,
        title: attrs.title,
        type: :guest,
      })
    end)
  end

  defp insert_person_access_group(multi, admin) do
    multi
    |> Multi.insert(:person_access_group, fn %{person: person} ->
      Access.Group.changeset(%{person_id: person.id})
    end)
    |> Multi.insert(:person_access_membership, fn %{person_access_group: group, person: person} ->
      Access.GroupMembership.changeset(%{
        group_id: group.id,
        person_id: person.id,
      })
    end)
    |> Multi.insert(:company_access_binding, fn %{person_access_group: group} ->
      context = Access.get_context!(company_id: admin.company_id)

      Binding.changeset(%{
        group_id: group.id,
        context_id: context.id,
        access_level: Binding.minimal_access(),
      })
    end)
  end

  defp insert_invite_link(multi, _, true) do
    Multi.put(multi, :invite_link, nil)
  end

  defp insert_invite_link(multi, admin, false) do
    Multi.run(multi, :invite_link, fn _, %{person: person} ->
      InviteLinks.create_personal_invite_link(%{
        company_id: admin.company_id,
        author_id: admin.id,
        person_id: person.id
      })
    end)
  end

  defp insert_activity(multi, admin) do
    Operately.Activities.insert_sync(multi, admin.id, :guest_invited, fn changes ->
      %{
        company_id: admin.company_id,
        person_id: changes[:person].id,
        invite_link_id: changes[:invite_link] && changes[:invite_link].id
      }
    end)
  end

  defp format_errors(changeset) do
    changeset.errors
    |> Enum.map(fn {field, {message, _opts}} ->
      %{
        field: field,
        message: message,
      }
    end)
  end
end
