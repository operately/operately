defmodule OperatelyWeb.Api.Mutations.CreateAccount do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.People.EmailActivationCode
  alias Operately.People.Account

  require Logger

  inputs do
    field :code, :string
    field :email, :string
    field :password, :string
    field :full_name, :string
  end

  def call(_conn, inputs) do
    with(
      {:ok, code} <- parse_code(inputs.code),
      {:ok, activation} <- EmailActivationCode.get(:system, email: inputs.email, code: code),
      {:ok, :valid} <- check_validity(activation),
      {:ok, _} <- Account.create(inputs.full_name, inputs.email, inputs.password)
    ) do
      {:ok, %{}}
    else
      {:error, error} -> 
        Logger.error("Failed to create account. error: #{inspect(error)}")
        {:error, :internal_server_error}
    end
  end

  def check_validity(activation) do
    if DateTime.compare(activation.expires_at, DateTime.utc_now()) == :gt do
      {:ok, :valid}
    else
      {:error, :invalid}
    end
  end

  defp parse_code(nil), do: {:error, :invalid_code}
  defp parse_code(code) do
    code = String.trim(code)

    cond do
      String.length(code) == 6 ->
        # code passed with without hyphen, e.e. A1B2C3
        {:ok, code}

      String.length(code) == 7 ->
        # code passed with hyphen, e.g. A1B-2C3
        code = String.slice(code, 0, 3) <> String.slice(code, 4, 6)
        {:ok, code}

      true ->
        {:error, :invalid_code}
    end
  end
end
