defmodule Operately.Operations.KpiAnnotationAddingTest do
  use Operately.DataCase
  use Operately.Support.Notifications

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.KpisFixtures

  alias Operately.Kpis
  alias Operately.Activities.Activity

  setup do
    company = company_fixture()
    creator = person_fixture_with_account(%{company_id: company.id})
    champion = person_fixture_with_account(%{company_id: company.id})
    space = group_fixture(creator)
    {:ok, _} = Operately.Groups.add_members(creator, space.id, [%{id: champion.id, access_level: 70}])
    kpi = kpi_fixture(creator, %{space_id: space.id, champion_id: champion.id})

    {:ok, company: company, creator: creator, champion: champion, space: space, kpi: kpi}
  end

  test "adds an annotation to the KPI", ctx do
    {:ok, annotation} =
      Kpis.add_annotation(ctx.creator, ctx.kpi, %{
        title: "Launched enterprise plan",
        date: ~D[2026-03-15],
        created_by_id: ctx.creator.id
      })

    assert annotation.kpi_id == ctx.kpi.id
    assert annotation.title == "Launched enterprise plan"
    assert annotation.date == ~D[2026-03-15]
    assert annotation.created_by_id == ctx.creator.id
    assert length(Kpis.list_annotations(ctx.kpi.id)) == 1
  end

  test "records a kpi_annotation_added activity", ctx do
    {:ok, annotation} =
      Kpis.add_annotation(ctx.creator, ctx.kpi, %{
        title: "Launched enterprise plan",
        date: ~D[2026-03-15],
        created_by_id: ctx.creator.id
      })

    activity =
      from(a in Activity, where: a.action == "kpi_annotation_added" and a.content["annotation_id"] == ^annotation.id)
      |> Repo.one()

    assert activity
    assert activity.content["kpi_id"] == ctx.kpi.id
    assert activity.content["title"] == "Launched enterprise plan"
    assert activity.access_context_id
  end

  test "notifies the KPI champion", ctx do
    {:ok, annotation} =
      Oban.Testing.with_testing_mode(:manual, fn ->
        Kpis.add_annotation(ctx.creator, ctx.kpi, %{
          title: "Launched enterprise plan",
          date: ~D[2026-03-15],
          created_by_id: ctx.creator.id
        })
      end)

    activity =
      from(a in Activity, where: a.action == "kpi_annotation_added" and a.content["annotation_id"] == ^annotation.id)
      |> Repo.one()

    perform_job(activity.id)

    notified_ids = activity.id |> fetch_notifications() |> Enum.map(& &1.person_id)

    assert ctx.champion.id in notified_ids
  end

  test "fails validation when title is missing", ctx do
    assert {:error, :annotation, changeset, _} =
             Kpis.add_annotation(ctx.creator, ctx.kpi, %{date: ~D[2026-03-15], created_by_id: ctx.creator.id})

    assert %{title: ["can't be blank"]} = errors_on(changeset)
  end
end
