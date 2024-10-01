defmodule Operately.Demo.People do
  alias Operately.Demo.Resources

  def create_people(resources, data) do
    Resources.create(resources, data, fn {resources, d} ->
      create_person(resources, d)
    end)
  end

  defp create_person(resources, data) do
    company = Resources.get(resources, :company)
    owner = Resources.get(resources, :owner)

    {:ok, invitation} = Operately.Operations.CompanyMemberAdding.run(owner, %{
      full_name: data.name,
      email: create_email(company, data),
      title: data.title,
    })

    person = Operately.Repo.preload(invitation, :member).member
    person = set_avatar(person, data.avatar)
    person
  end

  defp set_avatar(person, url) do
    {:ok, person} = Operately.People.update_person(person, %{avatar_url: url})
    person
  end

  defp create_email(company, data) do
    email_handle = String.replace(data.name, " ", "-") <> "-" <> to_string(company.short_id)
    company_domain = String.replace(company.name, " ", "") |> String.downcase()

    "#{email_handle}@#{company_domain}.com"
  end

  def avatar(source) do
    "https://images.unsplash.com/#{source}?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
  end
end
