defmodule OperatelyWeb.Api.Mutations.RequestPasswordReset do
  use TurboConnect.Mutation

  inputs do
    field :email, :string
  end

  def call(conn, inputs) do
    IO.puts("Here")
    IO.inspect(inputs)
    IO.inspect(conn)
  end
end
