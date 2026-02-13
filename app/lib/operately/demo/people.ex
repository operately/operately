defmodule Operately.Demo.People do
  alias Operately.Demo.{Resources, RichText}
  alias Operately.People

  def create_people(resources, data) do
    Resources.create(resources, data, fn {resources, d, _index} ->
      create_person(resources, d)
    end)
  end

  def create_outside_collaborators(resources, nil), do: resources
  def create_outside_collaborators(resources, []), do: resources
  def create_outside_collaborators(resources, data) do
    company = Resources.get(resources, :company)
    owner = Resources.get(resources, :owner)

    Resources.create(resources, data, fn {_res, d, _index} ->
      create_guest_person(owner, company, d)
    end)
  end

  defp create_person(resources, data) do
    company = Resources.get(resources, :company)
    owner = Resources.get(resources, :owner)
    email = create_email(company, data)
    invited = data[:invited] == true

    {:ok, changes} = Operately.Operations.CompanyMemberAdding.run(owner, %{
      full_name: data.name,
      email: email,
      title: data.title,
    }, not invited)

    person = changes[:person]

    {:ok, person} = set_avatar(person, data.avatar)
    {:ok, person} = set_manager(person, resources, data[:reports_to])
    {:ok, person} = set_description(person, data[:description])
    {:ok, person} = set_first_login(person, invited)

    person
  end

  defp create_guest_person(owner, company, data) do
    {:ok, changes} = Operately.Operations.GuestInviting.run(owner, %{
      full_name: data.name,
      email: create_email(company, data),
      title: data.title,
    })

    person = changes[:person]

    {:ok, person} = set_avatar(person, data.avatar)
    {:ok, person} = set_first_login(person, false)

    person
  end

  defp set_avatar(person, avatar_id) do
    Operately.People.update_person(person, %{
      avatar_url: avatar(avatar_id)
    })
  end

  defp set_manager(person, _resources, nil), do: {:ok, person}
  defp set_manager(person, resources, key) do
    Operately.People.update_person(person, %{
      manager_id: Resources.get(resources, key).id
    })
  end

  defp set_description(person, nil), do: {:ok, person}
  defp set_description(person, description) do
    Operately.People.update_person(person, %{
      description: RichText.from_string(description)
    })
  end

  defp set_first_login(person, true), do: {:ok, person}
  defp set_first_login(person, _) do
    person = Operately.Repo.preload(person, :account)
    case person.account do
      nil -> {:ok, person}
      account ->
        {:ok, _} = People.mark_account_first_login(account)
        {:ok, person}
    end
  end

  defp create_email(company, data) do
    email_handle = String.replace(data.name, " ", "-") <> "-" <> to_string(company.short_id)
    company_domain = String.replace(company.name, ~r/[^a-zA-Z0-9]/, "") |> String.downcase()

    "#{email_handle}@#{company_domain}.com"
  end

  def avatar(source) do
    "https://images.unsplash.com/#{source}?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
  end
end
