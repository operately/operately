defmodule Operately.Operations.CompanyMemberAdding do
  alias Ecto.Multi
  alias Operately.{Access, Repo}

  def run(admin, attrs, skip_invitation \\ false) do
    result =
      Multi.new()
      |> insert_account(attrs)
      |> insert_person(admin, attrs, skip_invitation)
      |> insert_membership_with_company_space_group()
      |> insert_binding_to_company_space()
      |> insert_invitation(admin, skip_invitation)
      |> insert_activity(admin)
      |> Repo.transaction()
      |> Repo.extract_result(:invitation)

    case result do
      {:ok, result} ->
        {:ok, result}

      {:error, _, changeset, _} ->
        {:error, format_errors(changeset)}
    end
  end

  defp insert_account(multi, attrs) do
    password = :crypto.strong_rand_bytes(64) |> Base.encode64() |> binary_part(0, 64)

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

  defp insert_person(multi, admin, attrs, skip_invitation) do
    attrs = Map.put(attrs, :company_id, admin.company_id)

    multi
    |> Multi.run(:company_space, fn _, _ ->
      {:ok, Operately.Companies.get_company_space!(admin.company_id)}
    end)
    |> Operately.People.insert_person(fn changes ->
      Operately.People.Person.changeset(%{
        company_id: admin.company_id,
        account_id: changes[:account].id,
        full_name: attrs.full_name,
        email: attrs.email,
        title: attrs.title,
        has_open_invitation: not skip_invitation
      })
    end)
  end

  defp insert_membership_with_company_space_group(multi) do
    multi
    |> Multi.run(:space_access_group, fn _, %{company_space: space} ->
      {:ok, Access.get_group!(group_id: space.id, tag: :standard)}
    end)
    |> Multi.insert(:space_access_membership, fn changes ->
      Access.GroupMembership.changeset(%{
        group_id: changes.space_access_group.id,
        person_id: changes.person.id
      })
    end)
  end

  defp insert_binding_to_company_space(multi) do
    multi
    |> Multi.run(:binding_to_space_group, fn _, changes ->
      context = Access.get_context!(group_id: changes.company_space.id)

      Access.create_binding(%{
        group_id: changes.person_access_group.id,
        context_id: context.id,
        access_level: Access.Binding.edit_access()
      })
    end)
  end

  defp insert_invitation(multi, _, true) do
    Multi.put(multi, :invitation, nil)
  end

  defp insert_invitation(multi, admin, false) do
    Multi.insert(multi, :invitation, fn changes ->
      Operately.Invitations.Invitation.changeset(%{
        member_id: changes[:person].id,
        admin_id: admin.id,
        admin_name: admin.full_name
      })
    end)
  end

  defp insert_activity(multi, admin) do
    Operately.Activities.insert_sync(multi, admin.id, :company_member_added, fn changes ->
      %{
        company_id: admin.company_id,
        invitatition_id: changes[:invitation] && changes[:invitation].id,
        name: changes[:person].full_name,
        email: changes[:person].email,
        title: changes[:person].title
      }
    end)
  end

  defp format_errors(changeset) do
    changeset.errors
    |> Enum.map(fn {field, {message, _opts}} ->
      %{
        field: field,
        message: message
      }
    end)
  end
end
