defmodule OperatelyWeb.EmailPreview.Previews.CompanyMemberAddedTest do
  use ExUnit.Case, async: true

  test "preview supplies translated headings and working actions" do
    for {locale, action} <- [{"en", "added you as a company member"}, {"pt_BR", "adicionou você como membro da empresa"}] do
      Gettext.with_locale(OperatelyWeb.Gettext, locale, fn ->
        preview = OperatelyWeb.EmailPreview.Previews.CompanyMemberAdded.preview()
        assigns = Map.put(preview.email.assigns, :subject, preview.email.subject)
        assert preview.email.subject =~ action

        for body <- [OperatelyEmail.Mailers.NotificationMailer.html(preview.template, assigns), OperatelyEmail.Mailers.NotificationMailer.text(preview.template, assigns)] do
          assert body =~ action
          assert body =~ assigns.button_url
        end
      end)
    end
  end
end
