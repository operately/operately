defmodule OperatelyWeb.Api.Mutations.EditProjectCheckIn do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :check_in_id, :string
    field :status, :string
    field :description, :string
  end

  outputs do
    field :check_in, :project_check_in
  end

  def call(conn, inputs) do
    {:ok, check_in_id} = decode_id(inputs.check_in_id)

    author = me(conn)
    status = inputs.status
    description = Jason.decode!(inputs.description)

    {:ok, check_in} = Operately.Operations.ProjectCheckInEdit.run(author, check_in_id, status, description)
    {:ok, %{check_in: Serializer.serialize(check_in, level: :essential)}}
  end
end
