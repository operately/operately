defmodule OperatelyWeb.Api.Mutations.CreateEmailActivationCode do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :email, :string
  end

  def call(_conn, inputs) do
    with(
      {:ok, _} <- Operately.People.EmailActivationCode.create(inputs.email)
    ) do
      {:ok, %{}}
    else
      {:error, _} -> {:error, :internal_server_error}
    end
  end

end
