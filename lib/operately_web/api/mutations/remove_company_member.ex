defmodule OperatelyWeb.Api.Mutations.RemoveCompanyMember do
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
    person = me(conn)

    if person.company_role == :admin do
      {:ok, person} = Operately.Operations.CompanyMemberRemoving.run(person, id)
      {:ok, %{person: Serializer.serialize(person)}}
    else
      {:error, :bad_request, "Only admins can remove members"}
    end
  end
end
