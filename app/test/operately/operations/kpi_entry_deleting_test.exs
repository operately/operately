defmodule Operately.Operations.KpiEntryDeletingTest do
  use Operately.DataCase

  import Operately.CompaniesFixtures
  import Operately.GroupsFixtures
  import Operately.KpisFixtures
  import Operately.PeopleFixtures

  alias Operately.Activities.Activity
  alias Operately.Kpis
  alias Operately.Kpis.KpiEntryEdit
  alias Operately.Updates.{Comment, Reaction}

  setup do
    company = company_fixture()
    creator = person_fixture_with_account(%{company_id: company.id})
    space = group_fixture(creator)
    kpi = kpi_fixture(creator, %{space_id: space.id})
    entry = kpi_entry_fixture(creator, kpi, %{value: 40.0, period: ~D[2026-01-01]})

    {:ok, creator: creator, kpi: kpi, entry: entry}
  end

  test "removes the entry and its edit history", ctx do
    {:ok, _} = Kpis.edit_entry(ctx.creator, ctx.kpi, ctx.entry, %{value: 42.0})

    assert {:ok, deleted_entry} = Kpis.delete_entry(ctx.creator, ctx.kpi, ctx.entry)
    assert deleted_entry.id == ctx.entry.id
    assert Kpis.get_entry(ctx.entry.id) == nil
    refute Repo.exists?(from(edit in KpiEntryEdit, where: edit.kpi_entry_id == ^ctx.entry.id))
  end

  test "removes comments and their reactions", ctx do
    {:ok, comment} =
      %{
        author_id: ctx.creator.id,
        entity_id: ctx.entry.id,
        entity_type: :kpi_entry,
        content: %{"message" => "Context for this value"}
      }
      |> Comment.changeset()
      |> Repo.insert()

    {:ok, reaction} =
      %{person_id: ctx.creator.id, entity_id: comment.id, entity_type: :comment, emoji: "👍"}
      |> Reaction.changeset()
      |> Repo.insert()

    assert {:ok, _} = Kpis.delete_entry(ctx.creator, ctx.kpi, ctx.entry)
    assert Repo.get(Comment, comment.id) == nil
    assert Repo.get(Reaction, reaction.id) == nil
  end

  test "records a kpi_entry_deleted activity", ctx do
    assert {:ok, _} = Kpis.delete_entry(ctx.creator, ctx.kpi, ctx.entry)

    activity =
      from(a in Activity, where: a.action == "kpi_entry_deleted" and a.content["entry_id"] == ^ctx.entry.id)
      |> Repo.one()

    assert activity
    assert activity.content["value"] == 40.0
    assert activity.content["period"] == "2026-01-01"
    assert activity.access_context_id
  end
end
