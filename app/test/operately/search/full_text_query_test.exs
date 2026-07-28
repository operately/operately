defmodule Operately.Search.FullTextQueryTest do
  use ExUnit.Case, async: true

  alias Operately.Search.FullTextQuery

  test "allows literal title prefixes only for non-operator queries" do
    assert FullTextQuery.build("customer research").title_prefix?
    assert FullTextQuery.build("support@operately.com").title_prefix?

    refute FullTextQuery.build(~s("customer research")).title_prefix?
    refute FullTextQuery.build("customer OR research").title_prefix?
  end

  test "carries normalized matching arguments for both query modes" do
    assert %FullTextQuery{
             normalized_title: "cafe handb",
             title_prefix: "cafe handb%",
             use_prefix?: true,
             tsquery_expr: "'cafe' & 'handb':*",
             quoted_phrase?: false
           } = FullTextQuery.build("CAFÉ handb")

    assert %FullTextQuery{
             use_prefix?: false,
             websearch_expr: ~s("customer research"),
             quoted_phrase?: true
           } = FullTextQuery.build(~s("customer research"))

    assert %FullTextQuery{
             normalized_title: "customer archive",
             title_prefix: "customer archive%",
             use_prefix?: true,
             tsquery_expr: "'customer' & 'archive':*"
           } = FullTextQuery.build("customer -archive")
  end
end
