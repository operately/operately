defmodule Operately.Operations.AgentAdding do
  alias Ecto.Multi
  alias Operately.{Access, Repo}

  defmodule Attrs do
    defstruct [:title, :full_name]
  end

  def run(author, attrs) do
    attrs = struct!(Attrs, attrs)

    Multi.new()
    |> load_company(author)
    |> load_company_space(author)
    |> insert_person(attrs)
    |> insert_definition()
    |> insert_membership_with_company_space_group()
    |> insert_binding_to_company_space()
    |> Repo.transaction()
    |> Repo.extract_result(:person)
  end

  defp load_company(multi, author) do
    Multi.put(multi, :company, Operately.Companies.get_company!(author.company_id))
  end

  defp load_company_space(multi, author) do
    Multi.put(multi, :company_space, Operately.Companies.get_company_space!(author.company_id))
  end

  defp insert_person(multi, attrs) do
    Multi.insert(multi, :person, fn %{company: company} ->
      Operately.People.Person.changeset(%{
        company_id: company.id,
        full_name: attrs.full_name,
        title: attrs.title,
        type: :ai
      })
    end)
  end

  defp insert_definition(multi) do
    Multi.insert(multi, :definition, fn %{person: person} ->
      Operately.People.AgentDef.changeset(%{
        person_id: person.id,
        definition: "",
        verbose_logs: false
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
    |> Multi.insert(:person_access_group, fn changes ->
      Access.Group.changeset(%{person_id: changes.person.id})
    end)
    |> Multi.run(:binding_to_space_group, fn _, changes ->
      context = Access.get_context!(group_id: changes.company_space.id)

      Access.create_binding(%{
        group_id: changes.person_access_group.id,
        context_id: context.id,
        access_level: Access.Binding.edit_access()
      })
    end)
  end
end
