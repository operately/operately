defmodule OperatelyWeb.Api.Mutations.CreateAccount do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.People.EmailActivationCode
  alias Operately.People.Account

  inputs do
    field :code, :string
    field :email, :string
    field :password, :string
    field :full_name, :string
  end

  def call(_conn, inputs) do
    with(
      {:ok, activation} <- EmailActivationCode.get(:system, email: inputs.email, code: inputs.code),
      {:ok, :valid} <- check_validity(activation),
      {:ok, _} <- create_account(inputs)
    ) do
      {:ok, %{}}
    else
      {:error, _} -> {:error, :internal_server_error}
    end
  end

  def create_account(inputs) do
    Account.registration_changeset(%{
      full_name: inputs.full_name,
      email: inputs.email,
      password: inputs.password
    })
    |> Repo.insert()
  end

  def check_validity(activation) do
    if DateTime.compare(activation.expires_at, DateTime.utc_now()) == :gt do
      {:ok, :valid}
    else
      {:error, :invalid}
    end
  end
end
