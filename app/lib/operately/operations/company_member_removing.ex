defmodule Operately.Operations.CompanyMemberRemoving do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.People.Person
  alias Operately.Search.IndexUpdates

  @doc """
  Removes a company member from the system.

  For members with open invitations, they are deleted entirely.
  For existing members, they are marked as suspended.

  Returns the updated or deleted person record.

  ## Parameters
    - admin: The admin performing the removal
    - person: The person to remove, must belong to the admin's company
  """
  def run(admin, person = %Person{}) do
    with :ok <- validate_company(admin, person) do
      person = Repo.preload(person, :account)

      Multi.new()
      |> IndexUpdates.delete(:search_person, "person", person.id)
      |> suspend_or_delete_person(person)
      |> insert_activity(admin)
      |> Repo.transaction()
      |> Repo.extract_result(:person)
    end
  end

  defp validate_company(admin, person) do
    if person.company_id == admin.company_id do
      :ok
    else
      {:error, :invalid_company}
    end
  end

  defp suspend_or_delete_person(multi, person) do
    case open_invitation?(person) do
      # For users with open invitations, delete them entirely
      true ->
        Multi.delete(multi, :person, person)

      # For existing members, mark them as suspended
      false ->
        changeset =
          Person.changeset(person, %{
            suspended: true,
            suspended_at: DateTime.utc_now()
          })

        Multi.update(multi, :person, changeset)
    end
  end

  defp open_invitation?(%{account: %{first_login_at: nil}}), do: true
  defp open_invitation?(_person), do: false

  defp insert_activity(multi, admin) do
    Operately.Activities.insert_sync(multi, admin.id, :company_member_removed, fn changes ->
      %{
        company_id: admin.company_id,
        name: changes[:person].full_name,
        email: changes[:person].email,
        title: changes[:person].title,
      }
    end)
  end
end
