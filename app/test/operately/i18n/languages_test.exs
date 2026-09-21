defmodule Operately.I18n.LanguagesTest do
  use ExUnit.Case, async: true

  alias Operately.I18n.Languages

  test "defaults to English and lists supported languages" do
    assert Languages.default() == "en"
    assert Languages.supported() == ["en", "pt-BR"]
    assert Languages.feature_flag() == "i18n"
  end

  test "accepts only supported language tags" do
    assert Languages.supported?("en")
    assert Languages.supported?("pt-BR")
    refute Languages.supported?("pt")
    refute Languages.supported?("fr")
    refute Languages.supported?(nil)
    refute Languages.supported?(:"pt-BR")
  end

  test "exposes API enum atoms for supported languages" do
    assert Languages.api_values() == [:en, :"pt-BR"]
  end
end
