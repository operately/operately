defmodule OperatelyEmail.DateFormattingTest do
  use ExUnit.Case, async: true

  alias Operately.ContextualDates.ContextualDate
  alias OperatelyEmail.DateFormatting

  test "formats calendar dates in the recipient locale and falls back to English" do
    for {locale, expected} <- [{"en", "Jan 2, 2026"}, {"pt_BR", "2 de jan. de 2026"}, {"fr", "Jan 2, 2026"}] do
      Gettext.with_locale(OperatelyWeb.Gettext, locale, fn ->
        assert DateFormatting.format(~D[2026-01-02]) == expected
        assert DateFormatting.format("2026-01-02") == expected
        assert DateFormatting.format(~U[2026-01-02 23:00:00Z]) == expected
        assert DateFormatting.format(nil) == nil
        assert DateFormatting.format("legacy value") == "legacy value"
      end)
    end
  end

  test "localizes contextual dates without changing their stored values or precision" do
    date = ~D[2026-01-02]
    month = ContextualDate.create_month_date(date)
    Gettext.with_locale(OperatelyWeb.Gettext, "pt_BR", fn ->
      assert DateFormatting.format(month) == "jan. de 2026"
      assert DateFormatting.format(ContextualDate.create_day_date(date)) == "2 de jan. de 2026"
      assert DateFormatting.format(ContextualDate.create_quarter_date(date)) == "T1 2026"
      assert DateFormatting.format(ContextualDate.create_year_date(date)) == "2026"
    end)
    assert month.value == "Jan 2026"
    assert DateFormatting.format(month) == "Jan 2026"
  end
end
