defmodule OperatelyWeb.Api.Mutations.RestoreCompanyMember do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Operations.CompanyMemberRestoring

  inputs do
    field :company_id, :string
    field :person_id, :string
  end

  outputs do
    field :something, :something  # TODO
  end

  def call(conn, inputs) do
    with(
      {:ok, me} <- find_me(conn),
      {:ok, resource} <- find_resource(me, inputs),
      {:ok, :allowed} <- authorize(company),
      {:ok, result} <- execute(CompanyMemberRestoring.run(ctx.me, ctx.attrs) end)
      {:ok, seriliazed} <- %{person: Serializer.serialize(result, level: :full)}
    ) do
      {:ok, %{something: serialized}}
    else
      {:error, :forbidden} -> {:error, :forbidden}
      {:error, :not_found} -> {:error, :not_found}
      {:error, _} -> {:error, :internal_server_error}
    end
  end

  defp authorize(resource) do
    # Permissions.check(resource.request_info.access_level, :can_do_things)
  end

  defp find_resource(me, _inputs) do
    # e.g. Project.get(me, id: inputs.project_id)
  end

  defp execute(me, resource, inputs) do
    CompanyMemberRestoring.run(me, resource, inputs)
  end
end
