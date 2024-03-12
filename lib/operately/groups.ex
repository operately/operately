defmodule Operately.Groups do
  import Ecto.Query, warn: false
  alias Operately.Repo

  alias Operately.Groups.Group
  alias Operately.Groups.Member
  alias Operately.Groups.Contact

  alias Operately.People.Person
  alias Ecto.Multi
  alias Operately.Activities

  def archive(group) do
    group
    |> Group.changeset(%{deleted_at: DateTime.utc_now()})
    |> Repo.update()
  end

  def list_groups do
    Repo.all(Group)
  end

  def list_groups_for_company(company_id) do
    query = from(group in Group, where: group.company_id == ^company_id)

    Repo.all(query)
  end

  def list_potential_members(group_id, string_query, exclude_ids, limit) do
    member_ids = Repo.all(
      from m in Member,
      where: m.group_id == ^group_id,
      select: m.person_id
    )

    query = (
      from p in Person,
      where: p.id not in ^exclude_ids and p.id not in ^member_ids,
      where: ilike(p.full_name, ^"%#{string_query}%") or ilike(p.title, ^"%#{string_query}%"),
      limit: ^limit
    )

    Repo.all(query)
  end

  def list_contacts(group) do
    query = (from c in Contact, where: c.group_id == ^group.id)

    Repo.all(query)
  end

  def get_group(nil), do: nil
  def get_group(id), do: Repo.get(Group, id)
  def get_group!(id), do: Repo.get!(Group, id)

  def get_group_by_name(name) do
    Repo.one(from g in Group, where: g.name == ^name)
  end

  def create_group(creator, attrs \\ %{}) do
    changeset = Group.changeset(Map.merge(attrs, %{
      company_id: creator.company_id,
    }))

    Multi.new()
    |> Multi.insert(:group, changeset)
    |> Multi.insert(:creator, fn %{group: group} ->
      Member.changeset(%{group_id: group.id, person_id: creator.id})
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:group)
  end

  def update_group(%Group{} = group, attrs) do
    group
    |> Group.changeset(attrs)
    |> Repo.update()
  end

  def edit_group_name_and_purpose(%Person{} = author, %Group{} = group, attrs) do
    changeset = Group.changeset(group, attrs)

    Multi.new()
    |> Multi.update(:group, changeset)
    |> Activities.insert(author.id, :group_edited, fn _ -> %{
      company_id: group.company_id,
      group_id: group.id,
      old_name: group.name,
      old_mission: group.mission,
      new_name: attrs.name,
      new_mission: attrs.mission
    } end)
    |> Repo.transaction()
    |> Repo.extract_result(:group)
  end

  def delete_group(%Group{} = group) do
    Repo.delete(group)
  end

  def change_group(%Group{} = group, attrs \\ %{}) do
    Group.changeset(group, attrs)
  end

  alias Operately.Groups.Member

  def list_members(group) do
    query = (
      from p in Person,
      join: m in Member, on: m.person_id == p.id,
      where: m.group_id == ^group.id
    )

    Repo.all(query)
  end

  def is_member?(group, person) do
    query = (
      from m in Member,
      where: m.group_id == ^group.id and m.person_id == ^person.id
    )

    Repo.one(query) != nil
  end

  def add_members(group, people_ids) do
    members = Enum.map(people_ids, fn id ->
      Member.changeset(%Member{}, %{
        group_id: group.id,
        person_id: id
      })
    end)

    members
    |> Enum.with_index()
    |> Enum.reduce(Ecto.Multi.new(), fn ({changeset, index}, multi) ->
       Ecto.Multi.insert(multi, Integer.to_string(index), changeset)
    end)
    |> Repo.transaction()
  end

  def add_member(group, people_id) do
    changeset = Member.changeset(%Member{}, %{
      group_id: group.id,
      person_id: people_id
    })

    Repo.insert(changeset)
  end

  def remove_member(group, people_id) do
    query = (
      from m in Member,
      where: m.group_id == ^group.id and m.person_id == ^people_id
    )

    Repo.delete_all(query)
  end

  def add_contact(group, name, value, type) do
    contact = %Contact{
      group_id: group.id,
      name: name,
      value: value,
      type: String.to_existing_atom(type)
    }

    Repo.insert(contact)
  end

  def list_members(group_id, limit, include_total) do
    total = if include_total do
      query = (
        from m in Member,
        where: m.group_id == ^group_id,
        select: count(m.person_id)
      )

      Repo.one(query)
    else
      nil
    end

    query = (
      from p in Person,
      join: m in Member, on: m.person_id == p.id,
      where: m.group_id == ^group_id,
      limit: ^limit
    )

    members = Repo.all(query)

    {members, total}
  end

  def set_mission(group, mission) do
    group
    |> Group.changeset(%{mission: mission})
    |> Repo.update()
  end
end
