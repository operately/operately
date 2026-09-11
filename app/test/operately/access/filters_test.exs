defmodule Operately.Access.FiltersTest do
  use Operately.DataCase

  alias Operately.Access.{Binding, Filters, GroupMembership}
  alias Operately.Projects.{Milestone, Project}
  alias Operately.Support.Factory

  setup do
    ctx = Factory.setup(%{}) |> Factory.add_space(:space) |> Factory.add_project(:project, :space) |> Factory.add_project_milestone(:milestone, :project)
    context = Operately.Access.get_context!(project_id: ctx.project.id)
    Map.put(ctx, :context, context)
  end

  for {filter, required} <- [filter_by_view_access: 10, filter_by_comment_access: 40, filter_by_edit_access: 70, filter_by_admin_access: 90, filter_by_full_access: 100] do
    test "#{filter} enforces its threshold across overlapping bindings", ctx do
      query = from p in Project, where: p.id == ^ctx.project.id
      bindings = from b in Binding, where: b.context_id == ^ctx.context.id

      for level <- Binding.valid_access_levels() do
        Repo.update_all(bindings, set: [access_level: level])
        results = apply(Filters, unquote(filter), [query, ctx.creator.id]) |> Repo.all()
        expected = if level >= unquote(required), do: [ctx.project.id], else: []
        assert Enum.map(results, & &1.id) == expected
      end
    end
  end

  test "generic access accepts atom and numeric thresholds", ctx do
    query = from p in Project, where: p.id == ^ctx.project.id
    Repo.update_all(from(b in Binding, where: b.context_id == ^ctx.context.id), set: [access_level: Binding.comment_access()])

    for level <- [:comment_access, Binding.comment_access()] do
      assert [%{id: id}] = query |> Filters.filter_by_access(ctx.creator.id, level) |> Repo.all()
      assert id == ctx.project.id
    end

    for level <- [:edit_access, Binding.edit_access()] do
      assert [] == query |> Filters.filter_by_access(ctx.creator.id, level) |> Repo.all()
    end
  end

  test "supports named bindings and parent associations", ctx do
    named_project = from m in Milestone, join: p in assoc(m, :project), as: :project, where: m.id == ^ctx.milestone.id
    parent_project = from m in Milestone, where: m.id == ^ctx.milestone.id
    named_milestone = from m in Milestone, as: :milestone, where: m.id == ^ctx.milestone.id

    for {query, opts} <- [
      {parent_project, []},
      {named_project, [named_binding: :project]},
      {parent_project, [join_parent: :project]},
      {named_milestone, [join_parent: :project, named_binding: :milestone]}
    ] do
      filtered = Filters.filter_by_view_access(query, ctx.creator.id, opts)
      assert [%{id: id}] = Repo.all(filtered)
      assert id == ctx.milestone.id

      # The context binding remains available to callers that compose the query.
      assert [ctx.context.id] == Repo.all(from [context: c] in filtered, select: c.id)

      assert [] == Filters.filter_by_view_access(query, Ecto.UUID.generate(), opts) |> Repo.all()
    end
  end

  test "suspended requesters retain no access through membership", ctx do
    ctx.creator |> Ecto.Changeset.change(suspended_at: DateTime.utc_now() |> DateTime.truncate(:second)) |> Repo.update!()
    assert [] == Project |> Filters.filter_by_view_access(ctx.creator.id) |> Repo.all()
  end

  test "requesters without memberships have no access", ctx do
    Repo.delete_all(from m in GroupMembership, where: m.person_id == ^ctx.creator.id)
    assert [] == Project |> Filters.filter_by_view_access(ctx.creator.id) |> Repo.all()
  end

  test "permission overlap does not duplicate counts or consume the limit", ctx do
    ctx = Factory.add_project(ctx, :other_project, :space)
    query = from p in Project, where: p.company_id == ^ctx.company.id, order_by: p.id
    filtered = Filters.filter_by_view_access(query, ctx.creator.id)

    assert Repo.aggregate(filtered, :count) == 2
    assert Enum.map(Repo.all(from p in filtered, limit: 2), & &1.id) == Enum.sort([ctx.project.id, ctx.other_project.id])
  end

  test "caller-provided distinct and projection are preserved", ctx do
    Factory.add_project(ctx, :other_project, :space)
    query = from p in Project, where: p.company_id == ^ctx.company.id, select: p.company_id, distinct: true
    assert [ctx.company.id] == query |> Filters.filter_by_view_access(ctx.creator.id) |> Repo.all()
  end

  test "root soft deletion and with_deleted retain their behavior", ctx do
    Repo.soft_delete!(ctx.project)
    query = from(p in Project, where: p.id == ^ctx.project.id) |> Filters.filter_by_view_access(ctx.creator.id)
    assert Repo.all(query) == []
    assert [%{id: id}] = Repo.all(query, with_deleted: true)
    assert id == ctx.project.id
  end

  test "forbidden_or_not_found distinguishes viewable resources", ctx do
    query = from p in Project, where: p.id == ^ctx.project.id
    assert Filters.forbidden_or_not_found(query, ctx.creator.id) == {:error, :forbidden}
    assert Filters.forbidden_or_not_found(query, Ecto.UUID.generate()) == {:error, :not_found}
    assert Filters.forbidden_or_not_found(from(p in Project, where: false), ctx.creator.id) == {:error, :not_found}
    milestone = from m in Milestone, where: m.id == ^ctx.milestone.id
    assert Filters.forbidden_or_not_found(milestone, ctx.creator.id, join_parent: :project) == {:error, :forbidden}
  end
end
