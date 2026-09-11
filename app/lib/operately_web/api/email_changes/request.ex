defmodule OperatelyWeb.Api.EmailChanges.Request do
  use TurboConnect.Mutation
  alias Operately.People.EmailChange
  alias OperatelyWeb.Api.Serializer

  @outcomes EmailChange.outcomes()

  inputs do
    field :email, :string, null: false
  end

  outputs do
    field :outcome, :email_change_outcome, null: false
    field :state, :email_change_state, null: false
  end

  def call(conn, inputs) do
    account = conn.assigns.current_account

    case EmailChange.request(account, inputs.email) do
      {:ok, _request} ->
        {:ok, %{outcome: :success, state: Serializer.serialize(EmailChange.state(account))}}

      {:error, reason} when reason in @outcomes ->
        {:ok, %{outcome: reason, state: Serializer.serialize(EmailChange.state(account))}}

      {:error, _} ->
        {:error, :internal_server_error}
    end
  end
end
