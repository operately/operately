defmodule Operately.Operations.CompanyMemberAdding do
  alias Ecto.Multi
  alias Operately.{Access, Repo}
  alias Operately.InviteLinks

  def run(admin, attrs, skip_invitation \\ false) do
    result = Multi.new()
    |> insert_account(attrs)
    |> insert_person(admin, attrs)
    |> insert_membership_with_company_space_group()
    |> add_person_to_general_space()
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
    attrs = Map.put(attrs, :company_id, admin.company_id)

    multi
    |> Multi.run(:company_space, fn _, _ ->
      {:ok, Operately.Companies.get_company_space(admin.company_id)}
    end)
    |> Operately.People.insert_person(fn changes ->
      Operately.People.Person.changeset(%{
        company_id: admin.company_id,
        account_id: changes[:account].id,
        full_name: attrs.full_name,
        email: attrs.email,
        title: attrs.title,
      })
    end)
  end

  defp insert_membership_with_company_space_group(multi) do
    multi
    |> Multi.run(:space_access_group, fn _, %{company_space: space} ->
      case space do
        nil -> {:ok, nil}
        space -> {:ok, Access.get_group(group_id: space.id, tag: :standard)}
      end
    end)
    |> Multi.run(:space_access_membership, fn _, %{space_access_group: access_group, person: person} ->
      case access_group do
        nil ->
          {:ok, nil}

        access_group ->
          Access.GroupMembership.changeset(%{
            group_id: access_group.id,
            person_id: person.id,
          })
          |> Repo.insert()
      end
    end)
  end

  defp add_person_to_general_space(multi) do
    Multi.run(multi, :add_to_general_space, fn _, %{person: person} ->
      Operately.Companies.add_person_to_general_space(person)
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
    Operately.Activities.insert_sync(multi, admin.id, :company_member_added, fn changes ->
      %{
        company_id: admin.company_id,
        person_id: changes.person.id,
        invite_link_id: changes.invite_link && changes.invite_link.id,
        name: changes.person.full_name,
        email: changes.person.email,
        title: changes.person.title,
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
