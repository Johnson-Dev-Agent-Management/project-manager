"""Exercise the actual workflow script with a mocked GitHub API; no credentials needed."""

import contextlib
import io
import json
import os
from pathlib import Path
import tempfile
import textwrap
import unittest
from unittest.mock import patch
from urllib.error import HTTPError


ROOT = Path(__file__).resolve().parents[1]
WORKFLOW = ROOT / ".github/workflows/pr-attribution.yml"
SOURCE = textwrap.dedent(
    WORKFLOW.read_text().split("python3 - <<'PY'\n", 1)[1].rsplit("\n          PY", 1)[0]
)
SCRIPT = compile(SOURCE, str(WORKFLOW), "exec")
DESCRIPTION = "Changes primarily implemented by an AI coding agent."
LABEL = {"name": "AI-authored", "description": DESCRIPTION}


class AttributionTests(unittest.TestCase):
    def run_workflow(self, body, label=LABEL, create_error=None, get_error=None):
        calls = []

        def respond(req, timeout):
            path = req.full_url.split("/repos/example/project/", 1)[1]
            data = json.loads(req.data) if req.data is not None else None
            calls.append((req.method, path, data))
            self.assertEqual(timeout, 20)
            self.assertEqual(req.get_header("Authorization"), "Bearer test-token")
            if path == "pulls/7":
                if get_error:
                    raise HTTPError(req.full_url, get_error, "denied", {}, None)
                result = {"body": body}
            elif req.method == "GET":
                gets = sum(method == "GET" and url == path for method, url, _ in calls)
                if label is None and gets == 1:
                    raise HTTPError(req.full_url, 404, "missing", {}, None)
                result = label or LABEL
            elif req.method == "POST" and path == "labels":
                if create_error:
                    raise HTTPError(req.full_url, create_error, "create failed", {}, None)
                result = LABEL
            else:
                result = LABEL
            return io.BytesIO(json.dumps(result).encode())

        with tempfile.TemporaryDirectory() as directory:
            event_path = Path(directory) / "event.json"
            # The event is deliberately stale; only the fetched body should count.
            event_path.write_text(json.dumps({
                "number": 7, "pull_request": {"body": "Implementation type: AI"},
            }))
            env = {
                "GITHUB_EVENT_PATH": str(event_path),
                "GITHUB_API_URL": "https://api.github.com",
                "GITHUB_REPOSITORY": "example/project",
                "GH_TOKEN": "test-token",
            }
            with patch.dict(os.environ, env), patch("urllib.request.urlopen", respond):
                with contextlib.redirect_stdout(io.StringIO()):
                    try:
                        exec(SCRIPT, {})
                    except SystemExit as error:
                        self.assertEqual(error.code, 0)
        return calls

    def test_ai_agent_names_and_line_endings(self):
        for agent in ("Codex Cloud", "Another agent"):
            for newline in ("\n", "\r\n"):
                with self.subTest(agent=agent, newline=newline):
                    calls = self.run_workflow(newline.join([
                        "## Implementation author", "Implementation type: AI",
                        f"Implementation author: {agent}",
                    ]))
                    self.assertEqual(calls[-1], (
                        "POST", "issues/7/labels", {"labels": ["AI-authored"]},
                    ))
                    self.assertEqual(len(calls), 3)

    def test_non_ai_and_examples_do_not_label(self):
        bodies = [
            None, "", "Implementation type: Human", "Implemented by Codex Cloud",
            "Implementation type: ai", "Implementation type: AI extra",
            "Implementation type: AI\nImplementation type: Human",
            "Implementation type: AI\nImplementation type: AI",
            "> Implementation type: AI", "    Implementation type: AI",
            "<!--\nImplementation type: AI\n-->",
            "<!--\nImplementation type: AI",
            "```text\nImplementation type: AI\n```",
            "~~~text\nImplementation type: AI\n~~~",
            (ROOT / ".github/pull_request_template.md").read_text(),
        ]
        for body in bodies:
            with self.subTest(body=body):
                self.assertEqual(self.run_workflow(body), [("GET", "pulls/7", None)])

    def test_ai_after_example_is_detected(self):
        calls = self.run_workflow(
            "````text\nImplementation type: Human\n```\n````\n"
            "Implementation type: AI"
        )
        self.assertEqual(calls[-1][1], "issues/7/labels")

    def test_pr_body_is_not_executed(self):
        calls = self.run_workflow(
            "Implementation type: AI\n$(exit 99)\n"
            "${{ secrets.GITHUB_TOKEN }}\n__import__('sys').exit(99)"
        )
        self.assertEqual(calls[-1][1], "issues/7/labels")

    def test_missing_label_created_with_required_description(self):
        calls = self.run_workflow("Implementation type: AI", label=None)
        self.assertEqual(calls[2], ("POST", "labels", {
            "name": "AI-authored", "color": "7057ff", "description": DESCRIPTION,
        }))

    def test_existing_label_metadata_corrected(self):
        calls = self.run_workflow("Implementation type: AI", label={
            "name": "ai-authored", "description": "Old description",
        })
        self.assertEqual(calls[2], ("PATCH", "labels/AI-authored", {
            "new_name": "AI-authored", "description": DESCRIPTION,
        }))

    def test_concurrent_label_creation_recovers(self):
        calls = self.run_workflow("Implementation type: AI", label=None, create_error=422)
        self.assertEqual(calls[3], ("GET", "labels/AI-authored", None))
        self.assertEqual(calls[-1][1], "issues/7/labels")

    def test_permission_and_api_errors_fail(self):
        for status in (401, 403, 500):
            with self.subTest(status=status):
                with self.assertRaises(HTTPError):
                    self.run_workflow("Implementation type: AI", get_error=status)
                with self.assertRaises(HTTPError):
                    self.run_workflow("Implementation type: AI", label=None, create_error=status)


if __name__ == "__main__":
    unittest.main()
