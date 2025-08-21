defmodule OperatelyWeb.AcmeChallengeTest do
  use OperatelyWeb.ConnCase

  describe "ACME challenge error handling" do
    test "malformed ACME challenge URLs should return 404 instead of raising exception", %{conn: conn} do
      # This test covers the bug where malformed ACME challenge URLs like
      # /.well-known/acme-challenge/flower.php cause RuntimeError: unknown challenge
      conn = get(conn, "/.well-known/acme-challenge/flower.php")
      assert response(conn, 404)
    end

    test "malformed ACME challenge with various extensions should return 404", %{conn: conn} do
      extensions = [".php", ".asp", ".jsp", ".html", ".txt"]

      for ext <- extensions do
        conn = get(conn, "/.well-known/acme-challenge/malformed#{ext}")
        assert response(conn, 404), "Failed for extension: #{ext}"
      end
    end

    test "empty ACME challenge path should return 404", %{conn: conn} do
      conn = get(conn, "/.well-known/acme-challenge/")
      assert response(conn, 404)
    end

    test "ACME challenge path with invalid characters should return 404", %{conn: conn} do
      invalid_paths = [
        "/.well-known/acme-challenge/invalid%20path",
        "/.well-known/acme-challenge/../../etc/passwd",
        "/.well-known/acme-challenge/<script>alert('xss')</script>"
      ]

      for path <- invalid_paths do
        conn = get(conn, path)
        assert response(conn, 404), "Failed for path: #{path}"
      end
    end

    test "well-known paths outside of acme-challenge should still work normally", %{conn: conn} do
      # Test that other /.well-known/ paths still work as expected
      conn = get(conn, "/.well-known/other-standard")
      # This should be handled by the normal router, likely returning the page controller
      assert response(conn, 200)
    end
  end
end