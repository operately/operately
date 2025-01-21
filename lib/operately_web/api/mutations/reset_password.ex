defmodule OperatelyWeb.Api.Mutations.ResetPassword do
  use TurboConnect.Mutation

  inputs do
    field :email, :string
    field :password, :string
    field :password_confirmation, :string
    field :reset_password_token, :string
  end

  def call(conn, inputs) do
    IO.puts("Here")
    IO.inspect(inputs)
    IO.inspect(conn)
  end
end
