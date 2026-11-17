defmodule OperatelyWeb.Api.ExternalMutations.Mutations.ResourceHubs.Delete do
  use Operately.Support.ExternalApi.MutationSpec

  alias OperatelyWeb.Api.ExternalMutations.Mutations.Documents.DeleteHub

  @impl true
  def mutation_name, do: "resource_hubs/delete"

  @impl true
  defdelegate setup(ctx), to: DeleteHub

  @impl true
  defdelegate inputs(ctx), to: DeleteHub

  @impl true
  defdelegate assert(response, ctx), to: DeleteHub
end
