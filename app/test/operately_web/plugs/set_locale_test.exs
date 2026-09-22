defmodule OperatelyWeb.Plugs.SetLocaleTest do
  use OperatelyWeb.ConnCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Plugs.SetLocale

  @backend OperatelyWeb.Gettext

  setup do
    previous = Gettext.get_locale(@backend)
    Gettext.put_locale(@backend, "en")
    on_exit(fn -> Gettext.put_locale(@backend, previous) end)

    ctx = Factory.setup(%{})
    {:ok, ctx}
  end

  test "uses English when no language preference is saved", ctx do
    conn = set_locale(ctx, accept_language: "pt-BR,pt;q=0.9")

    assert conn.assigns.locale == "en"
    assert Gettext.get_locale(@backend) == "en"
  end

  test "does not select or persist a language from Accept-Language", ctx do
    conn = set_locale(ctx, accept_language: "pt-BR")

    assert conn.assigns.locale == "en"
    assert Gettext.get_locale(@backend) == "en"
    assert Operately.Repo.reload(ctx.creator).language == nil
  end

  test "uses a saved supported language only when the i18n flag is on", ctx do
    {:ok, person} = Operately.People.update_person(ctx.creator, %{language: "pt-BR"})
    ctx = %{ctx | creator: person} |> Factory.enable_feature("i18n")

    conn = set_locale(ctx, accept_language: "fr")

    assert conn.assigns.locale == "pt-BR"
    assert Gettext.get_locale(@backend) == "pt_BR"
    assert Operately.Repo.reload(person).language == "pt-BR"
  end

  test "forces English when the flag is off without deleting the saved preference", ctx do
    {:ok, person} = Operately.People.update_person(ctx.creator, %{language: "pt-BR"})
    ctx = %{ctx | creator: person}

    conn = set_locale(ctx, accept_language: "pt-BR")

    assert conn.assigns.locale == "en"
    assert Gettext.get_locale(@backend) == "en"
    assert Operately.Repo.reload(person).language == "pt-BR"
  end

  test "uses English for unauthenticated requests", _ctx do
    conn =
      Phoenix.ConnTest.build_conn()
      |> Plug.Conn.put_req_header("accept-language", "pt-BR")
      |> SetLocale.call([])

    assert conn.assigns.locale == "en"
    assert Gettext.get_locale(@backend) == "en"
  end

  defp set_locale(ctx, accept_language: accept_language) do
    Phoenix.ConnTest.build_conn()
    |> Plug.Conn.put_req_header("accept-language", accept_language)
    |> Plug.Conn.assign(:current_person, ctx.creator)
    |> Plug.Conn.assign(:current_company, ctx.company)
    |> SetLocale.call([])
  end
end
