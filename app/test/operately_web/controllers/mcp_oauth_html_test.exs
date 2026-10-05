defmodule OperatelyWeb.McpOAuthHTMLTest do
  use ExUnit.Case, async: true

  test "client emphasis can move in a sentence while names and translated markup stay literal" do
    result = OperatelyWeb.McpOAuthHTML.client_sentence("<script>literal</script> <client/>", "<img src=x> & Co") |> Phoenix.HTML.safe_to_string()
    assert result == "&lt;script&gt;literal&lt;/script&gt; <strong>&lt;img src=x&gt; &amp; Co</strong>"
  end
end
