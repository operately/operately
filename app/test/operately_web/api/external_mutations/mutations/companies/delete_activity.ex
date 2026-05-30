defmodule OperatelyWeb.Api.ExternalMutations.Mutations.Companies.DeleteActivity do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  import Operately.ActivitiesFixtures

  alias Operately.Access.Context

  @impl true
  def mutation_name, do: "companies/delete_activity"

  @impl true
  def setup(ctx) do
    ctx = Factory.setup(ctx)
    company_context = Repo.get_by!(Context, company_id: ctx.company.id)

    activity =
      activity_fixture(%{
        author_id: ctx.creator.id,
        access_context_id: company_context.id,
        content: %{company_id: ctx.company.id}
      })

    Map.put(ctx, :activity, activity)
  end

  @impl true
  def inputs(ctx) do
    %{
      activity_id: Paths.activity_id(ctx.activity)
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert response.success
    refute Map.has_key?(response, :error)
  end
end
