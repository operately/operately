defmodule Operately.Access do
  import Ecto.Query, warn: false
  alias Operately.Repo

  alias Operately.Access.Context

  def list_contexts do
    Repo.all(Context)
  end

  def get_context!(id), do: Repo.get!(Context, id)

  def get_context_by_project!(project_id) do
    from(c in Context, where: c.project_id == ^project_id)
    |> Repo.one!()
  end

  def create_context(attrs \\ %{}) do
    %Context{}
    |> Context.changeset(attrs)
    |> Repo.insert()
  end

  def update_context(%Context{} = context, attrs) do
    context
    |> Context.changeset(attrs)
    |> Repo.update()
  end

  def delete_context(%Context{} = context) do
    Repo.delete(context)
  end

  def change_context(%Context{} = context, attrs \\ %{}) do
    Context.changeset(context, attrs)
  end


  alias Operately.Access.Group

  def list_groups do
    Repo.all(Group)
  end

  def get_group!(id), do: Repo.get!(Group, id)

  def create_group(attrs \\ %{}) do
    %Group{}
    |> Group.changeset(attrs)
    |> Repo.insert()
  end

  def update_group(%Group{} = group, attrs) do
    group
    |> Group.changeset(attrs)
    |> Repo.update()
  end

  def delete_group(%Group{} = group) do
    Repo.delete(group)
  end

  def change_group(%Group{} = group, attrs \\ %{}) do
    Group.changeset(group, attrs)
  end


  alias Operately.Access.Binding

  def list_bindings do
    Repo.all(Binding)
  end

  def get_binding!(id), do: Repo.get!(Binding, id)

  def create_binding(attrs \\ %{}) do
    %Binding{}
    |> Binding.changeset(attrs)
    |> Repo.insert()
  end

  def update_binding(%Binding{} = binding, attrs) do
    binding
    |> Binding.changeset(attrs)
    |> Repo.update()
  end

  def delete_binding(%Binding{} = binding) do
    Repo.delete(binding)
  end

  def change_binding(%Binding{} = binding, attrs \\ %{}) do
    Binding.changeset(binding, attrs)
  end


  alias Operately.Access.GroupMembership

  def list_group_memberships do
    Repo.all(GroupMembership)
  end

  def get_group_membership!(id), do: Repo.get!(GroupMembership, id)

  def create_group_membership(attrs \\ %{}) do
    %GroupMembership{}
    |> GroupMembership.changeset(attrs)
    |> Repo.insert()
  end

  def update_group_membership(%GroupMembership{} = group_membership, attrs) do
    group_membership
    |> GroupMembership.changeset(attrs)
    |> Repo.update()
  end

  def delete_group_membership(%GroupMembership{} = group_membership) do
    Repo.delete(group_membership)
  end

  def change_group_membership(%GroupMembership{} = group_membership, attrs \\ %{}) do
    GroupMembership.changeset(group_membership, attrs)
  end
end
