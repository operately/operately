defmodule Operately.Data.AddAllPeopleToTheCompanySpace do
  alias Operately.Repo
  alias Operately.People.Person

  def run do
    Repo.all(Person)
    |> Enum.each(fn person ->
      company = Operately.Companies.get_company!(person.company_id)
      company_space = Operately.Groups.get_group!(company.company_space_id)
      members = Operately.Groups.list_members(company_space)

      if Enum.member?(members, person.id) do
        IO.puts "Person #{person.id} is already a member of the company space"
      else
        Operately.Groups.add_member(company_space, person.id)
        |> case do
          {:ok, _} -> IO.puts "Person #{person.id} added to the company space"
          {:error, reason} -> IO.puts "Failed to add person #{person.id} to the company space: #{reason}"
        end
      end
    end)
  end
end
