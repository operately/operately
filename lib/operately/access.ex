defmodule Operately.Access do
  import Ecto.Query, warn: false
  alias Operately.Repo

  alias Operately.Access.AccessContext

  def list_access_contexts do
    Repo.all(AccessContext)
  end

  def get_access_context!(id), do: Repo.get!(AccessContext, id)

  def create_access_context(attrs \\ %{}) do
    %AccessContext{}
    |> AccessContext.changeset(attrs)
    |> Repo.insert()
  end

  def update_access_context(%AccessContext{} = access_context, attrs) do
    access_context
    |> AccessContext.changeset(attrs)
    |> Repo.update()
  end

  def delete_access_context(%AccessContext{} = access_context) do
    Repo.delete(access_context)
  end

  def change_access_context(%AccessContext{} = access_context, attrs \\ %{}) do
    AccessContext.changeset(access_context, attrs)
  end


  alias Operately.Access.AccessGroup

  def list_access_groups do
    Repo.all(AccessGroup)
  end

  def get_access_group!(id), do: Repo.get!(AccessGroup, id)

  def create_access_group(attrs \\ %{}) do
    %AccessGroup{}
    |> AccessGroup.changeset(attrs)
    |> Repo.insert()
  end

  def update_access_group(%AccessGroup{} = access_group, attrs) do
    access_group
    |> AccessGroup.changeset(attrs)
    |> Repo.update()
  end

  def delete_access_group(%AccessGroup{} = access_group) do
    Repo.delete(access_group)
  end

  def change_access_group(%AccessGroup{} = access_group, attrs \\ %{}) do
    AccessGroup.changeset(access_group, attrs)
  end


  alias Operately.Access.AccessBinding

  def list_access_bindings do
    Repo.all(AccessBinding)
  end

  def get_access_binding!(id), do: Repo.get!(AccessBinding, id)

  def create_access_binding(attrs \\ %{}) do
    %AccessBinding{}
    |> AccessBinding.changeset(attrs)
    |> Repo.insert()
  end

  def update_access_binding(%AccessBinding{} = access_binding, attrs) do
    access_binding
    |> AccessBinding.changeset(attrs)
    |> Repo.update()
  end

  def delete_access_binding(%AccessBinding{} = access_binding) do
    Repo.delete(access_binding)
  end

  def change_access_binding(%AccessBinding{} = access_binding, attrs \\ %{}) do
    AccessBinding.changeset(access_binding, attrs)
  end


  alias Operately.Access.AccessGroupMembership

  def list_access_group_memberships do
    Repo.all(AccessGroupMembership)
  end

  def get_access_group_membership!(id), do: Repo.get!(AccessGroupMembership, id)

  def create_access_group_membership(attrs \\ %{}) do
    %AccessGroupMembership{}
    |> AccessGroupMembership.changeset(attrs)
    |> Repo.insert()
  end

  def update_access_group_membership(%AccessGroupMembership{} = access_group_membership, attrs) do
    access_group_membership
    |> AccessGroupMembership.changeset(attrs)
    |> Repo.update()
  end

  def delete_access_group_membership(%AccessGroupMembership{} = access_group_membership) do
    Repo.delete(access_group_membership)
  end

  def change_access_group_membership(%AccessGroupMembership{} = access_group_membership, attrs \\ %{}) do
    AccessGroupMembership.changeset(access_group_membership, attrs)
  end
end
