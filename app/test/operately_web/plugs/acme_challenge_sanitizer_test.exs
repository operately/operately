defmodule OperatelyWeb.Plugs.AcmeChallengeSanitizerTest do
  use ExUnit.Case, async: true
  use Plug.Test

  alias OperatelyWeb.Plugs.AcmeChallengeSanitizer

  describe "ACME challenge sanitizer" do
    test "allows non-ACME challenge paths to pass through" do
      conn = conn(:get, "/some/other/path")
      result = AcmeChallengeSanitizer.call(conn, [])
      
      refute result.halted
      assert result.status == nil  # No response set
    end

    test "allows valid ACME challenge tokens" do
      valid_tokens = [
        "validtoken123",
        "valid-token_123", 
        "VALID_TOKEN-123"
      ]

      for token <- valid_tokens do
        conn = conn(:get, "/.well-known/acme-challenge/#{token}")
        result = AcmeChallengeSanitizer.call(conn, [])
        
        refute result.halted, "Valid token #{token} should not be halted"
      end
    end

    test "blocks empty ACME challenge path" do
      conn = conn(:get, "/.well-known/acme-challenge/")
      result = AcmeChallengeSanitizer.call(conn, [])
      
      assert result.halted
      assert result.status == 404
    end

    test "blocks ACME challenge tokens with file extensions" do
      invalid_tokens = [
        "flower.php",
        "test.html", 
        "challenge.txt",
        "script.js"
      ]

      for token <- invalid_tokens do
        conn = conn(:get, "/.well-known/acme-challenge/#{token}")
        result = AcmeChallengeSanitizer.call(conn, [])
        
        assert result.halted, "Token with extension #{token} should be blocked"
        assert result.status == 404
      end
    end

    test "blocks ACME challenge tokens with invalid characters" do
      invalid_tokens = [
        "invalid%20path",
        "../../etc/passwd", 
        "<script>alert('xss')</script>",
        "token with spaces",
        "token@with#symbols"
      ]

      for token <- invalid_tokens do
        conn = conn(:get, "/.well-known/acme-challenge/#{token}")
        result = AcmeChallengeSanitizer.call(conn, [])
        
        assert result.halted, "Invalid token #{token} should be blocked"
        assert result.status == 404
      end
    end

    test "blocks ACME challenge tokens that are too long" do
      # Create a token longer than 128 characters
      long_token = String.duplicate("a", 129)
      
      conn = conn(:get, "/.well-known/acme-challenge/#{long_token}")
      result = AcmeChallengeSanitizer.call(conn, [])
      
      assert result.halted
      assert result.status == 404
    end
  end
end