defmodule OperatelyWeb.Api.ExternalMutations.Mutations.Kpis.DeleteKpiAnnotation do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  import Operately.KpisFixtures

  @impl true
  def mutation_name, do: "kpis/delete_kpi_annotation"

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
    %{annotation_id: Paths.kpi_annotation_id(ctx.annotation)}
  end

  @impl true
  def assert(response, ctx) do
    assert response.annotation.id == Paths.kpi_annotation_id(ctx.annotation)
    refute Map.has_key?(response, :error)
  end
end
