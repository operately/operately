defmodule OperatelyWeb.Api.EmailChanges.Confirm do
  use TurboConnect.Mutation
  alias Operately.People.EmailChange
  alias OperatelyWeb.Api.Serializer

  @outcomes EmailChange.outcomes()

  inputs do
    field :request_id, :string, null: false
    field :code, :string, null: false
  end

  outputs do
    field :outcome, :email_change_outcome, null: false
    field :state, :email_change_state, null: false
  end

  def call(conn, inputs) do
    account = conn.assigns.current_account

    case EmailChange.confirm(account, inputs.request_id, inputs.code) do
      :ok ->
        {:ok, %{outcome: :success, state: Serializer.serialize(EmailChange.state(account))}}

      {:error, reason} when reason in @outcomes ->
        {:ok, %{outcome: reason, state: Serializer.serialize(EmailChange.state(account))}}

      {:error, _} ->
        {:error, :internal_server_error}
    end
  end
end
