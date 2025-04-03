defmodule OperatelyWeb.Api.Mutations.JoinSpace do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Groups
  alias Operately.Groups.Permissions
  alias Operately.Access.Binding

  inputs do
    field :space_id, :id
  end

  def call(conn, inputs) do
    person = me(conn)
    access_level = Groups.get_access_level(inputs.space_id, person.id)

    cond do
      Permissions.can_join(access_level) -> execute(person, inputs.space_id)
      access_level >= Binding.view_access() -> {:error, :forbidden}
      true -> {:error, :not_found}
    end
  end

  defp execute(person, space_id) do
    {:ok, _} = Operately.Operations.SpaceJoining.run(person, space_id)
    {:ok, %{}}
  end
end
