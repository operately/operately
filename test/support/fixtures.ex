defmodule Operately.Support.Fixtures do
  alias Operately.Support.Fixtures.Registry

  defdelegate get(ctx, name), to: Registry

  def run(ctx, callback) do
    callback.(ctx)
  end

  def setup(ctx) do
    account = Operately.PeopleFixtures.account_fixture()
    company = Operately.CompaniesFixtures.company_fixture(%{company_name: "Acme Corp."}, account)
    creator = Ecto.assoc(company, :people) |> Operately.Repo.all() |> hd()

    ctx
    |> Registry.add(:account, account)
    |> Registry.add(:company, company)
    |> Registry.add(:creator, creator)
  end

  def add_space(ctx, name) do
    creator = Registry.get(ctx, :creator)
    space = Operately.GroupsFixtures.group_fixture(creator, %{name: atom_to_name(name)})

    Registry.add(ctx, name, space)
  end

  def add_project(ctx, name, space: space_name) do
    alias Operately.Access.Binding

    company = Registry.get(ctx, :company)
    creator = Registry.get(ctx, :creator)
    space = Registry.get(ctx, space_name)

    project = Operately.ProjectsFixtures.project_fixture(%{
      name: atom_to_name(name), 
      creator_id: creator.id,
      company_id: company.id,
      group_id: space.id,
      company_access_level: Binding.edit_access(),
      space_access_level: Binding.edit_access()
    })

    Registry.add(ctx, name, project)
  end

  def add_project_contributor(ctx, name, role: role, project: project_name, responsibility: responsibility) do
    alias Operately.Access.Binding

    company = get(ctx, :company)
    creator = get(ctx, :creator)
    project = get(ctx, project_name)

    person  = Operately.PeopleFixtures.person_fixture_with_account(%{company_id: company.id, name: "John Doe"})

    contributor = Operately.ProjectsFixtures.contributor_fixture(creator, %{
      project_id: project.id,
      person_id: person.id,
      permissions: Binding.from_atom(:edit_access),
      responsibility: responsibility,
      role: role
    })

    Registry.add(ctx, name, contributor)
  end

  def add_company_member(ctx, name) do
    company = Registry.get(ctx, :company)
    person = Operately.PeopleFixtures.person_fixture_with_account(%{company_id: company.id, name: atom_to_name(name)})

    Registry.add(ctx, name, person)
  end

  def add_space_member(ctx, person_name, space_name) do
    space = Registry.get(ctx, space_name)
    person = Registry.get(ctx, person_name)

    Operately.Groups.add_members(person, space.id, [%{
      id: person.id,
      permissions: Operately.Access.Binding.edit_access()
    }])
  end

  def edit_project_company_members_access(ctx, project_name, access_level) do
    alias Operately.Access
    alias Operately.Access.Binding

    company = get(ctx, :company)
    project = get(ctx, project_name)
    
    context = Access.get_context!(project_id: project.id)
    group = Access.get_group!(company_id: company.id, tag: :standard)
    binding = Operately.Access.get_binding(group_id: group.id, context_id: context.id)

    {:ok, _} = Operately.Access.update_binding(binding, %{access_level: Binding.from_atom(access_level)})

    ctx
  end

  def edit_project_space_members_access(ctx, project_name, space_name, access_level) do
    alias Operately.Access
    alias Operately.Access.Binding

    space = get(ctx, space_name)
    project = get(ctx, project_name)
    
    context= Access.get_context!(project_id: project.id)
    group = Access.get_group!(group_id: space.id, tag: :standard)
    binding = Operately.Access.get_binding(group_id: group.id, context_id: context.id)

    {:ok, _} = Operately.Access.update_binding(binding, %{access_level: Binding.from_atom(access_level)})

    ctx
  end

  defp atom_to_name(atom) do
    atom 
    |> Atom.to_string() 
    |> String.split("_") 
    |> Enum.join(" ") 
    |> String.capitalize()
  end

end
