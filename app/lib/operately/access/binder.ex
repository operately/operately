defmodule Operately.Access.Binder do
  @moduledoc """
  Binds an access context to an access group, or unbinds them.

  Usage example:

    alias Operately.Access

    context = Access.get_context!(project_id: project_id)
    
    Access.bind_person(context, person_id, level)
    Access.unbind_person(context, person_id)
  """

  alias Operately.Repo
  alias Operately.Access
  alias Operately.Access.GroupMembership
  alias Operately.Access.Context

  def bind_person(context, person_id, level) do
    bind(context, person_id: person_id, level: level)
  end

  def unbind_person(context, person_id) do
    unbind(context, person_id: person_id)
  end

  def bind(context, person_id: person_id, level: level) do
    bind(context, access_group_id: get_group(person_id: person_id).id, level: level)
  end

  def bind(%Context{} = context, access_group_id: access_group_id, level: level) do
    case get_binding(context.id, access_group_id) do
      nil -> create_binding(context.id, access_group_id, level)
      binding -> update_binding(binding, level)
    end
  end

  def unbind(context, person_id: person_id) do
    unbind(context, access_group_id: get_group(person_id: person_id).id)
  end

  def unbind(context, access_group_id: access_group_id) do
    case get_binding(context.id, access_group_id) do
      nil -> {:ok, nil}
      binding -> {:ok, Access.delete_binding(binding)}
    end
  end

  def add_to_group(%Operately.Access.Group{} = group, person_id: person_id) do
    add_to_group(group.id, person_id: person_id)
  end

  def add_to_group(group_id, person_id: person_id) do
    Access.get_group_membership(group_id: group_id, person_id: person_id) 
    |> case do
      nil -> GroupMembership.changeset(%{group_id: group_id, person_id: person_id}) |> Repo.insert()
      membership -> {:ok, membership}
    end
  end

  def remove_from_group(%Operately.Access.Group{} = group, person_id: person_id) do
    remove_from_group(group.id, person_id: person_id)
  end

  def remove_from_group(group_id, person_id: person_id) do
    Access.get_group_membership(group_id: group_id, person_id: person_id) 
    |> case do
      nil -> {:ok, nil}
      membership -> {:ok, Access.delete_group_membership(membership)}
    end
  end

  #
  # Helpers
  #

  def get_binding(context_id, group_id) do
    Access.get_binding(context_id: context_id, group_id: group_id)
  end

  def get_group(person_id: person_id) do
    Access.get_group!(person_id: person_id)
  end

  def create_binding(context_id, access_group_id, access_level) do
    {:ok, _} = Access.create_binding(%{
      context_id: context_id, 
      group_id: access_group_id, 
      access_level: access_level
    })
  end

  def update_binding(binding, access_level) do
    {:ok, _} = Access.update_binding(binding, %{access_level: access_level})
  end

end
