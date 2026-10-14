defmodule Operately.I18n.LanguagesTest do
  use ExUnit.Case, async: true

  alias Operately.I18n.Languages

  test "defaults to English and lists supported languages" do
    assert Languages.default() == "en"
    assert Languages.supported() == ["en", "pt-BR", "de", "ru", "fr", "es"]
    assert Languages.feature_flag() == "i18n"
  end

  test "accepts only supported language tags" do
    assert Languages.supported?("en")
    assert Languages.supported?("pt-BR")
    assert Languages.supported?("de")
    assert Languages.supported?("ru")
    refute Languages.supported?("pt")
    assert Languages.supported?("fr")
    assert Languages.supported?("es")
    refute Languages.supported?("nl")
    refute Languages.supported?(nil)
    refute Languages.supported?(:"pt-BR")
  end

  test "exposes API enum atoms for supported languages" do
    assert Languages.api_values() == [:en, :"pt-BR", :de, :ru, :fr, :es]
  end
end
