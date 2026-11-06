defmodule OperatelyWeb.Api.ExternalMutations.Mutations.ResourceHubs.Create do
  use Operately.Support.ExternalApi.MutationSpec

  alias OperatelyWeb.Api.ExternalMutations.Mutations.Documents.CreateHub

  @impl true
  def mutation_name, do: "resource_hubs/create"

  @impl true
  defdelegate setup(ctx), to: CreateHub

  @impl true
  defdelegate inputs(ctx), to: CreateHub

  @impl true
  defdelegate assert(response, ctx), to: CreateHub
end
