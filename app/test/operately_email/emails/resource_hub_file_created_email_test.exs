defmodule OperatelyEmail.Emails.ResourceHubFileCreatedEmailTest do
  use ExUnit.Case, async: true

  alias OperatelyEmail.Emails.ResourceHubFileCreatedEmail

  test "upload subjects retain literal filenames and translate plural counts" do
    author = %{full_name: "Ana Silva"}
    parent = %{name: "Space <literal>"}
    file = %{name: ~s(File "literal")}

    for {locale, single, multiple} <- [{"en", "uploaded the file", "uploaded 3 files"}, {"pt_BR", "enviou o arquivo", "enviou 3 arquivos"}, {"fr", "uploaded the file", "uploaded 3 files"}] do
      Gettext.with_locale(OperatelyWeb.Gettext, locale, fn ->
        assert ResourceHubFileCreatedEmail.subject_text(author, parent, [file]) == ~s|(Space <literal>) Ana S. #{single} "#{file.name}"|
        assert ResourceHubFileCreatedEmail.subject_text(author, parent, [file, file, file]) == "(Space <literal>) Ana S. #{multiple}"
      end)
    end
  end
end
