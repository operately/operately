defmodule OperatelyWeb.Api.ExternalMutations.Mutations.Kpis.EditKpiAnnotation do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  import Operately.KpisFixtures

  @impl true
  def mutation_name, do: "kpis/edit_kpi_annotation"

  @impl true
  def setup(ctx) do
    ctx =
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)

    kpi = kpi_fixture(ctx.creator, space_id: ctx.space.id)
    annotation = kpi_annotation_fixture(ctx.creator, kpi)

    ctx
    |> Map.put(:kpi, kpi)
    |> Map.put(:annotation, annotation)
  end

  @impl true
  def inputs(ctx) do
    %{
      annotation_id: Paths.kpi_annotation_id(ctx.annotation),
      title: "Pricing change"
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert response.annotation.title == "Pricing change"
    refute Map.has_key?(response, :error)
  end
end
