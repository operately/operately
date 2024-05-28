defmodule Operately.Operations.CompanyMemberAdding do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.People.Account
  alias Operately.People.Person
  alias Operately.Activities

  def run(admin, attrs) do
    Multi.new()
    |> insert_account(attrs)
    |> insert_person(admin, attrs)
    |> insert_activity(admin)
    |> Repo.transaction()
    |> Repo.extract_result(:person)
  end

  def insert_account(multi, attrs) do
    password = get_random_password()

    Multi.insert(multi, :account,
      Account.registration_changeset(%{email: attrs.email, password: password})
    )
  end

  def insert_person(multi, admin, attrs) do
    attrs = Map.put(attrs, :company_id, admin.company_id)
    attrs = Map.put(attrs, :company_role, :member)

    Multi.insert(multi, :person, fn changes ->
      Person.changeset(%{
        company_id: admin.company_id,
        account_id: changes[:account].id,
        full_name: attrs.full_name,
        email: attrs.email,
        title: attrs.title
      })
    end)
  end

  def insert_activity(multi, admin) do
    Activities.insert_sync(multi, admin.id, :company_member_added, fn changes ->
      %{
        company_id: admin.company_id,
        # invitatition_id:
        name: changes[:person].full_name,
        email: changes[:person].email,
        title: changes[:person].title,
      }
    end)
  end

  defp get_random_password do
    :crypto.strong_rand_bytes(64)
    |> Base.encode64
    |> binary_part(0, 64)
  end
end
