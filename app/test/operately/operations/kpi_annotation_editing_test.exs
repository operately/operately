defmodule Operately.Operations.KpiAnnotationEditingTest do
  use Operately.DataCase

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.KpisFixtures

  alias Operately.Kpis
  alias Operately.Activities.Activity

  setup do
    company = company_fixture()
    creator = person_fixture_with_account(%{company_id: company.id})
    space = group_fixture(creator)
    kpi = kpi_fixture(creator, %{space_id: space.id})
    annotation = kpi_annotation_fixture(creator, kpi)

    {:ok, creator: creator, space: space, kpi: kpi, annotation: annotation}
  end

  test "updates the annotation title, date, and note", ctx do
    {:ok, annotation} =
      Kpis.edit_annotation(ctx.creator, ctx.kpi, ctx.annotation, %{
        title: "Pricing change",
        date: ~D[2026-04-01],
        description: "Raised starter plan"
      })

    assert annotation.title == "Pricing change"
    assert annotation.date == ~D[2026-04-01]
    assert annotation.description == "Raised starter plan"
  end

  test "records a kpi_annotation_edited activity", ctx do
    {:ok, annotation} = Kpis.edit_annotation(ctx.creator, ctx.kpi, ctx.annotation, %{title: "Pricing change"})

    activity =
      from(a in Activity, where: a.action == "kpi_annotation_edited" and a.content["annotation_id"] == ^annotation.id)
      |> Repo.one()

    assert activity
    assert activity.content["old_title"] == ctx.annotation.title
    assert activity.content["new_title"] == "Pricing change"
  end
end
