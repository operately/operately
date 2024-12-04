defmodule OperatelyWeb.Api.Mutations.CreateEmailActivationCode do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :email, :string
  end

  def call(_conn, inputs) do
    with(
      {:ok, :allowed} <- check_signup_allowed(),
      {:ok, _} <- Operately.People.EmailActivationCode.create(inputs.email)
    ) do
      {:ok, %{}}
    else
      {:error, _} -> {:error, :internal_server_error}
    end
  end

  defp check_signup_allowed() do
    if Application.get_env(:operately, :allow_signup_with_email) do
      {:ok, :allowed}
    else
      {:error, :signup_not_allowed}
    end
  end

end
