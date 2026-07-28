defmodule Operately.Search.Query.FullTextTest do
  use ExUnit.Case, async: true

  alias Operately.Search.Query.FullText

  test "allows literal title prefixes only for non-operator queries" do
    assert FullText.build("customer research").title_prefix?
    assert FullText.build("support@operately.com").title_prefix?

    refute FullText.build(~s("customer research")).title_prefix?
    refute FullText.build("customer OR research").title_prefix?
  end

  test "carries normalized matching arguments for both query modes" do
    assert %FullText{
             normalized_title: "cafe handb",
             title_prefix: "cafe handb%",
             use_prefix?: true,
             tsquery_expr: "'cafe' & 'handb':*",
             quoted_phrase?: false
           } = FullText.build("CAFÉ handb")

    assert %FullText{
             use_prefix?: false,
             websearch_expr: ~s("customer research"),
             quoted_phrase?: true
           } = FullText.build(~s("customer research"))

    assert %FullText{
             normalized_title: "customer archive",
             title_prefix: "customer archive%",
             use_prefix?: true,
             tsquery_expr: "'customer' & 'archive':*"
           } = FullText.build("customer -archive")
  end
end
