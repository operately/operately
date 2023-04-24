defmodule Operately.Groups do
  @moduledoc """
  The Groups context.
  """

  import Ecto.Query, warn: false
  alias Operately.Repo

  alias Operately.Groups.Group
  alias Operately.Groups.Member
  alias Operately.People.Person

  @doc """
  Returns the list of groups.

  ## Examples

      iex> list_groups()
      [%Group{}, ...]

  """
  def list_groups do
    Repo.all(Group)
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

  @doc """
  Gets a single group.

  Raises `Ecto.NoResultsError` if the Group does not exist.

  ## Examples

      iex> get_group!(123)
      %Group{}

      iex> get_group!(456)
      ** (Ecto.NoResultsError)

  """
  def get_group!(id), do: Repo.get!(Group, id)

  @doc """
  Creates a group.

  ## Examples

      iex> create_group(%{field: value})
      {:ok, %Group{}}

      iex> create_group(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_group(attrs \\ %{}) do
    %Group{}
    |> Group.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates a group.

  ## Examples

      iex> update_group(group, %{field: new_value})
      {:ok, %Group{}}

      iex> update_group(group, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_group(%Group{} = group, attrs) do
    group
    |> Group.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a group.

  ## Examples

      iex> delete_group(group)
      {:ok, %Group{}}

      iex> delete_group(group)
      {:error, %Ecto.Changeset{}}

  """
  def delete_group(%Group{} = group) do
    Repo.delete(group)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking group changes.

  ## Examples

      iex> change_group(group)
      %Ecto.Changeset{data: %Group{}}

  """
  def change_group(%Group{} = group, attrs \\ %{}) do
    Group.changeset(group, attrs)
  end

  alias Operately.Groups.Member

  @doc """
  Returns the list of members.

  ## Examples

      iex> list_members(group)
      [%Member{}, ...]

  """
  def list_members(group) do
    query = (
      from p in Person,
      join: m in Member, on: m.person_id == p.id,
      where: m.group_id == ^group.id
    )

    Repo.all(query)
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
