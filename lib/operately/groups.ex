defmodule Operately.Groups do
  import Ecto.Query, warn: false
  alias Operately.Repo

  alias Operately.Groups.Group
  alias Operately.Groups.Member
  alias Operately.Groups.Contact
  alias Operately.Access.Context

  alias Operately.People.Person
  alias Ecto.Multi
  alias Operately.Activities

  def archive(group) do
    group
    |> Group.changeset(%{deleted_at: DateTime.utc_now()})
    |> Repo.update()
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
      where: not p.suspended,
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

  defdelegate create_group(creator, attrs \\ %{}), to: Operately.Operations.GroupCreation, as: :run

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

  def insert_group(multi, attrs) do
    cond do
      Map.has_key?(attrs, :company_id) ->
        multi
        |> Multi.insert(:group, Group.changeset(attrs))
        |> insert_group_context

      MapSet.member?(multi.names, :company) ->
        multi
        |> Multi.insert(:group, fn changes ->
          Group.changeset(Map.merge(attrs, %{ company_id: changes[:company].id }))
        end)
        |> insert_group_context

      true ->
        raise "Include company_id in attrs or company in multi's operations"
    end
  end

  defp insert_group_context(multi) do
    multi
    |> Multi.insert(:context, fn changes ->
      Context.changeset(%{
        group_id: changes.group.id,
      })
    end)
  end

  alias Operately.Groups.Member

  def list_members(group) do
    query = (
      from p in Person,
      join: m in Member, on: m.person_id == p.id,
      where: m.group_id == ^group.id and not p.suspended
    )

    Repo.all(query)
  end

  def is_member?(group, person) do
    query = (
      from m in Member,
      join: p in Person, on: m.person_id == p.id,
      where: m.group_id == ^group.id and m.person_id == ^person.id and not p.suspended,
      limit: 1
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
      where: m.group_id == ^group_id and false,
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
