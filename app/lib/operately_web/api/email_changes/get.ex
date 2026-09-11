defmodule OperatelyWeb.Api.EmailChanges.Get do
  use TurboConnect.Query
  alias Operately.People.EmailChange
  alias OperatelyWeb.Api.Serializer

  inputs do
  end

  outputs do
    field :state, :email_change_state, null: false
  end

  def call(conn, _inputs) do
    {:ok, %{state: Serializer.serialize(EmailChange.state(conn.assigns.current_account))}}
  end
end
