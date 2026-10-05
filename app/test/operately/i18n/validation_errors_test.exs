defmodule Operately.I18n.ValidationErrorsTest do
  use ExUnit.Case, async: true
  alias Operately.I18n.ValidationErrors

  test "known validation errors translate at presentation time with locale-aware plurals" do
    Gettext.with_locale(OperatelyWeb.Gettext, "pt_BR", fn ->
      assert ValidationErrors.member(:full_name, "can't be blank") == "O nome não pode ficar em branco"
      assert ValidationErrors.translate({"has already been taken", []}) == "já está em uso"

      for count <- [0, 1, 2] do
        rendered = ValidationErrors.translate({"should be at least %{count} character(s)", count: count})
        assert rendered == "deve ter pelo menos #{count} #{if count == 1, do: "caractere", else: "caracteres"}"
      end
    end)
  end

  test "unknown errors and missing locales retain English and interpolate literal values" do
    for locale <- ["en", "fr"] do
      Gettext.with_locale(OperatelyWeb.Gettext, locale, fn ->
        assert ValidationErrors.member(:full_name, "can't be blank") == "Name can't be blank"
        assert ValidationErrors.translate({"should be at least %{count} character(s)", count: 2}) == "should be at least 2 character(s)"
        assert ValidationErrors.translate({"Unknown %{value}", value: "<literal>"}) == "Unknown <literal>"
      end)
    end
  end
end
