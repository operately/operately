defmodule Operately.Kpis.KpiAnnotationTest do
  use Operately.DataCase

  import Operately.KpisFixtures

  alias Operately.Access.Binding
  alias Operately.Kpis.KpiAnnotation
  alias Operately.Support.Factory

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_space_member(:member, :space)
    |> Factory.add_company_member(:outsider)
  end

  test "get/2 loads an annotation for a space member and denies outsiders", ctx do
    kpi = kpi_fixture(ctx.creator, space_id: ctx.space.id)
    annotation = kpi_annotation_fixture(ctx.creator, kpi)

    assert {:ok, loaded} = KpiAnnotation.get(ctx.member, id: annotation.id)
    assert loaded.id == annotation.id
    assert loaded.request_info.access_level >= Binding.view_access()

    assert {:error, :not_found} = KpiAnnotation.get(ctx.outsider, id: annotation.id)
  end
end
