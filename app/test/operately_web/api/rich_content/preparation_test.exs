defmodule OperatelyWeb.Api.RichContent.PreparationTest do
  use ExUnit.Case, async: true
  alias OperatelyWeb.Api.RichContent.Preparation

  test "responses without authenticated company context keep source links" do
    source = Operately.Support.RichText.resource_link("/acme/projects/example")

    for assigns <- [%{}, %{current_person: nil}, %{current_company: nil}] do
      assert Preparation.prepare_response(%Plug.Conn{assigns: assigns}, source) == source
    end
  end
end
