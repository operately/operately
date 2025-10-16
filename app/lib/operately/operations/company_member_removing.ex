defmodule Operately.Operations.CompanyMemberRemoving do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.People

  @doc """
  Removes a company member from the system.

  For members with open invitations, they are deleted entirely.
  For existing members, they are marked as suspended.

  Returns the updated or deleted person record.

  ## Parameters
    - admin: The admin performing the removal
    - person_id: ID of the person to remove
  """
  def run(admin, person_id) do
    person = People.get_person!(person_id)

    Multi.new()
    |> suspend_or_delete_person(person)
    |> insert_activity(admin)
    |> Repo.transaction()
    |> Repo.extract_result(:person)
  end

  defp suspend_or_delete_person(multi, person) do
    case person.has_open_invitation do
      # For users with open invitations, delete them entirely
      true ->
        Multi.delete(multi, :person, person)

      # For existing members, mark them as suspended
      false ->
        changeset =
          People.Person.changeset(person, %{
            suspended: true,
            suspended_at: DateTime.utc_now()
          })

        Multi.update(multi, :person, changeset)
    end
  end

  defp insert_activity(multi, admin) do
    Operately.Activities.insert_sync(multi, admin.id, :company_member_removed, fn changes ->
      %{
        company_id: admin.company_id,
        name: changes[:person].full_name,
        email: changes[:person].email,
        title: changes[:person].title
      }
    end)
  end
end
