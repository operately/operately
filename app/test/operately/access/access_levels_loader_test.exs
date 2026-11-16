defmodule Operately.Access.AccessLevelsTest do
  use Operately.DataCase

  alias Operately.Access
  alias Operately.Access.{AccessLevels, Binding}
  alias Operately.Support.Factory

  setup ctx do
    ctx = ctx |> Factory.setup() |> Factory.add_space(:space)
    context = Access.get_context!(group_id: ctx.space.id)
    Map.put(ctx, :identifiers, [%{context_id: context.id, company_id: ctx.company.id, space_id: ctx.space.id}])
  end

  for {slot, field, resource, tag} <- [
        {:public, :company_id, :company, :anonymous},
        {:company, :company_id, :company, :standard},
        {:space, :group_id, :space, :standard}
      ] do
    test "raises on duplicate matching #{slot} bindings even with equal values", ctx do
      [identifiers] = ctx.identifiers
      resource = Map.fetch!(ctx, unquote(resource))
      group = Access.get_group!([{unquote(field), resource.id}, {:tag, unquote(tag)}])

      Repo.delete_all(from(b in Binding, where: b.context_id == ^identifiers.context_id and b.group_id == ^group.id))

      for _ <- 1..2 do
        Binding.changeset(%{context_id: identifiers.context_id, group_id: group.id, access_level: Binding.view_access()}) |> Repo.insert!()
      end

      assert_raise Ecto.MultipleResultsError, fn -> AccessLevels.load_many(ctx.identifiers) end
    end
  end

  test "a selected nil level and missing bindings default to no access", ctx do
    [identifiers] = ctx.identifiers
    group = Access.get_group!(company_id: ctx.company.id, tag: :standard)
    binding = Access.get_binding!(context_id: identifiers.context_id, group_id: group.id)
    binding |> Ecto.Changeset.change(access_level: nil) |> Repo.update!()

    assert Map.fetch!(AccessLevels.load_many(ctx.identifiers), identifiers.context_id) ==
             %AccessLevels{public: Binding.no_access(), company: Binding.no_access(), space: Binding.no_access()}
  end

  test "matches each context against its own company and space", ctx do
    other = Factory.setup(%{}) |> Factory.add_space(:space, company_permissions: Binding.edit_access())
    other_context = Access.get_context!(group_id: other.space.id)
    identifiers = %{context_id: other_context.id, company_id: other.company.id, space_id: other.space.id}
    other_space_group = Access.get_group!(group_id: other.space.id, tag: :standard)
    Binding.changeset(%{context_id: other_context.id, group_id: other_space_group.id, access_level: Binding.comment_access()}) |> Repo.insert!()

    levels = AccessLevels.load_many(ctx.identifiers ++ [identifiers])
    assert levels[other_context.id] == %AccessLevels{public: 0, company: Binding.edit_access(), space: Binding.comment_access()}
    assert levels[hd(ctx.identifiers).context_id] == %AccessLevels{public: 0, company: 0, space: 0}
  end
end
