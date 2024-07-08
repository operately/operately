defmodule OperatelyWeb.Api.Mutations.RemoveCompanyAdmin do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :person_id, :string
  end

  outputs do
    field :person, :person
  end

  def call(conn, inputs) do
    {:ok, id} = decode_id(inputs.person_id)
    {:ok, person} = Operately.Companies.remove_admin(me(conn), id)
    {:ok, %{person: Serializer.serialize(person)}}
  end
end
