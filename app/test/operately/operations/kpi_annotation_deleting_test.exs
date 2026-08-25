defmodule Operately.Operations.KpiAnnotationDeletingTest do
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

    {:ok, creator: creator, kpi: kpi, annotation: annotation}
  end

  test "removes the annotation", ctx do
    {:ok, _} = Kpis.delete_annotation(ctx.creator, ctx.kpi, ctx.annotation)

    assert Kpis.list_annotations(ctx.kpi.id) == []
  end

  test "records a kpi_annotation_deleted activity", ctx do
    {:ok, _} = Kpis.delete_annotation(ctx.creator, ctx.kpi, ctx.annotation)

    activity =
      from(a in Activity, where: a.action == "kpi_annotation_deleted" and a.content["annotation_id"] == ^ctx.annotation.id)
      |> Repo.one()

    assert activity
    assert activity.content["title"] == ctx.annotation.title
  end
end
