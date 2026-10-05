defmodule Operately.I18n.AccessLabelsTest do
  use ExUnit.Case, async: true
  alias Operately.I18n.AccessLabels
  alias Operately.Access.Binding

  test "access presentation is translated without changing the stored labels or levels" do
    Gettext.with_locale(OperatelyWeb.Gettext, "pt_BR", fn ->
      assert AccessLabels.label(Binding.view_access()) == "Somente leitura"
      assert Binding.label(Binding.view_access()) == "View Access"
      assert AccessLabels.label(nil) == AccessLabels.label(Binding.no_access())
    end)

    Gettext.with_locale(OperatelyWeb.Gettext, "fr", fn ->
      assert AccessLabels.label(Binding.view_access()) == "View Access"
    end)
  end
end
