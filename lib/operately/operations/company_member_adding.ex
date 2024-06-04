defmodule Operately.Operations.CompanyMemberAdding do
  alias Ecto.Multi
  alias Operately.Repo

  def run(admin, attrs) do
    result = Multi.new()
    |> insert_account(attrs)
    |> insert_person(admin, attrs)
    |> insert_invitation(admin)
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
    password = :crypto.strong_rand_bytes(64) |> Base.encode64 |> binary_part(0, 64)

    Multi.insert(multi, :account,
      Operately.People.Account.registration_changeset(%{email: attrs.email, password: password})
    )
  end

  defp insert_person(multi, admin, attrs) do
    attrs = Map.put(attrs, :company_id, admin.company_id)
    attrs = Map.put(attrs, :company_role, :member)

    Multi.insert(multi, :person, fn changes ->
      Operately.People.Person.changeset(%{
        company_id: admin.company_id,
        account_id: changes[:account].id,
        full_name: attrs.full_name,
        email: attrs.email,
        title: attrs.title
      })
    end)
  end

  defp insert_invitation(multi, admin) do
    Multi.insert(multi, :invitation, fn changes ->
      Operately.Invitations.Invitation.changeset(%{
        member_id: changes[:person].id,
        admin_id: admin.id,
        admin_name: admin.full_name,
      })
    end)
  end

  defp insert_activity(multi, admin) do
    Operately.Activities.insert_sync(multi, admin.id, :company_member_added, fn changes ->
      %{
        company_id: admin.company_id,
        invitatition_id: changes[:invitation].id,
        name: changes[:person].full_name,
        email: changes[:person].email,
        title: changes[:person].title,
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
