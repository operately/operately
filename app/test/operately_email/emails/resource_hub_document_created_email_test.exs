defmodule OperatelyEmail.Emails.ResourceHubDocumentCreatedEmailTest do
  use ExUnit.Case, async: true

  alias OperatelyEmail.Emails.ResourceHubDocumentCreatedEmail

  test "creation and copying have complete localized subjects" do
    author = %{full_name: "Ana Silva"}
    parent = %{name: "Space <literal>"}
    document = %{name: "Document <literal>"}

    for {copied_id, english, portuguese} <- [{nil, "added", "adicionou"}, {"original", "copied", "copiou"}],
        {locale, verb, noun} <- [{"en", english, "a document"}, {"pt_BR", portuguese, "um documento"}, {"fr", english, "a document"}] do
      Gettext.with_locale(OperatelyWeb.Gettext, locale, fn ->
        assert ResourceHubDocumentCreatedEmail.subject_text(author, parent, document, copied_id) ==
          "(Space <literal>) Ana S. #{verb} #{noun}: Document <literal>"
      end)
    end
  end
end
