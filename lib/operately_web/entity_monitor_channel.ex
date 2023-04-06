defmodule OperatelyWeb.EntityMonitorChannel do
  use Phoenix.Channel

  def join("entities:lobby", _message, socket) do
    {:ok, socket}
  end
end
