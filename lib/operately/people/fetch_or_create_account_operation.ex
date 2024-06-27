defmodule Operately.People.FetchOrCreateAccountOperation do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.People
  alias Operately.People.Person
  alias Operately.People.Account

  def call(company, attrs = %{email: _email, name: _name, image: _image}) do
    strategies = [
      &find_existing_account/2,
      &create_account_for_an_existing_person/2,
      &create_new_account/2
    ]

    first_succesfull(strategies, company, attrs, on_not_found: {:error, "Not found"})
  end

  #
  # Strategies
  #

  defp find_existing_account(_company, %{email: email, image: image}) do
    account = People.get_account_by_email(email)

    if account == nil do
      {:error, "Not found"}
    else
      person = Operately.Repo.preload(account, :person).person

      if person.avatar_url != image do
        {:ok, _} = Operately.People.update_person(person, %{avatar_url: image})
      end

      {:ok, account}
    end
  end

  defp create_account_for_an_existing_person(company, attrs) do
    person = People.get_person_by_email(company, attrs.email)

    cond do
      person == nil -> {:error, "Not found"}
      person.account_id != nil -> {:error, "Not found"}
      true ->
        Multi.new()
        |> Multi.insert(:account, build_account(attrs))
        |> Multi.update(:person, fn %{account: account} -> Person.changeset(person, %{
          account_id: account.id,
          avatar_url: attrs.image
        }) end)
        |> Repo.transaction()
        |> Repo.extract_result(:account)
    end
  end

  defp create_new_account(company, attrs) do
    if Operately.Companies.is_email_allowed?(company, attrs.email) do
      Multi.new()
      |> Multi.insert(:account, Account.registration_changeset(%{email: attrs.email, password: random_password()}))
      |> People.insert_person(fn %{account: account} -> build_person_for_account(account, attrs) end)
      |> Repo.transaction()
      |> Repo.extract_result(:account)
    else
      {:error, "Not allowed"}
    end
  end

  #
  # Utility functions
  #

  defp first_succesfull([strategy | rest], company, params, on_not_found: on_not_found) do
    case strategy.(company, params) do
      {:ok, result} ->    {:ok, result}
      {:error, _reason} -> first_succesfull(rest, company, params, on_not_found: on_not_found)
    end
  end

  defp first_succesfull([], _company, _params, on_not_found: on_not_found) do
    on_not_found
  end

  @rand_pass_length 32

  defp random_password do
    :crypto.strong_rand_bytes(@rand_pass_length) |> Base.encode64()
  end

  defp build_account(attrs) do
    Account.registration_changeset(%{email: attrs.email, password: random_password()})
  end

  defp build_person_for_account(account, attrs) do
    company = hd(Operately.Companies.list_companies())

    Person.changeset(%{
      company_id: company.id,
      account_id: account.id,
      full_name: attrs.name,
      email: attrs.email,
      avatar_url: attrs[:image] || "",
      title: "Unknown Role"
    })
  end

end
