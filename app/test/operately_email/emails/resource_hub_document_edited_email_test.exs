defmodule OperatelyEmail.Emails.ResourceHubDocumentEditedEmailTest do
  use ExUnit.Case, async: true

  alias OperatelyEmail.Emails.ResourceHubDocumentEditedEmail

  test "document mentions use recipient-specific complete subjects and preserve names" do
    author = %{full_name: "Ana Silva"}
    parent = %{name: "Space <literal>"}
    document = %{name: "Document <literal>"}
    person = %Operately.People.Person{id: Ecto.UUID.generate(), full_name: "Reader"}
    mention = Operately.Support.RichText.rich_text(mentioned_people: [person]) |> Jason.decode!()
    plain = Operately.Support.RichText.rich_text("literal content")

    for {content, english, portuguese} <- [
          {mention, "mentioned you in the document", "mencionou você no documento"},
          {plain, "updated the document", "atualizou o documento"}
        ], {locale, expected} <- [{"en", english}, {"pt_BR", portuguese}, {"fr", english}] do
      Gettext.with_locale(OperatelyWeb.Gettext, locale, fn ->
        assert ResourceHubDocumentEditedEmail.subject_text(author, parent, person, document, content) ==
          ~s|(Space <literal>) Ana S. #{expected} "Document <literal>"|
      end)
    end
  end
end
